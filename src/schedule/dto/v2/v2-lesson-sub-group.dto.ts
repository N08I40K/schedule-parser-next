import { IsNumber, IsOptional, IsString } from "class-validator";

export class V2LessonSubGroupDto {
	/**
	 * Номер подгруппы
	 * @example 1
	 */
	@IsNumber()
	number: number;

	/**
	 * Кабинет
	 * @example "с\з"
	 * @example "42"
	 */
	@IsString()
	@IsOptional()
	cabinet: string | null;

	/**
	 * ФИО преподавателя
	 * @example "Хомченко Н.Е."
	 */
	@IsString()
	teacher: string;
}
