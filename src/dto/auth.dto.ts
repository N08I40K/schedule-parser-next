import { ApiProperty, PickType } from "@nestjs/swagger";
import { UserDto } from "./user.dto";
import { IsString } from "class-validator";

export class SignInDto extends PickType(UserDto, ["username"]) {
	@ApiProperty({ description: "Пароль в исходном виде" })
	@IsString()
	password: string;
}

export class SignInResultDto extends PickType(UserDto, [
	"id",
	"access_token",
]) {}

export class SignUpDto extends SignInDto {}

export class SignUpResultDto extends SignInResultDto {}

export class UpdateTokenDto extends PickType(UserDto, ["access_token"]) {}

export class UpdateTokenResultDto extends UpdateTokenDto {}
