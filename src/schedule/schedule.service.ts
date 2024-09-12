import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	ScheduleParser,
	ScheduleParseResult,
} from "./internal/schedule-parser/schedule-parser";
import { BasicXlsDownloader } from "./internal/xls-downloader/basic-xls-downloader";
import { XlsDownloaderCacheMode } from "./internal/xls-downloader/xls-downloader.base";
import {
	GroupDto,
	GroupScheduleDto,
	ScheduleDto,
	ScheduleGroupsDto,
} from "../dto/schedule.dto";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { instanceToPlain } from "class-transformer";
import { cacheGetOrFill } from "../utility/cache.util";

@Injectable()
export class ScheduleService {
	private readonly scheduleParser = new ScheduleParser(
		new BasicXlsDownloader(
			"https://politehnikum-eng.ru/index/raspisanie_zanjatij/0-409",
			XlsDownloaderCacheMode.SOFT,
		),
	);

	private lastCacheUpdate: Date = new Date(0);
	private lastChangedDays: Array<Array<number>> = [];

	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

	private async getSourceSchedule(): Promise<ScheduleParseResult> {
		return cacheGetOrFill(this.cacheManager, "sourceSchedule", async () => {
			this.lastCacheUpdate = new Date();

			const schedule = await this.scheduleParser.getSchedule();
			schedule.groups = ScheduleService.toObject(
				schedule.groups,
			) as Array<GroupDto>;

			return schedule;
		});
	}

	private static toObject<T>(array: Array<T>): object {
		const object = {};

		for (const item in array) object[item] = array[item];

		return object;
	}

	async getSchedule(): Promise<ScheduleDto> {
		return cacheGetOrFill(this.cacheManager, "schedule", async () => {
			const sourceSchedule = await this.getSourceSchedule();

			for (const groupName in sourceSchedule.affectedDays) {
				const affectedDays = sourceSchedule.affectedDays[groupName];

				if (affectedDays?.length !== 0)
					this.lastChangedDays[groupName] = affectedDays;
			}

			return {
				updatedAt: this.lastCacheUpdate,
				groups: ScheduleService.toObject(sourceSchedule.groups),
				etag: sourceSchedule.etag,
				lastChangedDays: this.lastChangedDays,
			};
		});
	}

	async getGroup(group: string): Promise<GroupScheduleDto> {
		const schedule = await this.getSourceSchedule();

		if ((schedule.groups as object)[group] === undefined) {
			throw new NotFoundException(
				"Группы с таким названием не существует!",
			);
		}

		return {
			updatedAt: this.lastCacheUpdate,
			group: schedule.groups[group],
			etag: schedule.etag,
			lastChangedDays: this.lastChangedDays[group] ?? [],
		};
	}

	async getGroupNames(): Promise<ScheduleGroupsDto> {
		let groupNames: ScheduleGroupsDto | undefined =
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
}
