import { IsArray } from "class-validator";

export class V2ScheduleTeacherNamesDto {
	/**
	 * Группы
	 * @example ["Хомченко Н.Е."]
	 */
	@IsArray()
	names: Array<string>;
}
