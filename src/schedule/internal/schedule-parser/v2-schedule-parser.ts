import { XlsDownloaderInterface } from "../xls-downloader/xls-downloader.interface";

import * as XLSX from "xlsx";
import { Range, WorkSheet } from "xlsx";
import { toNormalString, trimAll } from "../../../utility/string.util";
import { plainToClass, plainToInstance } from "class-transformer";
import * as objectHash from "object-hash";
import { V2LessonTimeDto } from "../../dto/v2/v2-lesson-time.dto";
import { V2LessonType } from "../../enum/v2-lesson-type.enum";
import { V2LessonSubGroupDto } from "../../dto/v2/v2-lesson-sub-group.dto";
import { V2LessonDto } from "../../dto/v2/v2-lesson.dto";
import { V2DayDto } from "../../dto/v2/v2-day.dto";
import { V2GroupDto } from "../../dto/v2/v2-group.dto";
import * as assert from "node:assert";
import { ScheduleReplacerService } from "../../schedule-replacer.service";
import { V2TeacherDto } from "../../dto/v2/v2-teacher.dto";
import { V2TeacherDayDto } from "../../dto/v2/v2-teacher-day.dto";
import { V2TeacherLessonDto } from "../../dto/v2/v2-teacher-lesson.dto";

type InternalId = {
	/**
	 * Индекс строки
	 */
	row: number;

	/**
	 * Индекс столбца
	 */
	column: number;

	/**
	 * Текст записи
	 */
	name: string;
};

type InternalTime = {
	/**
	 * Временной отрезок
	 */
	timeRange: V2LessonTimeDto;

	/**
	 * Тип пары на этой строке
	 */
	lessonType: V2LessonType;

	/**
	 * Индекс пары на этой строке
	 */
	defaultIndex?: number;

	/**
	 * Позиции начальной и конечной записи
	 */
	xlsxRange: Range;
};

export class V2ScheduleParseResult {
	/**
	 * ETag расписания
	 */
	etag: string;

	/**
	 * Идентификатор заменённого расписания (ObjectId)
	 */
	replacerId?: string;

	/**
	 * Дата загрузки расписания на сайт политехникума
	 */
	uploadedAt: Date;

	/**
	 * Дата загрузки расписания с сайта политехникума
	 */
	downloadedAt: Date;

	/**
	 * Расписание групп в виде списка.
	 * Ключ - название группы.
	 */
	groups: Array<V2GroupDto>;

	/**
	 * Расписание преподавателей в виде списка.
	 * Ключ - ФИО преподавателя
	 */
	teachers: Array<V2TeacherDto>;

	/**
	 * Список групп у которых было обновлено расписание с момента последнего обновления файла.
	 * Ключ - название группы.
	 */
	updatedGroups: Array<Array<number>>;

	/**
	 * Список преподавателей у которых было обновлено расписание с момента последнего обновления файла.
	 * Ключ - ФИО преподавателя.
	 */
	updatedTeachers: Array<Array<number>>;
}

export class V2ScheduleParser {
	private lastResult: V2ScheduleParseResult | null = null;

	/**
	 * @param xlsDownloader - класс для загрузки расписания с сайта политехникума
	 * @param scheduleReplacerService - сервис для подмены расписания
	 */
	public constructor(
		private readonly xlsDownloader: XlsDownloaderInterface,
		private readonly scheduleReplacerService?: ScheduleReplacerService,
	) {}

	/**
	 * Получает позиции начальной и конечной записи относительно начальной записи
	 * @param workSheet - xls лист
	 * @param topRow - индекс начальной строки
	 * @param leftColumn - индекс начального столбца
	 * @returns {Range} - позиции начальной и конечной записи
	 * @private
	 * @static
	 */
	private static getMergeFromStart(
		workSheet: XLSX.WorkSheet,
		topRow: number,
		leftColumn: number,
	): Range {
		for (const range of workSheet["!merges"]) {
			if (topRow === range.s.r && leftColumn === range.s.c) return range;
		}

		return {
			s: { r: topRow, c: leftColumn },
			e: { r: topRow, c: leftColumn },
		};
	}

	/**
	 * Получает текст из требуемой записи
	 * @param worksheet - xls лист
	 * @param row - индекс строки
	 * @param column - индекс столбца
	 * @returns {string | null} - текст записи, если присутствует
	 * @private
	 * @static
	 */
	private static getCellData(
		worksheet: XLSX.WorkSheet,
		row: number,
		column: number,
	): string | null {
		const cell: XLSX.CellObject | null =
			worksheet[XLSX.utils.encode_cell({ r: row, c: column })];

		return toNormalString(cell?.w);
	}

