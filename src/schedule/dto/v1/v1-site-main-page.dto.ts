import { ApiProperty } from "@nestjs/swagger";
import { IsBase64 } from "class-validator";

export class V1SiteMainPageDto {
	@ApiProperty({
		example: "MHz=",
		description: "Страница политехникума",
	})
	@IsBase64()
	mainPage: string;
}
