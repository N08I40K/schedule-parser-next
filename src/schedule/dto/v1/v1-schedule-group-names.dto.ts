import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";

export class V1ScheduleGroupNamesDto {
	@ApiProperty({
		example: ["ИС-214/23", "ИС-213/23"],
		description: "Список названий всех групп в текущем расписании",
	})
	@IsArray()
	names: Array<string>;
}
