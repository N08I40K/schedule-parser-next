import { Injectable } from "@nestjs/common";
import {
	ScheduleParser,
	ScheduleParseResult,
} from "./internal/schedule-parser/schedule-parser";
import { BasicXlsDownloader } from "./internal/xls-downloader/basic-xls-downloader";
import { XlsDownloaderCacheMode } from "./internal/xls-downloader/xls-downloader.base";
import { ScheduleDto } from "../dto/schedule.dto";

@Injectable()
export class ScheduleService {
	private readonly scheduleParser = new ScheduleParser(
		new BasicXlsDownloader(
			"https://politehnikum-eng.ru/index/raspisanie_zanjatij/0-409",
			XlsDownloaderCacheMode.SOFT,
		),
		"ИС-214/23",
	);

	private lastCacheUpdate: Date = new Date(0);
	private lastChangedDays: Array<number> = [];

	constructor() {}

	async getSchedule(): Promise<ScheduleDto> {
		const now = new Date();
		const cacheExpired =
			(this.lastCacheUpdate.valueOf() - now.valueOf()) / 1000 / 60 > 5;

		if (cacheExpired) this.lastCacheUpdate = now;

		const schedule = await this.scheduleParser.getSchedule(!cacheExpired);
		if (schedule.affectedDays.length !== 0)
			this.lastChangedDays = schedule.affectedDays;

		return {
			updatedAt: this.lastCacheUpdate,
			data: schedule.group,
			etag: schedule.etag,
			lastChangedDays: this.lastChangedDays,
		};
	}
}
