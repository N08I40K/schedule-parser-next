import { ApiProperty } from "@nestjs/swagger";
import { V1LessonType } from "../../enum/v1-lesson-type.enum";
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { V1LessonTimeDto } from "./v1-lesson-time.dto";
import { Type } from "class-transformer";

export class V1LessonDto {
	@ApiProperty({
		example: V1LessonType.DEFAULT,
		description: "Тип занятия",
	})
	@IsEnum(V1LessonType)
	type: V1LessonType;

	@ApiProperty({
		example: 1,
		description: "Индекс пары, если присутствует",
	})
	@IsNumber()
	defaultIndex: number;

	@ApiProperty({
		example: "Элементы высшей математики",
		description: "Название занятия",
	})
	@IsString()
	name: string;

	@ApiProperty({
		example: new V1LessonTimeDto(0, 60),
		description:
			"Начало и конец занятия в минутах относительно начала суток",
		required: false,
	})
	@IsOptional()
	@Type(() => V1LessonTimeDto)
	time: V1LessonTimeDto | null;

	@ApiProperty({ example: ["42", "с\\з"], description: "Кабинеты" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => String)
	cabinets: Array<string>;

	@ApiProperty({
		example: ["Хомченко Н.Е."],
		description: "ФИО преподавателей",
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => String)
	teacherNames: Array<string>;

	constructor(
		type: V1LessonType,
		defaultIndex: number,
		time: V1LessonTimeDto,
		name: string,
		cabinets: Array<string>,
		teacherNames: Array<string>,
	) {
		this.type = type;
		this.defaultIndex = defaultIndex;
		this.time = time;
		this.name = name;
		this.cabinets = cabinets;
		this.teacherNames = teacherNames;
	}
}
