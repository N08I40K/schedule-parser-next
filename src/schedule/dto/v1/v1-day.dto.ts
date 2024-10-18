import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V1LessonDto } from "./v1-lesson.dto";
import { V1LessonType } from "../../enum/v1-lesson-type.enum";

export class V1DayDto {
	@ApiProperty({
		example: "Понедельник",
		description: "День недели",
	})
	@IsString()
	name: string;

	@ApiProperty({ example: [0, 1, 3], description: "Индексы занятий" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	nonNullIndices: Array<number>;

	@ApiProperty({ example: [1, 3], description: "Индексы полных пар" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	defaultIndices: Array<number>;

	@ApiProperty({ example: [0], description: "Индексы доп. занятий" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	customIndices: Array<number>;

	@ApiProperty({ example: [], description: "Занятия" })
	@IsArray()
	@ValidateNested({ each: true })
	@IsOptional()
	@Type(() => V1LessonDto)
	lessons: Array<V1LessonDto | null>;

	constructor(name: string) {
		this.name = name;

		this.nonNullIndices = [];
		this.defaultIndices = [];
		this.customIndices = [];

		this.lessons = [];
	}

	public fillIndices(): void {
		this.nonNullIndices = [];
		this.defaultIndices = [];
		this.customIndices = [];

		for (const lessonRawIdx in this.lessons) {
			const lessonIdx = Number.parseInt(lessonRawIdx);

			const lesson = this.lessons[lessonIdx];
			if (lesson === null) continue;

			this.nonNullIndices.push(lessonIdx);

			(lesson.type === V1LessonType.DEFAULT
				? this.defaultIndices
				: this.customIndices
			).push(lessonIdx);
		}
	}
}
