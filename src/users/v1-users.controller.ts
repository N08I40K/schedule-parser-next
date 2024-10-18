import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { UserToken } from "../auth/auth.decorator";
import { AuthService } from "../auth/auth.service";
import { UsersService } from "./users.service";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { ChangeUsernameDto } from "./dto/change-username.dto";
import { ChangeGroupDto } from "./dto/change-group.dto";
import { V1ClientUserDto } from "./dto/v1/v1-client-user.dto";

@ApiTags("v1/users")
@ApiBearerAuth()
@Controller({ path: "users", version: "1" })
@UseGuards(AuthGuard)
export class V1UsersController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
	) {}

	@ApiOperation({ summary: "Получение данных о профиле пользователя" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Получение профиля прошло успешно",
		type: V1ClientUserDto,
	})
	@ResultDto(V1ClientUserDto)
	@HttpCode(HttpStatus.OK)
	@Get("me")
	async getMe(@UserToken() token: string): Promise<V1ClientUserDto> {
		return V1ClientUserDto.fromUser(
			await this.authService.decodeUserToken(token),
		);
	}

	@ApiOperation({ summary: "Смена имени пользователя" })
	@ApiBody({ type: ChangeUsernameDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Смена имени профиля прошла успешно",
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: "Пользователь с таким именем уже существует",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-username")
	async changeUsername(
		@Body() reqDto: ChangeUsernameDto,
		@UserToken() token: string,
	): Promise<void> {
		const user = await this.authService.decodeUserToken(token);

		return await this.usersService.changeUsername(user, reqDto);
	}

	@ApiOperation({ summary: "Смена группы пользователя" })
	@ApiBody({ type: ChangeGroupDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Смена группы прошла успешно",
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Группа с таким названием не существует",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-group")
	async changeGroup(
		@Body() reqDto: ChangeGroupDto,
		@UserToken() token: string,
	): Promise<void> {
		const user = await this.authService.decodeUserToken(token);

		return await this.usersService.changeGroup(user, reqDto);
	}
}
