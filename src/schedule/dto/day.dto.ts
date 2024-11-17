import {
	IsArray,
	IsDateString,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { LessonDto } from "./lesson.dto";

export class DayDto {
	/**
	 * День недели
	 * @example "Понедельник"
	 */
	@IsString()
	@Transform(({ value, obj, options }) => {
		if ((obj as DayDto).street && options?.groups?.includes("v1"))
			return `${value} | ${(obj as DayDto).street}`;

		return value;
	})
	name: string;

	/**
	 * Улица (v2)
	 * @example "Железнодорожная, 13"
	 */
	@IsString()
	@Transform(({ value, options }) => {
		if (value && options?.groups?.includes("v1")) return undefined;

		return value;
	})
	@IsOptional()
	street?: string;

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
	@Type(() => LessonDto)
	lessons: Array<LessonDto>;
}
