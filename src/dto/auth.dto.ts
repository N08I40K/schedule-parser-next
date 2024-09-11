import { ApiProperty, IntersectionType, PickType } from "@nestjs/swagger";
import { UserDto } from "./user.dto";
import { IsString } from "class-validator";

// SignIn
export class SignInReqDto extends PickType(UserDto, ["username"]) {
	@ApiProperty({ description: "Пароль в исходном виде" })
	@IsString()
	password: string;
}

export class SignInResDto extends PickType(UserDto, ["id", "accessToken"]) {}

// SignUp
export class SignUpReqDto extends IntersectionType(
	SignInReqDto,
	PickType(UserDto, ["role", "group"]),
) {}

export class SignUpResDto extends SignInResDto {}

// Update token
export class UpdateTokenDto extends PickType(UserDto, ["accessToken"]) {}

export class UpdateTokenResultDto extends UpdateTokenDto {}
