import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsHash } from "class-validator";
import { Expose } from "class-transformer";

export class V1CacheStatusDto {
	@ApiProperty({
		example: true,
		description: "Нужно ли обновить ссылку для скачивания xls?",
	})
	@IsBoolean()
	@Expose()
	cacheUpdateRequired: boolean;

	@ApiProperty({
		example: "e6ff169b01608addf998dbf8f40b019a7f514239",
		description: "Хеш последних полученных данных",
	})
	@IsHash("sha1")
	@Expose()
	cacheHash: string;
}
