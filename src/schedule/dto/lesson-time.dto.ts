import { IsDateString } from "class-validator";

export class LessonTimeDto {
	/**
	 * Начало занятия
	 * @example "2024-10-07T04:30:00.000Z"
	 */
	@IsDateString()
	start: Date;

	/**
	 * Конец занятия
	 * @example "2024-10-07T04:40:00.000Z"
	 */
	@IsDateString()
	end: Date;
}
