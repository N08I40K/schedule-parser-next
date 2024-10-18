import { V1CacheStatusDto } from "../v1/v1-cache-status.dto";
import { IsNumber } from "class-validator";

export class V2CacheStatusDto extends V1CacheStatusDto {
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
