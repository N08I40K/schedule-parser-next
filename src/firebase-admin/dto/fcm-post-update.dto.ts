import { IsSemVer, IsUrl } from "class-validator";

export class FcmPostUpdateDto {
	/**
	 * Версия приложения
	 * @example "1.6.0"
	 */
	@IsSemVer()
	readonly version: string;

	/**
	 * Ссылка на приложение
	 * @example "https://download.host/app-release-1.6.0.apk"
	 */
	@IsUrl()
	readonly downloadLink: string;
}
