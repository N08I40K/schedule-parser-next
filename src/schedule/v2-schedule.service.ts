import {
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { BasicXlsDownloader } from "./internal/xls-downloader/basic-xls-downloader";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { plainToInstance } from "class-transformer";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import { scheduleConstants } from "../contants";
import { V2ScheduleDto } from "./dto/v2/v2-schedule.dto";
import { V1ScheduleService } from "./v1-schedule.service";
import {
	V2ScheduleParser,
	V2ScheduleParseResult,
} from "./internal/schedule-parser/v2-schedule-parser";
import * as objectHash from "object-hash";
import { V2CacheStatusDto } from "./dto/v2/v2-cache-status.dto";
import { V2GroupScheduleDto } from "./dto/v2/v2-group-schedule.dto";
import { V2ScheduleGroupNamesDto } from "./dto/v2/v2-schedule-group-names.dto";
import { V2TeacherScheduleDto } from "./dto/v2/v2-teacher-schedule.dto";
import { V2ScheduleTeacherNamesDto } from "./dto/v2/v2-schedule-teacher-names.dto";

@Injectable()
export class V2ScheduleService {
	readonly scheduleParser: V2ScheduleParser;

	private cacheUpdatedAt: Date = new Date(0);
	private cacheHash: string = "0000000000000000000000000000000000000000";

	private scheduleUpdatedAt: Date = new Date(0);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly scheduleReplacerService: ScheduleReplacerService,
		private readonly firebaseAdminService: FirebaseAdminService,
		@Inject(forwardRef(() => V1ScheduleService))
		private readonly v1ScheduleService: V1ScheduleService,
	) {
		setInterval(async () => {
			const now = new Date();
			if (now.getHours() != 7 || now.getMinutes() != 30) return;

			await this.firebaseAdminService.sendByTopic("common", {
				android: {
					priority: "high",
					ttl: 60 * 60 * 1000,
				},
				data: {
					type: "lessons-start",
				},
			});
		}, 60000);

		this.scheduleParser = new V2ScheduleParser(
			new BasicXlsDownloader(),
			this.scheduleReplacerService,
		);
	}

	getCacheStatus(): V2CacheStatusDto {
		return plainToInstance(V2CacheStatusDto, {
			cacheHash: this.cacheHash,
			cacheUpdateRequired:
				(Date.now() - this.cacheUpdatedAt.valueOf()) / 1000 / 60 >=
				scheduleConstants.cacheInvalidateDelay,
			lastCacheUpdate: this.cacheUpdatedAt.valueOf(),
			lastScheduleUpdate: this.scheduleUpdatedAt.valueOf(),
		});
	}

	async getSourceSchedule(
		silent: boolean = false,
	): Promise<V2ScheduleParseResult> {
		const schedule = await this.scheduleParser.getSchedule();

		this.cacheUpdatedAt = new Date();

		const oldHash = this.cacheHash;
		this.cacheHash = objectHash.sha1(schedule.etag);

		if (this.cacheHash !== oldHash) {
			if (this.scheduleUpdatedAt.valueOf() !== 0) {
				if (!silent) await this.v1ScheduleService.refreshCache(true);

				const isReplaced = await this.scheduleReplacerService.hasByEtag(
					schedule.etag,
				);

				await this.firebaseAdminService.sendByTopic("common", {
					data: {
						type: "schedule-update",
						replaced: isReplaced.toString(),
						etag: schedule.etag,
					},
				});
			}
			this.scheduleUpdatedAt = new Date();
		}

		return schedule;
	}

	async getSchedule(): Promise<V2ScheduleDto> {
		const sourceSchedule = await this.getSourceSchedule();

		return {
			updatedAt: this.cacheUpdatedAt,
			groups: sourceSchedule.groups,
			updatedGroups: sourceSchedule.updatedGroups ?? [],
		};
	}

	async getGroup(name: string): Promise<V2GroupScheduleDto> {
		const schedule = await this.getSourceSchedule();

		if (schedule.groups[name] === undefined) {
			throw new NotFoundException(
				"Группы с таким названием не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			group: schedule.groups[name],
			updated: schedule.updatedGroups[name] ?? [],
		};
	}

	async getGroupNames(): Promise<V2ScheduleGroupNamesDto> {
		const schedule = await this.getSourceSchedule();
		const names: Array<string> = [];

		for (const name in schedule.groups) names.push(name);

		return plainToInstance(V2ScheduleGroupNamesDto, {
			names: names,
		});
	}

	async getTeacher(name: string): Promise<V2TeacherScheduleDto> {
		const schedule = await this.getSourceSchedule();

		if (schedule.teachers[name] === undefined) {
			throw new NotFoundException(
				"Преподавателя с таким ФИО не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			teacher: schedule.teachers[name],
			updated: schedule.updatedGroups[name] ?? [],
		};
	}

	async getTeacherNames(): Promise<V2ScheduleTeacherNamesDto> {
		const schedule = await this.getSourceSchedule();
		const names: Array<string> = [];

		for (const name in schedule.teachers) names.push(name);

		return plainToInstance(V2ScheduleTeacherNamesDto, {
			names: names,
		});
	}

	async updateDownloadUrl(
		url: string,
		silent: boolean = false,
	): Promise<V2CacheStatusDto> {
		await this.scheduleParser.getXlsDownloader().setDownloadUrl(url);
		await this.v1ScheduleService.scheduleParser
			.getXlsDownloader()
			.setDownloadUrl(url);

		if (!silent) {
			await this.refreshCache(false);
			await this.v1ScheduleService.refreshCache(true);
		}

		return this.getCacheStatus();
	}

	async refreshCache(silent: boolean = false) {
		if (!silent) {
			await this.cacheManager.reset();
			await this.v1ScheduleService.refreshCache(true);
		}

		await this.getSourceSchedule(silent);
	}
}
