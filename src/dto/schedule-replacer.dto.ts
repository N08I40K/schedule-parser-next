import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNumber, IsObject, IsString } from "class-validator";

export class ScheduleReplacerDto {
	@ApiProperty({ description: "Etag заменяемого расписания" })
	@IsString()
	etag: string;

	@ApiProperty({ description: "Данные файла расписания" })
	@IsObject()
	data: ArrayBuffer;
}

export class ScheduleReplacerResDto extends PickType(ScheduleReplacerDto, [
	"etag",
]) {
	@ApiProperty({ example: 1405, description: "Размер файла в байтах" })
	@IsNumber()
	size: number;
}

export class ClearScheduleReplacerResDto {
	@ApiProperty({
		example: 1,
		description: "Количество удалённых заменителей расписания",
	})
	@IsNumber()
	count: number;
}
