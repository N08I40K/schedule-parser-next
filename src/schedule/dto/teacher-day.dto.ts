import { DayDto } from "./day.dto";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OmitType } from "@nestjs/swagger";
import { TeacherLessonDto } from "./teacher-lesson.dto";

export class TeacherDayDto extends OmitType(DayDto, ["lessons"]) {
	/**
	 * Занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => TeacherLessonDto)
	lessons: Array<TeacherLessonDto>;
}
