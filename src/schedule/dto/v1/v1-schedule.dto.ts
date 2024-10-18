import { IsDate, IsObject, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class V1ScheduleDto {
	@ApiProperty({
		example: new Date(),
		description:
			"Дата когда последний раз расписание было скачано с сервера политехникума",
	})
	@IsDate()
	updatedAt: Date;

	@ApiProperty({ description: "Расписание групп" })
	@IsObject()
	@IsOptional()
	groups: any;

	@ApiProperty({
		example: { "ИС-214/23": [5, 6] },
		description: "Обновлённые дни с последнего изменения расписания",
	})
	@IsObject()
	@Type(() => Object)
	@Transform(({ value }) => {
		const object = {};

		for (const key in value) {
			object[key] = value[key];
		}

		return object;
	})
	@Type(() => Object)
	lastChangedDays: Array<Array<number>>;
}
