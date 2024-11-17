import { PickType } from "@nestjs/swagger";
import { ScheduleDto } from "./schedule.dto";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TeacherDto } from "./teacher.dto";

export class TeacherScheduleDto extends PickType(ScheduleDto, ["updatedAt"]) {
	/**
	 * Расписание преподавателя
	 */
	@IsObject()
	teacher: TeacherDto;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example [5, 6]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	updated: Array<number>;
}
