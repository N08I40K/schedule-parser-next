import { IsArray } from "class-validator";

export class ScheduleGroupNamesDto {
	/**
	 * Группы
	 * @example ["ИС-214/23", "ИС-213/23"]
	 */
	@IsArray()
	names: Array<string>;
}
