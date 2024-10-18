import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { V1DayDto } from "./v1-day.dto";

export class V1GroupDto {
	@ApiProperty({
		example: "ИС-214/23",
		description: "Название группы",
	})
	@IsString()
	name: string;

	@ApiProperty({ example: [], description: "Дни недели" })
	@IsArray()
	@ValidateNested({ each: true })
	@IsOptional()
	@Type(() => V1DayDto)
	days: Array<V1DayDto | null>;

	constructor(name: string) {
		this.name = name;
		this.days = [];
	}
}
