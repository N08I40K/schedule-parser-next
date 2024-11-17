import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { DayDto } from "./day.dto";

export class GroupDto {
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
	@Type(() => DayDto)
	days: Array<DayDto>;
}
