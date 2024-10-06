import {
	XlsDownloaderBase,
	XlsDownloaderCacheMode,
} from "../xls-downloader/xls-downloader.base";

import * as XLSX from "xlsx";
import {
	DayDto,
	GroupDto,
	LessonDto,
	LessonTimeDto,
	LessonTypeDto,
} from "../../../dto/schedule.dto";
import { toNormalString, trimAll } from "../../../utility/string.util";

type InternalId = { row: number; column: number; name: string };
type InternalDay = InternalId;

export class ScheduleParseResult {
	etag: string;
	groups: Array<GroupDto>;
	affectedDays: Array<Array<number>>;
	updateRequired: boolean;
}

type CellData = XLSX.CellObject["v"];

export class ScheduleParser {
	private lastResult: ScheduleParseResult | null = null;

	public constructor(private readonly xlsDownloader: XlsDownloaderBase) {}

	private static getCellData(
		worksheet: XLSX.Sheet,
		row: number,
		column: number,
	): string | null {
		const cell: XLSX.CellObject | null =
			worksheet[XLSX.utils.encode_cell({ r: row, c: column })];

		return toNormalString(cell?.w);
	}

	private parseTeacherFullNames(lessonName: string): {
		name: string;
		teacherFullNames: Array<string>;
	} {
		const firstRegex =
			/(?:[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.[А-ЯЁ]\.(?:\s?\([0-9] подгруппа\))?(?:,\s)?)+$/gm;
		const secondRegex =
			/(?:[А-ЯЁ][а-яё]+\s[А-ЯЁ]\.[А-ЯЁ]\.(?:\s?\([0-9] подгруппа\))?)+/gm;

		const fm = firstRegex.exec(lessonName);
		if (fm === null) return { name: lessonName, teacherFullNames: [] };

		const teacherFullNames: Array<string> = [];

		let teacherFullNameMatch: RegExpExecArray;
		while ((teacherFullNameMatch = secondRegex.exec(fm[0])) !== null) {
			if (teacherFullNameMatch.index === secondRegex.lastIndex)
				secondRegex.lastIndex++;

			teacherFullNames.push(teacherFullNameMatch[0].trim());
		}

		if (teacherFullNames.length === 0)
			return { name: lessonName, teacherFullNames: [] };

		return {
			name: lessonName.substring(0, fm.index).trim(),
			teacherFullNames: teacherFullNames,
		};
	}

	parseSkeleton(worksheet: XLSX.Sheet): {
		groupSkeletons: Array<InternalId>;
		daySkeletons: Array<InternalDay>;
	} {
		const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
		let isHeaderParsed: boolean = false;

		const groups: Array<InternalId> = [];
		const days: Array<InternalDay> = [];

		for (let row = range.s.r + 1; row <= range.e.r; ++row) {
			const dayName = ScheduleParser.getCellData(worksheet, row, 0);
			if (!dayName) continue;

			if (!isHeaderParsed) {
				isHeaderParsed = true;

				--row;
				for (
					let column = range.s.c + 2;
					column <= range.e.c;
					++column
				) {
					const groupName = ScheduleParser.getCellData(
						worksheet,
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

	getXlsDownloader(): XlsDownloaderBase {
		return this.xlsDownloader;
	}

	async getSchedule(
		forceCached: boolean = false,
	): Promise<ScheduleParseResult> {
		if (forceCached && this.lastResult !== null) return this.lastResult;

		const downloadData = await this.xlsDownloader.downloadXLS();

		if (
			!downloadData.new &&
			this.lastResult &&
			this.xlsDownloader.getCacheMode() !== XlsDownloaderCacheMode.NONE
		)
			return this.lastResult;

		const workBook = XLSX.read(downloadData.fileData);
		const workSheet = workBook.Sheets[workBook.SheetNames[0]];

		const { groupSkeletons, daySkeletons } = this.parseSkeleton(workSheet);

		const groups: Array<GroupDto> = [];

		for (const groupSkeleton of groupSkeletons) {
			const group = new GroupDto(groupSkeleton.name);

			for (let dayIdx = 0; dayIdx < daySkeletons.length - 1; ++dayIdx) {
				const daySkeleton = daySkeletons[dayIdx];
				const day = new DayDto(daySkeleton.name);

				const lessonTimeColumn = daySkeletons[0].column + 1;
				const rowDistance =
					daySkeletons[dayIdx + 1].row - daySkeleton.row;

				for (
					let row = daySkeleton.row;
					row < daySkeleton.row + rowDistance;
					++row
				) {
					// time
					const time = ScheduleParser.getCellData(
						workSheet,
						row,
						lessonTimeColumn,
					)?.replaceAll(" ", "");

					if (!time) continue;

					// name
					const rawName: CellData = trimAll(
						ScheduleParser.getCellData(
							workSheet,
							row,
							groupSkeleton.column,
						)?.replaceAll(/[\n\r]/g, "") ?? "",
					);

					if (rawName.length === 0) {
						day.lessons.push(null);
						continue;
					}

					// cabinets
					const cabinets: Array<string> = [];

					const rawCabinets = ScheduleParser.getCellData(
						workSheet,
						row,
						groupSkeleton.column + 1,
					);

					if (rawCabinets) {
						const parts = rawCabinets.split(/(\n|\s)/g);

						for (const cabinet of parts) {
							if (!toNormalString(cabinet)) continue;

							cabinets.push(cabinet.replaceAll(/[\n\s\r]/g, " "));
						}
					}

					// type
					const lessonType = time?.includes("пара")
						? LessonTypeDto.DEFAULT
						: LessonTypeDto.CUSTOM;

					// full names
					const { name, teacherFullNames } =
						this.parseTeacherFullNames(
							trimAll(rawName?.replaceAll(/[\n\r]/g, "") ?? ""),
						);

					day.lessons.push(
						new LessonDto(
							lessonType,
							lessonType === LessonTypeDto.DEFAULT
								? Number.parseInt(time[0])
								: -1,
							LessonTimeDto.fromString(
								lessonType === LessonTypeDto.DEFAULT
									? time.substring(5)
									: time,
							),
							name,
							cabinets,
							teacherFullNames,
						),
					);
				}

				day.fillIndices();

				if (day.nonNullIndices.length == 0) group.days.push(null);
				else group.days.push(day);
			}

			groups[group.name] = group;
		}

		return (this.lastResult = {
			etag: downloadData.etag,
			groups: groups,
			affectedDays: this.getAffectedDays(this.lastResult?.groups, groups),
			updateRequired: downloadData.updateRequired,
		});
	}

	private getAffectedDays(
		cachedGroups: Array<GroupDto> | null,
		groups: Array<GroupDto>,
	): Array<Array<number>> {
		const affectedDays: Array<Array<number>> = [];

		if (!cachedGroups) return affectedDays;

		// noinspection SpellCheckingInspection
		const dayEquals = (
			lday: DayDto | null,
			rday: DayDto | undefined,
		): boolean => {
			if (!lday || !rday || rday.lessons.length != lday.lessons.length)
				return false;

			for (const lessonIdx in lday.lessons) {
				// noinspection SpellCheckingInspection
				const llesson = lday.lessons[lessonIdx];
				// noinspection SpellCheckingInspection
				const rlesson = rday.lessons[lessonIdx];

				if (llesson === null && rlesson === null) continue;
				if (!llesson || !rlesson) return false;

				if (
					llesson.name.length > 0 &&
					(llesson.name !== rlesson.name ||
						llesson.time.start !== rlesson.time.start ||
						llesson.time.end !== rlesson.time.end ||
						llesson.cabinets.toString() !==
							rlesson.cabinets.toString() ||
						llesson.teacherNames.toString() !==
							rlesson.teacherNames.toString())
				)
					return false;
			}

			return true;
		};

		for (const groupName in cachedGroups) {
			const cachedGroup = cachedGroups[groupName];
			const group = groups[groupName];

			const affectedGroupDays: Array<number> = [];

			for (const dayIdx in group.days) {
				// noinspection SpellCheckingInspection
				const lday = group.days[dayIdx];
				// noinspection SpellCheckingInspection
				const rday = cachedGroup.days[dayIdx];

				if (!dayEquals(lday, rday))
					affectedGroupDays.push(Number.parseInt(dayIdx));
			}

			affectedDays[groupName] = affectedGroupDays;
		}

		return affectedDays;
	}
}
