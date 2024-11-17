import { PickType } from "@nestjs/swagger";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ScheduleDto } from "./schedule.dto";
import { GroupDto } from "./group.dto";

export class GroupScheduleDto extends PickType(ScheduleDto, ["updatedAt"]) {
	/**
	 * Расписание группы
	 */
	@IsObject()
	@Type(() => GroupDto)
	group: GroupDto;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example [5, 6]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	updated: Array<number>;
}