	/**
	 * Парсит информацию о паре исходя из текста в записи
	 * @param lessonName - текст в записи
	 * @returns {{
	 * 		name: string;
	 * 		subGroups: Array<V2LessonSubGroupDto>;
	 * 	}} - название пары и список подгрупп
	 * @private
	 * @static
	 */
	private static parseNameAndSubGroups(lessonName: string): {
		name: string;
		subGroups: Array<V2LessonSubGroupDto>;
	} {
		// хд

		const allRegex =
			/(?:[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.\s?[А-ЯЁ]\.(?:\s?\([0-9]\s?подгруппа\))?(?:,\s)?)+$/gm;
		const teacherAndSubGroupRegex =
			/(?:[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.\s?[А-ЯЁ]\.(?:\s?\([0-9]\s?подгруппа\))?)+/gm;

		const allMatch = allRegex.exec(lessonName);

		// если не ничё не найдено
		if (allMatch === null) return { name: lessonName, subGroups: [] };

		const all: Array<string> = [];

		let allInnerMatch: RegExpExecArray;
		while (
			(allInnerMatch = teacherAndSubGroupRegex.exec(allMatch[0])) !== null
		) {
			if (allInnerMatch.index === teacherAndSubGroupRegex.lastIndex)
				teacherAndSubGroupRegex.lastIndex++;

			all.push(allInnerMatch[0].trim());
		}

		// парадокс
		if (all.length === 0) {
			throw new Error("Парадокс");
		}

		const subGroups: Array<V2LessonSubGroupDto> = [];

		for (const teacherAndSubGroup of all) {
			const teacherRegex = /[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.\s?[А-ЯЁ]\./g;
			const subGroupRegex = /\([0-9]\s?подгруппа\)/g;

			const teacherMatch = teacherRegex.exec(teacherAndSubGroup);
			if (teacherMatch === null) throw new Error("Парадокс");

			let teacherFIO = teacherMatch[0];
			const teacherSpaceIndex = teacherFIO.indexOf(" ") + 1;
			const teacherIO = teacherFIO
				.substring(teacherSpaceIndex)
				.replaceAll("s", "");

			teacherFIO = `${teacherFIO.substring(0, teacherSpaceIndex)}${teacherIO}`;

			const subGroupMatch = subGroupRegex.exec(teacherAndSubGroup);
			const subGroup = subGroupMatch
				? Number.parseInt(subGroupMatch[0][1])
				: 1;

			subGroups.push(
				plainToClass(V2LessonSubGroupDto, {
					teacher: teacherFIO,
					number: subGroup,
					cabinet: "",
				}),
			);
		}

		for (const index in subGroups) {
			if (subGroups.length === 1) {
				break;
			}

			// бляздец
			switch (index) {
				case "0":
					subGroups[index].number =
						subGroups[+index + 1].number === 2 ? 1 : 2;
					continue;
				case "1":
					subGroups[index].number =
						subGroups[+index - 1].number === 1 ? 2 : 1;
					continue;
				default:
					subGroups[index].number = +index;
			}
		}

		return {
			name: lessonName.substring(0, allMatch.index).trim(),
			subGroups: subGroups,
		};
	}

	/**
	 * Парсит информацию о группах и днях недели
	 * @param workSheet - xls лист
	 * @returns {{
	 * 		groupSkeletons: Array<InternalId>;
	 * 		daySkeletons: Array<InternalId>;
	 * 	}} - список с индексами и текстом записей групп и дней недели
	 * @private
	 * @static
	 */
	private static parseSkeleton(workSheet: XLSX.WorkSheet): {
		groupSkeletons: Array<InternalId>;
		daySkeletons: Array<InternalId>;
	} {
		const range = XLSX.utils.decode_range(workSheet["!ref"] || "");
		let isHeaderParsed: boolean = false;

		const groups: Array<InternalId> = [];
		const days: Array<InternalId> = [];

		for (let row = range.s.r + 1; row <= range.e.r; ++row) {
			const dayName = V2ScheduleParser.getCellData(workSheet, row, 0);
			if (!dayName) continue;

			if (!isHeaderParsed) {
				isHeaderParsed = true;

				--row;
				for (
					let column = range.s.c + 2;
					column <= range.e.c;
					++column
				) {
					const groupName = V2ScheduleParser.getCellData(
						workSheet,
						row,
						column,
					);
					if (!groupName) continue;

					groups.push({ row: row, column: column, name: groupName });
				}
				++row;
			}

			if (
				days.length == 0 ||
				!days[days.length - 1].name.startsWith("Суббота")
			) {
				const dayMonthIdx = /[А-Яа-я]+\s(\d+)\.\d+\.\d+/.exec(
					trimAll(dayName),
				);

				if (dayMonthIdx === null) continue;
			}

			days.push({
				row: row,
				column: 0,
				name: dayName,
			});

			if (
				days.length > 2 &&
				days[days.length - 2].name.startsWith("Суббота")
			)
				break;
		}

		return { daySkeletons: days, groupSkeletons: groups };
	}

	/**
	 * Возвращает текущий класс для скачивания xls файлов
	 * @returns {XlsDownloaderInterface} - класс для скачивания xls файлов
	 */
	getXlsDownloader(): XlsDownloaderInterface {
		return this.xlsDownloader;
	}

	private static convertGroupsToTeachers(
		groups: Array<V2GroupDto>,
	): Array<V2TeacherDto> {
		const result: Array<V2TeacherDto> = [];

		for (const groupName in groups) {
			const group = groups[groupName];

			for (const day of group.days) {
				for (const lesson of day.lessons) {
					if (lesson.type !== V2LessonType.DEFAULT) continue;

					for (const subGroup of lesson.subGroups) {
						let teacherDto: V2TeacherDto = result[subGroup.teacher];

						if (!teacherDto) {
							teacherDto = result[subGroup.teacher] =
								new V2TeacherDto();

							teacherDto.name = subGroup.teacher;
							teacherDto.days = [];
						}

						let teacherDay: V2TeacherDayDto =
							teacherDto.days[day.name];

						if (!teacherDay) {
							teacherDay = teacherDto.days[day.name] =
								new V2TeacherDayDto();

							// TODO: Что это блять такое?
							// noinspection JSConstantReassignment
							teacherDay.name = day.name;
							teacherDay.date = day.date;
							teacherDay.lessons = [];
						}

						const teacherLesson = structuredClone(
							lesson,
						) as V2TeacherLessonDto;
						teacherLesson.group = groupName;

						teacherDay.lessons.push(teacherLesson);
					}
				}
			}
		}

		for (const teacherName in result) {
			const teacher = result[teacherName];

			const days = teacher.days;

			for (const dayName in days) {
				const day = days[dayName];
				delete days[dayName];

				day.lessons.sort(
					(a, b) => a.time.start.valueOf() - b.time.start.valueOf(),
				);

				days.push(day);
			}

			days.sort((a, b) => a.date.valueOf() - b.date.valueOf());
		}

		return result;
	}

	/**
	 * Возвращает текущее расписание
	 * @returns {V2ScheduleParseResult} - расписание
	 * @async
	 */
	async getSchedule(): Promise<V2ScheduleParseResult> {
		const headData = await this.xlsDownloader.fetch(true);
		this.xlsDownloader.verifyFetchResult(headData);

		assert(headData.type === "success");

		const replacer = this.scheduleReplacerService
			? await this.scheduleReplacerService.getByEtag(headData.etag)
			: null;

		if (this.lastResult && this.lastResult.etag === headData.etag) {
			if (!replacer) return this.lastResult;

			if (this.lastResult.replacerId === replacer.id)
				return this.lastResult;
		}

		const buffer = async () => {
			if (replacer) return replacer.data;

			const downloadData = await this.xlsDownloader.fetch(false);
			this.xlsDownloader.verifyFetchResult(downloadData);

			assert(downloadData.type === "success");

			return downloadData.data;
		};

		const workBook = XLSX.read(await buffer());
		const workSheet = workBook.Sheets[workBook.SheetNames[0]];

		const { groupSkeletons, daySkeletons } =
			V2ScheduleParser.parseSkeleton(workSheet);

		const groups: Array<V2GroupDto> = [];

		const daysTimes: Array<Array<InternalTime>> = [];
		let daysTimesFilled = false;

		for (const groupSkeleton of groupSkeletons) {
			const group = new V2GroupDto();
			group.name = groupSkeleton.name;
			group.days = [];

			for (let dayIdx = 0; dayIdx < daySkeletons.length - 1; ++dayIdx) {
				const daySkeleton = daySkeletons[dayIdx];
				const day = new V2DayDto();
				{
					const daySpaceIndex = daySkeleton.name.indexOf(" ");
					day.name = daySkeleton.name.substring(0, daySpaceIndex);

					const dateString = daySkeleton.name.substring(
						daySpaceIndex + 1,
					);
					const parseableDateString = `${dateString.substring(3, 5)}.${dateString.substring(0, 2)}.${dateString.substring(6)}`;
					day.date = new Date(Date.parse(parseableDateString));

					day.lessons = [];
				}

				const lessonTimeColumn = daySkeletons[0].column + 1;
				const rowDistance =
					daySkeletons[dayIdx + 1].row - daySkeleton.row;

				const dayTimes: Array<InternalTime> = daysTimesFilled
					? daysTimes[day.name]
					: [];

				if (!daysTimesFilled) {
					for (
						let row = daySkeleton.row;
						row < daySkeleton.row + rowDistance;
						++row
					) {
						const time = V2ScheduleParser.getCellData(
							workSheet,
							row,
							lessonTimeColumn,
						)?.replaceAll(/[\s\t\n\r]/g, "");

						if (!time) continue;

						// type
						const lessonType = time.includes("пара")
							? V2LessonType.DEFAULT
							: V2LessonType.ADDITIONAL;

						const defaultIndex =
							lessonType === V2LessonType.DEFAULT
								? +time[0]
								: null;

						// time
						const timeRange = new V2LessonTimeDto();

						timeRange.start = new Date(day.date);
						timeRange.end = new Date(day.date);

						const timeString = time.replaceAll(".", ":");
						const timeRegex = /(\d+:\d+)-(\d+:\d+)/g;

						const parseResult = timeRegex.exec(timeString);
						if (!parseResult) {
							throw new Error(
								"Не удалось узнать начало и конец пар!",
							);
						}

						const startStrings = parseResult[1].split(":");
						timeRange.start.setHours(+startStrings[0]);
						timeRange.start.setMinutes(+startStrings[1]);

						const endStrings = parseResult[2].split(":");
						timeRange.end.setHours(+endStrings[0]);
						timeRange.end.setMinutes(+endStrings[1]);

						dayTimes.push({
							timeRange: timeRange,

							lessonType: lessonType,
							defaultIndex: defaultIndex,

							xlsxRange: V2ScheduleParser.getMergeFromStart(
								workSheet,
								row,
								lessonTimeColumn,
							),
						} as InternalTime);
					}

					daysTimes[day.name] = dayTimes;
				}

				for (const time of dayTimes) {
					const lessons = V2ScheduleParser.parseLesson(
						workSheet,
						day,
						dayTimes,
						time,
						groupSkeleton.column,
					);

					for (const lesson of lessons) day.lessons.push(lesson);
				}

				group.days.push(day);
			}

			if (!daysTimesFilled) daysTimesFilled = true;

			groups[group.name] = group;
		}

		const updatedGroups = V2ScheduleParser.getUpdatedGroups(
			this.lastResult?.groups,
			groups,
		);

		const teachers = V2ScheduleParser.convertGroupsToTeachers(groups);

		const updatedTeachers = V2ScheduleParser.getUpdatedTeachers(
			this.lastResult?.teachers,
			teachers,
		);

		return (this.lastResult = {
			downloadedAt: headData.requestedAt,
			uploadedAt: headData.uploadedAt,

			etag: headData.etag,
			replacerId: replacer?.id,

			groups: groups,
			teachers: teachers,

			updatedGroups:
				updatedGroups.length === 0
					? (this.lastResult?.updatedGroups ?? [])
					: updatedGroups,

			updatedTeachers:
				updatedTeachers.length === 0
					? (this.lastResult?.updatedTeachers ?? [])
					: updatedTeachers,
		});
	}

	private static parseLesson(
		workSheet: XLSX.Sheet,
		day: V2DayDto,
		dayTimes: Array<InternalTime>,
		time: InternalTime,
		column: number,
	): Array<V2LessonDto> {
		const row = time.xlsxRange.s.r;

		// name
		const rawName = trimAll(
			V2ScheduleParser.getCellData(workSheet, row, column)?.replaceAll(
				/[\n\r]/g,
				"",
			) ?? "",
		);

		if (rawName.length === 0) return [];

		const lesson = new V2LessonDto();

		lesson.type = time.lessonType;
		lesson.defaultRange =
			time.defaultIndex !== null
				? [time.defaultIndex, time.defaultIndex]
				: null;

		lesson.time = new V2LessonTimeDto();
		lesson.time.start = time.timeRange.start;

		// check if multi-lesson
		const range = this.getMergeFromStart(workSheet, row, column);
		const endTime = dayTimes.filter((dayTime) => {
			return dayTime.xlsxRange.e.r === range.e.r;
		})[0];
		lesson.time.end = endTime?.timeRange.end ?? time.timeRange.end;

		if (lesson.defaultRange !== null)
			lesson.defaultRange[1] = endTime?.defaultIndex ?? time.defaultIndex;

		// name and subGroups (subGroups unfilled)
		{
			const nameAndGroups = V2ScheduleParser.parseNameAndSubGroups(
				trimAll(rawName?.replaceAll(/[\n\r]/g, "") ?? ""),
			);

			lesson.name = nameAndGroups.name;
			lesson.subGroups = nameAndGroups.subGroups;
		}

		// cabinets
		{
			const cabinets = V2ScheduleParser.parseCabinets(
				workSheet,
				row,
				column + 1,
			);

			if (cabinets.length === 1) {
				for (const index in lesson.subGroups)
					lesson.subGroups[index].cabinet = cabinets[0];
			} else if (cabinets.length === lesson.subGroups.length) {
				for (const index in lesson.subGroups)
					lesson.subGroups[index].cabinet = cabinets[index];
			} else if (cabinets.length !== 0) {
				if (cabinets.length > lesson.subGroups.length) {
					for (const index in cabinets) {
						if (lesson.subGroups[index] === undefined) {
							lesson.subGroups.push(
								plainToInstance(V2LessonSubGroupDto, {
									number: +index + 1,
									teacher: "Ошибка в расписании",
									cabinet: cabinets[index],
								} as V2LessonSubGroupDto),
							);

							continue;
						}

						lesson.subGroups[index].cabinet = cabinets[index];
					}
				} else throw new Error("Разное кол-во кабинетов и подгрупп!");
			}
		}

		const prevLesson =
			(day.lessons?.length ?? 0) === 0
				? null
				: day.lessons[day.lessons.length - 1];

		if (!prevLesson) return [lesson];

		return [
			plainToInstance(V2LessonDto, {
				type: V2LessonType.BREAK,
				defaultRange: null,
				name: null,
				time: plainToInstance(V2LessonTimeDto, {
					start: prevLesson.time.end,
					end: lesson.time.start,
				} as V2LessonTimeDto),
				subGroups: [],
			} as V2LessonDto),
			lesson,
		];
	}

	private static parseCabinets(
		workSheet: WorkSheet,
		row: number,
		column: number,
	) {
		const cabinets: Array<string> = [];
		{
			const rawCabinets = V2ScheduleParser.getCellData(
				workSheet,
				row,
				column,
			);

			if (rawCabinets) {
				const parts = rawCabinets.split(/(\n|\s)/g);

				for (const cabinet of parts) {
					if (!toNormalString(cabinet)) continue;

					cabinets.push(cabinet.replaceAll(/[\n\s\r]/g, " "));
				}
			}
		}
		return cabinets;
	}

	private static getUpdatedGroups(
		cachedGroups: Array<V2GroupDto> | null,
		currentGroups: Array<V2GroupDto>,
	): Array<Array<number>> {
		if (!cachedGroups) return [];

		const updatedGroups = [];

		for (const name in cachedGroups) {
			const cachedGroup = cachedGroups[name];
			const currentGroup = currentGroups[name];

			const affectedGroupDays: Array<number> = [];

			for (const dayIdx in currentGroup.days) {
				if (
					objectHash.sha1(currentGroup.days[dayIdx]) !==
					objectHash.sha1(cachedGroup.days[dayIdx])
				)
					affectedGroupDays.push(+dayIdx);
			}

			updatedGroups[name] = affectedGroupDays;
		}

		return updatedGroups;
	}

	private static getUpdatedTeachers(
		cachedTeachers: Array<V2TeacherDto> | null,
		currentTeachers: Array<V2TeacherDto>,
	): Array<Array<number>> {
		if (!cachedTeachers) return [];

		const updatedTeachers = [];

		for (const name in cachedTeachers) {
			const cachedTeacher = cachedTeachers[name];
			const currentTeacher = currentTeachers[name];

			const affectedTeacherDays: Array<number> = [];

			for (const dayIdx in currentTeacher.days) {
				if (
					objectHash.sha1(currentTeacher.days[dayIdx]) !==
					objectHash.sha1(cachedTeacher.days[dayIdx])
				)
					affectedTeacherDays.push(+dayIdx);
			}

			updatedTeachers[name] = affectedTeacherDays;
		}

		return updatedTeachers;
	}
}
