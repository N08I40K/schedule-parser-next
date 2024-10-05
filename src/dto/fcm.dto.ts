import { ApiProperty } from "@nestjs/swagger";
import { IsSemVer, IsUrl } from "class-validator";

export class FcmPostUpdateDto {
	@ApiProperty({ example: "1.6.0", description: "Версия приложения" })
	@IsSemVer()
	// @Expose()
	version: string;

	@ApiProperty({
		example: "https://download.host/app-release-1.6.0.apk",
		description: "Ссылка на приложение",
	})
	@IsUrl()
	// @Expose()
	downloadLink: string;
}
