import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsArray, IsObject, ValidateNested } from "class-validator";
import { V1GroupDto } from "./v1-group.dto";
import { Type } from "class-transformer";
import { V1ScheduleDto } from "./v1-schedule.dto";

export class V1GroupScheduleDto extends OmitType(V1ScheduleDto, [
	"groups",
	"lastChangedDays",
]) {
	@ApiProperty({ description: "Расписание группы" })
	@IsObject()
	group: V1GroupDto;

	@ApiProperty({
		example: [5, 6],
		description: "Обновлённые дни с последнего изменения расписания",
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	lastChangedDays: Array<number>;
}
