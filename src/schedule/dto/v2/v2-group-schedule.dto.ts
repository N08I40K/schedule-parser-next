import { PickType } from "@nestjs/swagger";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V2ScheduleDto } from "./v2-schedule.dto";
import { V2GroupDto } from "./v2-group.dto";

export class V2GroupScheduleDto extends PickType(V2ScheduleDto, ["updatedAt"]) {
	/**
	 * Расписание группы
	 */
	@IsObject()
	group: V2GroupDto;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example [5, 6]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	updated: Array<number>;
}
