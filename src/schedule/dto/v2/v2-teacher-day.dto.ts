import { V2DayDto } from "./v2-day.dto";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OmitType } from "@nestjs/swagger";
import { V2TeacherLessonDto } from "./v2-teacher-lesson.dto";

export class V2TeacherDayDto extends OmitType(V2DayDto, ["lessons"]) {
	/**
	 * Занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => V2TeacherLessonDto)
	lessons: Array<V2TeacherLessonDto>;
}
