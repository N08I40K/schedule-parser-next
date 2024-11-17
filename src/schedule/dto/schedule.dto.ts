import { IsArray, IsDate, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { GroupDto } from "./group.dto";
import { ToMap } from "create-map-transform-fn";

export class ScheduleDto {
	/**
	 * Дата когда последний раз расписание было скачано с сервера политехникума
	 * @example "2024-10-18T21:50:06.680Z"
	 */
	@IsDate()
	updatedAt: Date;

	/**
	 * Расписание групп
	 */
	@ToMap({ mapValueClass: GroupDto })
	groups: Map<string, GroupDto>;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example { "ИС-214/23": [4, 5] }
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Array<number>)
	updatedGroups: Array<Array<number>>;
}
