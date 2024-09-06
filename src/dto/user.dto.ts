import { ApiProperty, OmitType } from "@nestjs/swagger";
import {
	IsJWT,
	IsMongoId,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";

export class UserDto {
	@ApiProperty({ description: "Идентификатор (ObjectId)" })
	@IsMongoId()
	id: string;
	@ApiProperty({ example: "n08i40k", description: "Имя" })
	@IsString()
	@MinLength(4)
	@MaxLength(10)
	username: string;
	@ApiProperty({ description: "Соль пароля" })
	@IsString()
	salt: string;
	@ApiProperty({ description: "Хеш пароля" })
	@IsString()
	password: string;
	@ApiProperty({ description: "Последний токен доступа" })
	@IsJWT()
	accessToken: string;
}

// TODO: Доделать пользователей
// noinspection JSUnusedGlobalSymbols
export class ClientUserDto extends OmitType(UserDto, [
	"password",
	"salt",
	"accessToken",
]) {}
