import { ApiProperty, OmitType, PickType } from "@nestjs/swagger";
import {
	IsArray,
	IsEnum,
	IsJWT,
	IsMongoId,
	IsObject,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";
import { Expose, plainToClass, Type } from "class-transformer";

export enum UserRoleDto {
	STUDENT = "STUDENT",
	TEACHER = "TEACHER",
	ADMIN = "ADMIN",
}

export class UserFcmDto {
	@ApiProperty({
		description: "Токен Firebase Cloud Messaging",
	})
	@IsString()
	@Expose()
	token: string;

	@ApiProperty({
		example: ["schedule-update"],
		description: "Топики на которые подписан пользователь",
	})
	@IsArray()
	@ValidateNested({ each: true })
	@IsString()
	@Expose()
	topics: Array<string>;
}

export class UserDto {
	@ApiProperty({
		example: "66e1b7e255c5d5f1268cce90",
		description: "Идентификатор (ObjectId)",
	})
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

	@ApiProperty({ description: "Данные Firebase Cloud Messaging" })
	@IsObject()
	@Type(() => UserFcmDto)
	@IsOptional()
	@Expose()
	fcm: UserFcmDto | null;
}

export class ClientUserResDto extends OmitType(UserDto, [
	"password",
	"salt",
	"accessToken",
	"fcm",
]) {
	static fromUserDto(userDto: UserDto): ClientUserResDto {
		return plainToClass(ClientUserResDto, userDto, {
			excludeExtraneousValues: true,
		});
	}
}

// changes

export class ChangeUsernameReqDto extends PickType(UserDto, ["username"]) {}

export class ChangeGroupReqDto extends PickType(UserDto, ["group"]) {}
