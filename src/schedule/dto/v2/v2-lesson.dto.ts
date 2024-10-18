import "reflect-metadata";

import { V2LessonType } from "../../enum/v2-lesson-type.enum";
import {
	IsArray,
	IsEnum,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { NullIf } from "../../../utility/class-validators/conditional-field";
import { V2LessonTimeDto } from "./v2-lesson-time.dto";
import { V2LessonSubGroupDto } from "./v2-lesson-sub-group.dto";

export class V2LessonDto {
	/**
	 * Тип занятия
	 * @example DEFAULT
	 */
	@IsEnum(V2LessonType)
	type: V2LessonType;

	/**
	 * Индексы пар, если присутствуют
	 * @example [1, 3]
	 * @optional
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	@IsOptional()
	@NullIf((self: V2LessonDto) => {
		return self.type !== V2LessonType.DEFAULT;
	})
	defaultRange: Array<number> | null;

	/**
	 * Название занятия
	 * @example "Элементы высшей математики"
	 * @optional
	 */
	@IsString()
	@IsOptional()
	@NullIf((self: V2LessonDto) => {
		return self.type === V2LessonType.BREAK;
	})
	name: string | null;

	/**
	 * Начало и конец занятия
	 */
	@Type(() => V2LessonTimeDto)
	time: V2LessonTimeDto;

	/**
	 * Тип занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => V2LessonSubGroupDto)
	@IsOptional()
	@NullIf((self: V2LessonDto) => {
		return self.type !== V2LessonType.DEFAULT;
	})
	subGroups: Array<V2LessonSubGroupDto> | null;
}
