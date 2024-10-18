import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { UserToken } from "../auth/auth.decorator";
import { AuthService } from "../auth/auth.service";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { V2ClientUserDto } from "./dto/v2/v2-client-user.dto";

@ApiTags("v2/users")
@ApiBearerAuth()
@Controller({ path: "users", version: "2" })
@UseGuards(AuthGuard)
export class V2UsersController {
	constructor(private readonly authService: AuthService) {}

	@ApiOperation({ summary: "Получение данных о профиле пользователя" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Получение профиля прошло успешно",
		type: V2ClientUserDto,
	})
	@ResultDto(V2ClientUserDto)
	@HttpCode(HttpStatus.OK)
	@Get("me")
	async getMe(@UserToken() token: string): Promise<V2ClientUserDto> {
		return V2ClientUserDto.fromUser(
			await this.authService.decodeUserToken(token),
		);
	}
}
