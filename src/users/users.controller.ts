import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ClientUserDto } from "../dto/user.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { UserToken } from "../auth/auth.decorator";
import { AuthService } from "../auth/auth.service";

@Controller("api/v1/users")
@UseGuards(AuthGuard)
export class UsersController {
	constructor(private readonly authService: AuthService) {}

	@ResultDto(ClientUserDto)
	@HttpCode(HttpStatus.OK)
	@Get("me")
	async getMe(@UserToken() token: string): Promise<ClientUserDto> {
		const userDto = await this.authService.decodeUserToken(token);

		return ClientUserDto.fromUserDto(userDto);
	}
}
