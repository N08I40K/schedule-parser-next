import { PickType } from "@nestjs/swagger";
import { User } from "../../users/entity/user.entity";
import { IsString } from "class-validator";

export class SignInDto extends PickType(User, ["username"]) {
	/**
	 * Пароль в исходном виде
	 * @example "my-password"
	 */
	@IsString()
	password: string;
}
