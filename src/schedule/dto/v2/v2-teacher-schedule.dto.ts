import { PickType } from "@nestjs/swagger";
import { V2ScheduleDto } from "./v2-schedule.dto";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V2TeacherDto } from "./v2-teacher.dto";

export class V2TeacherScheduleDto extends PickType(V2ScheduleDto, [
	"updatedAt",
]) {
	/**
	 * Расписание преподавателя
	 */
	@IsObject()
	teacher: V2TeacherDto;

	/**
	 * Обновлённые дни с последнего изменения расписания
	 * @example [5, 6]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	updated: Array<number>;
}
