import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class V1LessonTimeDto {
	@ApiProperty({
		example: 0,
		description: "Начало занятия в минутах относительно начала суток",
	})
	@IsNumber()
	start: number;
	@ApiProperty({
		example: 60,
		description: "Конец занятия в минутах относительно начала суток",
	})
	@IsNumber()
	end: number;

	constructor(start: number, end: number) {
		this.start = start;
		this.end = end;
	}

	static fromString(time: string): V1LessonTimeDto {
		time = time.trim().replaceAll(".", ":");

		const regex = /(\d+:\d+)-(\d+:\d+)/g;

		const parseResult = regex.exec(time);
		if (!parseResult) return new V1LessonTimeDto(0, 0);

		const start = parseResult[1].split(":");
		const end = parseResult[2].split(":");

		return new V1LessonTimeDto(
			Number.parseInt(start[0]) * 60 + Number.parseInt(start[1]),
			Number.parseInt(end[0]) * 60 + Number.parseInt(end[1]),
		);
	}
}
