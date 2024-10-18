import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V2DayDto } from "./v2-day.dto";

export class V2GroupDto {
	/**
	 * Название группы
	 * @example "ИС-214/23"
	 */
	@IsString()
	name: string;

	/**
	 * Расписание каждого дня
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => V2DayDto)
	days: Array<V2DayDto>;
}
