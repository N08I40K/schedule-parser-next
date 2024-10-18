import { IsArray, IsDate, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V2GroupDto } from "./v2-group.dto";

export class V2ScheduleDto {
	/**
	 * Дата когда последний раз расписание было скачано с сервера политехникума
	 * @example "2024-10-18T21:50:06.680Z"
	 */
	@IsDate()
	updatedAt: Date;

	/**
	 * Расписание групп
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => V2GroupDto)
	groups: Array<V2GroupDto>;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example { "ИС-214/23": [4, 5] }
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Array<number>)
	updatedGroups: Array<Array<number>>;
}
