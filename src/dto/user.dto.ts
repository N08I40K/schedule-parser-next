import { ApiProperty, OmitType } from "@nestjs/swagger";
import {
	IsEnum,
	IsJWT,
	IsMongoId,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import { Expose, plainToClass } from "class-transformer";

export enum UserRoleDto {
	STUDENT = "STUDENT",
	TEACHER = "TEACHER",
	ADMIN = "ADMIN",
}

export class UserDto {
	@ApiProperty({ description: "Идентификатор (ObjectId)" })
	@IsMongoId()
	@Expose()
	id: string;

	@ApiProperty({ example: "n08i40k", description: "Имя" })
	@IsString()
	@MinLength(4)
	@MaxLength(10)
	@Expose()
	username: string;

	@ApiProperty({
		example: "$2b$08$34xwFv1WVJpvpVi3tZZuv.",
		description: "Соль пароля",
	})
	@IsString()
	@Expose()
	salt: string;

	@ApiProperty({
		example: "$2b$08$34xwFv1WVJpvpVi3tZZuv...",
		description: "Хеш пароля",
	})
	@IsString()
	@Expose()
	password: string;

	@ApiProperty({
		example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		description: "Последний токен доступа",
	})
	@IsJWT()
	@Expose()
	accessToken: string;

	@ApiProperty({ example: "ИС-214/23", description: "Группа пользователя" })
	@IsString()
	@Expose()
	group: string;

	@ApiProperty({
		example: UserRoleDto.STUDENT,
		description: "Роль пользователя",
	})
	@IsEnum(UserRoleDto)
	@Expose()
	role: UserRoleDto;
}

export class ClientUserDto extends OmitType(UserDto, [
	"password",
	"salt",
	"accessToken",
]) {
	static fromUserDto(userDto: UserDto): ClientUserDto {
		return plainToClass(ClientUserDto, userDto, {
			excludeExtraneousValues: true,
		});
	}
}
