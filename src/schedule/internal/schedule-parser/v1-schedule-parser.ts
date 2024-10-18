import { XlsDownloaderInterface } from "../xls-downloader/xls-downloader.interface";

import * as XLSX from "xlsx";
import { toNormalString, trimAll } from "../../../utility/string.util";
import { V1LessonTimeDto } from "../../dto/v1/v1-lesson-time.dto";
import { V1LessonType } from "../../enum/v1-lesson-type.enum";
import { V1LessonDto } from "../../dto/v1/v1-lesson.dto";
import { V1DayDto } from "../../dto/v1/v1-day.dto";
import { V1GroupDto } from "../../dto/v1/v1-group.dto";
import { ScheduleReplacerService } from "../../schedule-replacer.service";
import * as assert from "node:assert";

type InternalId = { row: number; column: number; name: string };
type InternalDay = InternalId;

export class ScheduleParseResult {
	etag: string;
	replacerId?: string;
	groups: Array<V1GroupDto>;
	affectedDays: Array<Array<number>>;
}

type CellData = XLSX.CellObject["v"];

export class V1ScheduleParser {
	private lastResult: ScheduleParseResult | null = null;

	public constructor(
		private readonly xlsDownloader: XlsDownloaderInterface,
		private readonly scheduleReplacerService: ScheduleReplacerService,
	) {}

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
			const dayName = V1ScheduleParser.getCellData(worksheet, row, 0);
			if (!dayName) continue;

			if (!isHeaderParsed) {
				isHeaderParsed = true;

				--row;
				for (
					let column = range.s.c + 2;
					column <= range.e.c;
					++column
				) {
					const groupName = V1ScheduleParser.getCellData(
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

	getXlsDownloader(): XlsDownloaderInterface {
		return this.xlsDownloader;
	}

	async getSchedule(): Promise<ScheduleParseResult> {
		const headData = await this.xlsDownloader.fetch(true);
		this.xlsDownloader.verifyFetchResult(headData);

		assert(headData.type === "success");

		const replacer = await this.scheduleReplacerService.getByEtag(
			headData.etag,
		);

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

		const { groupSkeletons, daySkeletons } = this.parseSkeleton(workSheet);

		const groups: Array<V1GroupDto> = [];

		for (const groupSkeleton of groupSkeletons) {
			const group = new V1GroupDto(groupSkeleton.name);

			for (let dayIdx = 0; dayIdx < daySkeletons.length - 1; ++dayIdx) {
				const daySkeleton = daySkeletons[dayIdx];
				const day = new V1DayDto(daySkeleton.name);

				const lessonTimeColumn = daySkeletons[0].column + 1;
				const rowDistance =
					daySkeletons[dayIdx + 1].row - daySkeleton.row;

				for (
					let row = daySkeleton.row;
					row < daySkeleton.row + rowDistance;
					++row
				) {
					// time
					const time = V1ScheduleParser.getCellData(
						workSheet,
						row,
						lessonTimeColumn,
					)?.replaceAll(" ", "");

					if (!time) continue;

					// name
					const rawName: CellData = trimAll(
						V1ScheduleParser.getCellData(
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

					const rawCabinets = V1ScheduleParser.getCellData(
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
						? V1LessonType.DEFAULT
						: V1LessonType.CUSTOM;

					// full names
					const { name, teacherFullNames } =
						this.parseTeacherFullNames(
							trimAll(rawName?.replaceAll(/[\n\r]/g, "") ?? ""),
						);

					day.lessons.push(
						new V1LessonDto(
							lessonType,
							lessonType === V1LessonType.DEFAULT
								? Number.parseInt(time[0])
								: -1,
							V1LessonTimeDto.fromString(
								lessonType === V1LessonType.DEFAULT
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
			etag: headData.etag,
			replacerId: replacer?.id,
			groups: groups,
			affectedDays: this.getAffectedDays(this.lastResult?.groups, groups),
		});
	}

	private getAffectedDays(
		cachedGroups: Array<V1GroupDto> | null,
		groups: Array<V1GroupDto>,
	): Array<Array<number>> {
		const affectedDays: Array<Array<number>> = [];

		if (!cachedGroups) return affectedDays;

		// noinspection SpellCheckingInspection
		const dayEquals = (
			lday: V1DayDto | null,
			rday: V1DayDto | undefined,
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
