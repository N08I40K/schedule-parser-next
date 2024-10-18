import { IsNumber } from "class-validator";

export class ClearScheduleReplacerDto {
	/**
	 * Количество удалённых заменителей расписания
	 * @example 1
	 */
	@IsNumber()
	count: number;
}
