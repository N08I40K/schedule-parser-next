import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V2TeacherDayDto } from "./v2-teacher-day.dto";

export class V2TeacherDto {
	/**
	 * ФИО преподавателя
	 * @example "Хомченко Н.Е."
	 */
	@IsString()
	name: string;

	/**
	 * Расписание каждого дня
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => V2TeacherDayDto)
	days: Array<V2TeacherDayDto>;
}
