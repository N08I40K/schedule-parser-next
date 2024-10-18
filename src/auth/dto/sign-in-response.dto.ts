import { IsJWT, IsMongoId, IsOptional, IsString } from "class-validator";

export class SignInResponseDto {
	/**
	 * Идентификатор (ObjectId)
	 * @example "66e1b7e255c5d5f1268cce90"
	 */
	@IsMongoId()
	id: string;

	/**
	 * Последний токен доступа
	 * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXCJ9..."
	 */
	@IsJWT()
	accessToken: string;

	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@IsString()
	@IsOptional()
	group?: string;
}
