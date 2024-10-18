import {
	IsArray,
	IsDateString,
	IsString,
	ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { V2LessonDto } from "./v2-lesson.dto";

export class V2DayDto {
	/**
	 * День недели
	 * @example Понедельник
	 */
	@IsString()
	name: string;

	/**
	 * Дата
	 * @example "2024-10-06T20:00:00.000Z"
	 */
	@IsDateString()
	date: Date;

	/**
	 * Занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => V2LessonDto)
	lessons: Array<V2LessonDto>;
}
