import { XlsDownloaderInterface } from "../xls-downloader/xls-downloader.interface";

import * as XLSX from "xlsx";
import { Range, WorkSheet } from "xlsx";
import { toNormalString, trimAll } from "../../../utility/string.util";
import { plainToClass, plainToInstance, Type } from "class-transformer";
import * as objectHash from "object-hash";
import { LessonTimeDto } from "../../dto/lesson-time.dto";
import { V2LessonType } from "../../enum/v2-lesson-type.enum";
import { LessonSubGroupDto } from "../../dto/lesson-sub-group.dto";
import { LessonDto } from "../../dto/lesson.dto";
import { DayDto } from "../../dto/day.dto";
import { GroupDto } from "../../dto/group.dto";
import * as assert from "node:assert";
import { ScheduleReplacerService } from "../../schedule-replacer.service";
import { TeacherDto } from "../../dto/teacher.dto";
import { TeacherDayDto } from "../../dto/teacher-day.dto";
import { TeacherLessonDto } from "../../dto/teacher-lesson.dto";
import {
	IsArray,
	IsDate,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { ToMap } from "create-map-transform-fn";

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
	timeRange: LessonTimeDto;

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
	@IsString()
	etag: string;

	/**
	 * Идентификатор заменённого расписания (ObjectId)
	 */
	@IsString()
	@IsOptional()
	replacerId?: string;

	/**
	 * Дата загрузки расписания на сайт политехникума
	 */
	@IsDate()
	uploadedAt: Date;

	/**
	 * Дата загрузки расписания с сайта политехникума
	 */
	@IsDate()
	downloadedAt: Date;

	/**
	 * Расписание групп в виде списка.
	 * Ключ - название группы.
	 */
	@ToMap({ mapValueClass: GroupDto })
	groups: Map<string, GroupDto>;

	/**
	 * Расписание преподавателей в виде списка.
	 * Ключ - ФИО преподавателя
	 */
	@ToMap({ mapValueClass: TeacherDto })
	teachers: Map<string, TeacherDto>;

	/**
	 * Список групп у которых было обновлено расписание с момента последнего обновления файла.
	 * Ключ - название группы.
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Array<number>)
	@ValidateNested({ each: true })
	@Type(() => Number)
	updatedGroups: Array<Array<number>>;

	/**
	 * Список преподавателей у которых было обновлено расписание с момента последнего обновления файла.
	 * Ключ - ФИО преподавателя.
	 */
	@ValidateNested({ each: true })
	@Type(() => Array<number>)
	@ValidateNested({ each: true })
	@Type(() => Number)
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
	 * 		subGroups: Array<LessonSubGroupDto>;
	 * 	}} - название пары и список подгрупп
	 * @private
	 * @static
	 */
	private static parseNameAndSubGroups(lessonName: string): {
		name: string;
		subGroups: Array<LessonSubGroupDto>;
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

		const subGroups: Array<LessonSubGroupDto> = [];

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
				plainToClass(LessonSubGroupDto, {
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

			const dayMonthIdx = /[А-Яа-я]+\s(\d+)\.\d+\.\d+/.exec(
				trimAll(dayName),
			);

			if (dayMonthIdx === null) continue;

			days.push({
				row: row,
				column: 0,
				name: dayName,
			});

			if (days.length > 2 && dayName.startsWith("Суббота")) break;
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
		groups: Map<string, GroupDto>,
	): Map<string, TeacherDto> {
		const result = new Map<string, TeacherDto>();

		for (const groupName of groups.keys()) {
			const group = groups.get(groupName);

			for (const day of group.days) {
				for (const lesson of day.lessons) {
					if (lesson.type !== V2LessonType.DEFAULT) continue;

					for (const subGroup of lesson.subGroups) {
						let teacherDto: TeacherDto = result.get(
							subGroup.teacher,
						);

						if (!teacherDto) {
							teacherDto = new TeacherDto();
							result.set(subGroup.teacher, teacherDto);

							teacherDto.name = subGroup.teacher;
							teacherDto.days = [];
						}

						let teacherDay: TeacherDayDto =
							teacherDto.days[day.name];

						if (!teacherDay) {
							teacherDay = teacherDto.days[day.name] =
								new TeacherDayDto();

							// TODO: Что это блять такое?
							// noinspection JSConstantReassignment
							teacherDay.name = day.name;
							teacherDay.date = day.date;
							teacherDay.lessons = [];
						}

						const teacherLesson = structuredClone(
							lesson,
						) as TeacherLessonDto;
						teacherLesson.group = groupName;

						teacherDay.lessons.push(teacherLesson);
					}
				}
			}
		}

		for (const teacherName of result.keys()) {
			const teacher = result.get(teacherName);

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

		const groups = new Map<string, GroupDto>();

		const daysTimes: Array<Array<InternalTime>> = [];
		let daysTimesFilled = false;

		const saturdayEndRow = XLSX.utils.decode_range(workSheet["!ref"] || "")
			.e.r;

		for (const groupSkeleton of groupSkeletons) {
			const group = new GroupDto();
			group.name = groupSkeleton.name;
			group.days = [];

			for (let dayIdx = 0; dayIdx < daySkeletons.length; ++dayIdx) {
				const daySkeleton = daySkeletons[dayIdx];
				const day = new DayDto();
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
					(dayIdx !== daySkeletons.length - 1
						? daySkeletons[dayIdx + 1].row
						: saturdayEndRow) - daySkeleton.row;

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
						const timeRange = new LessonTimeDto();

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
					const lessonsOrStreet = V2ScheduleParser.parseLesson(
						workSheet,
						day,
						dayTimes,
						time,
						groupSkeleton.column,
					);

					if (typeof lessonsOrStreet === "string") {
						day.street = lessonsOrStreet as string;
						continue;
					}

					for (const lesson of lessonsOrStreet as Array<LessonDto>)
						day.lessons.push(lesson);
				}

				group.days.push(day);
			}

			if (!daysTimesFilled) daysTimesFilled = true;

			groups.set(group.name, group);
		}

		const updatedGroups = V2ScheduleParser.getUpdatedGroups(
			this.lastResult?.groups,
			groups,
		);

		const teachers = V2ScheduleParser.convertGroupsToTeachers(groups);

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

			updatedTeachers: [], // TODO: Вернуть эту фичу
		});
	}

	private static readonly consultationRegExp = /\(?[кК]онсультация\)?/;
	private static readonly otherStreetRegExp = /^[А-Я][а-я]+,\s?[0-9]+$/;

	private static parseLesson(
		workSheet: XLSX.Sheet,
		day: DayDto,
		dayTimes: Array<InternalTime>,
		time: InternalTime,
		column: number,
	): Array<LessonDto> | string {
		const row = time.xlsxRange.s.r;

		// name
		let rawName = trimAll(
			V2ScheduleParser.getCellData(workSheet, row, column)?.replaceAll(
				/[\n\r]/g,
				" ",
			) ?? "",
		);

		if (rawName.length === 0) return [];

		const lesson = new LessonDto();

		if (this.otherStreetRegExp.test(rawName)) return rawName;
		else if (rawName.includes("ЗАЧЕТ С ОЦЕНКОЙ")) {
			lesson.type = V2LessonType.EXAM_WITH_GRADE;
			rawName = trimAll(rawName.replace("ЗАЧЕТ С ОЦЕНКОЙ", ""));
		} else if (rawName.includes("ЗАЧЕТ")) {
			lesson.type = V2LessonType.EXAM;
			rawName = trimAll(rawName.replace("ЗАЧЕТ", ""));
		} else if (rawName.includes("(консультация)")) {
			lesson.type = V2LessonType.CONSULTATION;
			rawName = trimAll(rawName.replace("(консультация)", ""));
		} else if (this.consultationRegExp.test(rawName)) {
			lesson.type = V2LessonType.CONSULTATION;
			rawName = trimAll(rawName.replace(this.consultationRegExp, ""));
		} else if (rawName.includes("САМОСТОЯТЕЛЬНАЯ РАБОТА")) {
			lesson.type = V2LessonType.INDEPENDENT_WORK;
			rawName = trimAll(rawName.replace("САМОСТОЯТЕЛЬНАЯ РАБОТА", ""));
		} else lesson.type = time.lessonType;

		lesson.defaultRange =
			time.defaultIndex !== null
				? [time.defaultIndex, time.defaultIndex]
				: null;

		lesson.time = new LessonTimeDto();
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
								plainToInstance(LessonSubGroupDto, {
									number: +index + 1,
									teacher: "Ошибка в расписании",
									cabinet: cabinets[index],
								} as LessonSubGroupDto),
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
			plainToInstance(LessonDto, {
				type: V2LessonType.BREAK,
				defaultRange: null,
				name: null,
				time: plainToInstance(LessonTimeDto, {
					start: prevLesson.time.end,
					end: lesson.time.start,
				} as LessonTimeDto),
				subGroups: [],
			} as LessonDto),
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
		cachedGroups: Map<string, GroupDto> | null,
		currentGroups: Map<string, GroupDto>,
	): Array<Array<number>> {
		if (!cachedGroups) return [];

		const updatedGroups = [];

		for (const name of cachedGroups.keys()) {
			const cachedGroup = cachedGroups.get(name);
			const currentGroup = currentGroups.get(name);

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
}
