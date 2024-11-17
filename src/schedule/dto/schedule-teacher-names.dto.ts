import { IsArray } from "class-validator";

export class ScheduleTeacherNamesDto {
	/**
	 * Группы
	 * @example ["Хомченко Н.Е."]
	 */
	@IsArray()
	names: Array<string>;
}
