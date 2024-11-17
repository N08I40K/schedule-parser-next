import "reflect-metadata";

import { V2LessonType } from "../enum/v2-lesson-type.enum";
import {
	IsArray,
	IsEnum,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { NullIf } from "../../utility/class-validators/conditional-field";
import { LessonTimeDto } from "./lesson-time.dto";
import { LessonSubGroupDto } from "./lesson-sub-group.dto";

export class LessonDto {
	/**
	 * Тип занятия
	 * @example DEFAULT
	 */
	@IsEnum(V2LessonType)
	@Transform(({ value, options }) => {
		if (options?.groups?.includes("v1")) {
			switch (value as V2LessonType) {
				case V2LessonType.CONSULTATION:
				case V2LessonType.INDEPENDENT_WORK:
				case V2LessonType.EXAM:
				case V2LessonType.EXAM_WITH_GRADE:
					return V2LessonType.DEFAULT;
				default:
					return value;
			}
		}

		return value;
	})
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
	@NullIf((self: LessonDto) => {
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
	@NullIf((self: LessonDto) => {
		return self.type === V2LessonType.BREAK;
	})
	@Transform(({ value, obj, options }) => {
		if (!value) return value;

		if (options?.groups?.includes("v1")) {
			switch (obj.type as V2LessonType) {
				case V2LessonType.INDEPENDENT_WORK:
					return `Самостоятельная | ${value}`;
				case V2LessonType.CONSULTATION:
					return `Консультация | ${value}`;
				case V2LessonType.EXAM:
					return `ЗАЧЕТ | ${value}`;
				case V2LessonType.EXAM_WITH_GRADE:
					return `ЗАЧЕТ С ОЦЕНКОЙ | ${value}`;
				default:
					return value;
			}
		}

		return value;
	})
	name: string | null;

	/**
	 * Начало и конец занятия
	 */
	@Type(() => LessonTimeDto)
	time: LessonTimeDto;

	/**
	 * Тип занятия
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => LessonSubGroupDto)
	@IsOptional()
	@NullIf((self: LessonDto) => {
		return self.type !== V2LessonType.DEFAULT;
	})
	subGroups: Array<LessonSubGroupDto> | null;
}
