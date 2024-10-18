import {
	forwardRef,
	Inject,
	Injectable,
	NotAcceptableException,
	NotFoundException,
} from "@nestjs/common";
import {
	V1ScheduleParser,
	ScheduleParseResult,
} from "./internal/schedule-parser/v1-schedule-parser";
import { BasicXlsDownloader } from "./internal/xls-downloader/basic-xls-downloader";
import { V1ScheduleDto } from "./dto/v1/v1-schedule.dto";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { instanceToPlain } from "class-transformer";
import { cacheGetOrFill } from "../utility/cache.util";
import * as crypto from "crypto";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { scheduleConstants } from "../contants";
import { JSDOM } from "jsdom";
import { V2ScheduleService } from "./v2-schedule.service";
import { V1GroupDto } from "./dto/v1/v1-group.dto";
import { CacheStatusDto } from "./dto/v1/cache-status.dto";
import { V1ScheduleGroupNamesDto } from "./dto/v1/v1-schedule-group-names.dto";
import { V1GroupScheduleDto } from "./dto/v1/v1-group-schedule.dto";
import { V1SiteMainPageDto } from "./dto/v1/v1-site-main-page.dto";

@Injectable()
export class V1ScheduleService {
	readonly scheduleParser: V1ScheduleParser;

	private cacheUpdatedAt: Date = new Date(0);
	private cacheHash: string = "0000000000000000000000000000000000000000";

	private lastChangedDays: Array<Array<number>> = [];
	private scheduleUpdatedAt: Date = new Date(0);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly scheduleReplacerService: ScheduleReplacerService,
		@Inject(forwardRef(() => V2ScheduleService))
		private readonly v2ScheduleService: V2ScheduleService,
	) {
		this.scheduleParser = new V1ScheduleParser(
			new BasicXlsDownloader(),
			this.scheduleReplacerService,
		);
	}

	getCacheStatus(): CacheStatusDto {
		return {
			cacheHash: this.cacheHash,
			cacheUpdateRequired:
				(Date.now() - this.cacheUpdatedAt.valueOf()) / 1000 / 60 >=
				scheduleConstants.cacheInvalidateDelay,
			lastCacheUpdate: this.cacheUpdatedAt.valueOf(),
			lastScheduleUpdate: this.scheduleUpdatedAt.valueOf(),
		};
	}

	async getSourceSchedule(
		silent: boolean = false,
	): Promise<ScheduleParseResult> {
		return cacheGetOrFill(this.cacheManager, "sourceSchedule", async () => {
			const schedule = await this.scheduleParser.getSchedule();
			schedule.groups = V1ScheduleService.toObject(
				schedule.groups,
			) as Array<V1GroupDto>;

			this.cacheUpdatedAt = new Date();

			const oldHash = this.cacheHash;
			this.cacheHash = crypto
				.createHash("sha1")
				.update(
					JSON.stringify(schedule.groups, null, 0) + schedule.etag,
				)
				.digest("hex");

			if (
				this.scheduleUpdatedAt.valueOf() === 0 ||
				this.cacheHash !== oldHash
			) {
				if (this.scheduleUpdatedAt.valueOf() !== 0 && !silent)
					await this.v2ScheduleService.refreshCache(true);
				this.scheduleUpdatedAt = new Date();
			}

			return schedule;
		});
	}

	private static toObject<T>(array: Array<T>): object {
		const object = {};

		for (const item in array) object[item] = array[item];

		return object;
	}

	async getSchedule(): Promise<V1ScheduleDto> {
		return cacheGetOrFill(
			this.cacheManager,
			"schedule",
			async (): Promise<V1ScheduleDto> => {
				const sourceSchedule = await this.getSourceSchedule();

				for (const groupName in sourceSchedule.affectedDays) {
					const affectedDays = sourceSchedule.affectedDays[groupName];

					if (affectedDays?.length !== 0)
						this.lastChangedDays[groupName] = affectedDays;
				}

				return {
					updatedAt: this.cacheUpdatedAt,
					groups: V1ScheduleService.toObject(sourceSchedule.groups),
					lastChangedDays: this.lastChangedDays,
				};
			},
		);
	}

	async getGroup(group: string): Promise<V1GroupScheduleDto> {
		const schedule = await this.getSourceSchedule();

		if ((schedule.groups as object)[group] === undefined) {
			throw new NotFoundException(
				"Группы с таким названием не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			group: schedule.groups[group],
			lastChangedDays: this.lastChangedDays[group] ?? [],
		};
	}

	async getGroupNames(): Promise<V1ScheduleGroupNamesDto> {
		let groupNames: V1ScheduleGroupNamesDto | undefined =
			await this.cacheManager.get("groupNames");

		if (!groupNames) {
			const schedule = await this.getSourceSchedule();
			const names: Array<string> = [];

			for (const groupName in schedule.groups) names.push(groupName);

			groupNames = { names };
			await this.cacheManager.set(
				"groupNames",
				instanceToPlain(groupNames),
				24 * 60 * 60 * 1000,
			);
		}

		return groupNames;
	}

	private async getDOM(preparedData: any): Promise<JSDOM | null> {
		try {
			return new JSDOM(atob(preparedData), {
				url: "https://politehnikum-eng.ru/index/raspisanie_zanjatij/0-409",
				contentType: "text/html",
			});
		} catch {
			throw new NotAcceptableException(
				"Передан некорректный код страницы",
			);
		}
	}

	private parseData(dom: JSDOM): string {
		try {
			const scheduleBlock = dom.window.document.getElementById("cont-i");
			if (scheduleBlock === null)
				// noinspection ExceptionCaughtLocallyJS
				throw new Error("Не удалось найти блок расписаний!");

			const schedules = scheduleBlock.getElementsByTagName("div");
			if (schedules === null || schedules.length === 0)
				// noinspection ExceptionCaughtLocallyJS
				throw new Error("Не удалось найти строку с расписанием!");

			const poltavskaya = schedules[0];
			const link = poltavskaya.getElementsByTagName("a")[0]!;

			return link.href;
		} catch (exception) {
			console.error(exception);
			throw new NotAcceptableException(
				"Передан некорректный код страницы",
			);
		}
	}

	async updateSiteMainPage(
		siteMainPageDto: V1SiteMainPageDto,
	): Promise<CacheStatusDto> {
		const dom = await this.getDOM(siteMainPageDto.mainPage);
		const url = this.parseData(dom);

		console.log(url);

		return await this.updateDownloadUrl(url);
	}

	async updateDownloadUrl(
		url: string,
		silent: boolean = false,
	): Promise<CacheStatusDto> {
		await this.scheduleParser.getXlsDownloader().setDownloadUrl(url);
		await this.v2ScheduleService.scheduleParser
			.getXlsDownloader()
			.setDownloadUrl(url);

		if (!silent) {
			await this.refreshCache(false);
			await this.v2ScheduleService.refreshCache(true);
		}

		return this.getCacheStatus();
	}

	async refreshCache(silent: boolean = false) {
		if (!silent) {
			await this.cacheManager.reset();
			await this.v2ScheduleService.refreshCache(true);
		}

		await this.getSourceSchedule(silent);
	}
}
