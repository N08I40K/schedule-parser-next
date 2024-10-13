import {
	ApiProperty,
	IntersectionType,
	PartialType,
	PickType,
} from "@nestjs/swagger";
import { UserDto } from "./user.dto";
import { IsJWT, IsMongoId, IsString } from "class-validator";
import { Expose, instanceToPlain, plainToClass } from "class-transformer";

// SignIn
export class SignInReqDto extends PickType(UserDto, ["username"]) {
	@ApiProperty({
		example: "my-password",
		description: "Пароль в исходном виде",
	})
	@IsString()
	password: string;
}

export class SignInResDtoV0 {
	@ApiProperty({
		example: "66e1b7e255c5d5f1268cce90",
		description: "Идентификатор (ObjectId)",
	})
	@IsMongoId()
	@Expose()
	id: string;

	@ApiProperty({
		example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
		description: "Последний токен доступа",
	})
	@IsJWT()
	@Expose()
	accessToken: string;
}

export class SignInResDtoV1 extends SignInResDtoV0 {
	@ApiProperty({
		example: "ИС-214/23",
		description: "Группа",
	})
	@IsString()
	@Expose()
	group: string;
}

export class SignInResDto extends SignInResDtoV1 {
	public static stripVersion(
		instance: SignInResDto,
		version: number,
	): SignInResDtoV0 | SignInResDtoV1 {
		switch (version) {
			default:
				return instance;
			case 0: {
				return plainToClass(SignInResDtoV0, instanceToPlain(instance), {
					excludeExtraneousValues: true,
				});
			}
		}
	}
}

// SignUp
export class SignUpReqDto extends IntersectionType(
	SignInReqDto,
	PickType(UserDto, ["role", "group"]),
	PartialType(PickType(UserDto, ["version"])),
) {}

export class SignUpResDto extends PickType(SignInResDto, [
	"id",
	"accessToken",
]) {}

// Update token
export class UpdateTokenReqDto extends PickType(UserDto, ["accessToken"]) {}

export class UpdateTokenResDto extends UpdateTokenReqDto {}

// Update password
export class ChangePasswordReqDto {
	@ApiProperty({
		example: "my-old-password",
		description: "Старый пароль",
	})
	@IsString()
	@Expose()
	oldPassword: string;

	@ApiProperty({
		example: "my-new-password",
		description: "Новый пароль",
	})
	@IsString()
	@Expose()
	newPassword: string;
}
