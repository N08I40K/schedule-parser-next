import { IsArray, IsString, ValidateNested } from "class-validator";

export class FcmUser {
	/**
	 * Токен Firebase Cloud Messaging
	 * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXCJ9..."
	 */
	@IsString()
	token: string;

	/**
	 * Топики на которые подписан пользователь
	 * @example ["schedule-update"]
	 */
	@IsArray()
	@ValidateNested({ each: true })
	@IsString()
	topics: Array<string>;
}
