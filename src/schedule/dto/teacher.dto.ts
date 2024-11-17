import { IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TeacherDayDto } from "./teacher-day.dto";

export class TeacherDto {
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
	@Type(() => TeacherDayDto)
	days: Array<TeacherDayDto>;
}
