import {
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
import { ScheduleDto } from "./dto/schedule.dto";
import {
	V2ScheduleParser,
	V2ScheduleParseResult,
} from "./internal/schedule-parser/v2-schedule-parser";
import * as objectHash from "object-hash";
import { CacheStatusDto } from "./dto/cache-status.dto";
import { GroupScheduleDto } from "./dto/group-schedule.dto";
import { ScheduleGroupNamesDto } from "./dto/schedule-group-names.dto";
import { TeacherScheduleDto } from "./dto/teacher-schedule.dto";
import { ScheduleTeacherNamesDto } from "./dto/schedule-teacher-names.dto";

@Injectable()
export class ScheduleService {
	readonly scheduleParser: V2ScheduleParser;

	private cacheUpdatedAt: Date = new Date(0);
	private cacheHash: string = "0000000000000000000000000000000000000000";

	private scheduleUpdatedAt: Date = new Date(0);

	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly scheduleReplacerService: ScheduleReplacerService,
		private readonly firebaseAdminService: FirebaseAdminService,
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

	getCacheStatus(): CacheStatusDto {
		return plainToInstance(CacheStatusDto, {
			cacheHash: this.cacheHash,
			cacheUpdateRequired:
				(Date.now() - this.cacheUpdatedAt.valueOf()) / 1000 / 60 >=
				scheduleConstants.cacheInvalidateDelay,
			lastCacheUpdate: this.cacheUpdatedAt.valueOf(),
			lastScheduleUpdate: this.scheduleUpdatedAt.valueOf(),
		});
	}

	async getSourceSchedule(): Promise<V2ScheduleParseResult> {
		const schedule = await this.scheduleParser.getSchedule();

		this.cacheUpdatedAt = new Date();

		const oldHash = this.cacheHash;
		this.cacheHash = objectHash.sha1(schedule.etag);

		if (this.cacheHash !== oldHash) {
			if (this.scheduleUpdatedAt.valueOf() !== 0) {
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

	async getSchedule(): Promise<ScheduleDto> {
		const sourceSchedule = await this.getSourceSchedule();

		return {
			updatedAt: this.cacheUpdatedAt,
			groups: sourceSchedule.groups,
			updatedGroups: sourceSchedule.updatedGroups ?? [],
		};
	}

	async getGroup(name: string): Promise<GroupScheduleDto> {
		const schedule = await this.getSourceSchedule();

		const group = schedule.groups.get(name);
		if (group === undefined) {
			throw new NotFoundException(
				"Группы с таким названием не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			group: group,
			updated: schedule.updatedGroups[name] ?? [],
		};
	}

	async getGroupNames(): Promise<ScheduleGroupNamesDto> {
		const schedule = await this.getSourceSchedule();
		const names: Array<string> = [];

		for (const name of schedule.groups.keys()) names.push(name);

		return plainToInstance(ScheduleGroupNamesDto, {
			names: names,
		});
	}

	async getTeacher(name: string): Promise<TeacherScheduleDto> {
		const schedule = await this.getSourceSchedule();

		const teacher = schedule.teachers.get(name);
		if (teacher === undefined) {
			throw new NotFoundException(
				"Преподавателя с таким ФИО не существует!",
			);
		}

		return {
			updatedAt: this.cacheUpdatedAt,
			teacher: teacher,
			updated: schedule.updatedGroups[name] ?? [],
		};
	}

	async getTeacherNames(): Promise<ScheduleTeacherNamesDto> {
		const schedule = await this.getSourceSchedule();
		const names: Array<string> = [];

		for (const name of schedule.teachers.keys()) names.push(name);

		return plainToInstance(ScheduleTeacherNamesDto, {
			names: names,
		});
	}

	async updateDownloadUrl(url: string): Promise<CacheStatusDto> {
		await this.scheduleParser.getXlsDownloader().setDownloadUrl(url);

		await this.refreshCache();

		return this.getCacheStatus();
	}

	async refreshCache() {
		await this.cacheManager.reset();

		await this.getSourceSchedule();
	}
}
