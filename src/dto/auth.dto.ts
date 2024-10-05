import {
	ApiProperty,
	IntersectionType,
	PartialType,
	PickType,
} from "@nestjs/swagger";
import { UserDto } from "./user.dto";
import { IsString } from "class-validator";
import { Expose } from "class-transformer";

// SignIn
export class SignInReqDto extends PickType(UserDto, ["username"]) {
	@ApiProperty({
		example: "my-password",
		description: "Пароль в исходном виде",
	})
	@IsString()
	password: string;
}

export class SignInResDto extends PickType(UserDto, ["id", "accessToken"]) {}

// SignUp
export class SignUpReqDto extends IntersectionType(
	SignInReqDto,
	PickType(UserDto, ["role", "group"]),
	PartialType(PickType(UserDto, ["version"])),
) {}

export class SignUpResDto extends SignInResDto {}

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
