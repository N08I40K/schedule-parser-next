import { IsBoolean, IsHash, IsNumber } from "class-validator";

export class CacheStatusDto {
	/**
	 * Хеш данных парсера
	 * @example "40bd001563085fc35165329ea1ff5c5ecbdbbeef"
	 */
	@IsHash("sha1")
	cacheHash: string;

	/**
	 * Требуется ли обновление кеша?
	 * @example true
	 */
	@IsBoolean()
	cacheUpdateRequired: boolean;

	/**
	 * Дата обновления кеша
	 * @example 1729288173002
	 */
	@IsNumber()
	lastCacheUpdate: number;

	/**
	 * Дата обновления расписания
	 * @example 1729288173002
	 */
	@IsNumber()
	lastScheduleUpdate: number;
}
