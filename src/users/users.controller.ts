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
import {
	ChangeGroupReqDto,
	ChangeUsernameReqDto,
	ClientUserResDto,
} from "../dto/user.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { UserToken } from "../auth/auth.decorator";
import { AuthService } from "../auth/auth.service";
import { UsersService } from "./users.service";
import {
	ApiBody,
	ApiConflictResponse,
	ApiExtraModels,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	refs,
} from "@nestjs/swagger";

@Controller("api/v1/users")
@UseGuards(AuthGuard)
export class UsersController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
	) {}

	@ApiExtraModels(ClientUserResDto)
	@ApiOperation({
		summary: "Получение данных о профиле пользователя",
		tags: ["users"],
	})
	@ApiOkResponse({
		description: "Получение профиля прошло успешно",
		schema: refs(ClientUserResDto)[0],
	})
	@ResultDto(ClientUserResDto)
	@HttpCode(HttpStatus.OK)
	@Get("me")
	async getMe(@UserToken() token: string): Promise<ClientUserResDto> {
		const userDto = await this.authService.decodeUserToken(token);

		return ClientUserResDto.fromUserDto(userDto);
	}

	@ApiExtraModels(ChangeUsernameReqDto)
	@ApiOperation({ summary: "Смена имени пользователя", tags: ["users"] })
	@ApiBody({ schema: refs(ChangeUsernameReqDto)[0] })
	@ApiOkResponse({ description: "Смена имени профиля прошла успешно" })
	@ApiConflictResponse({
		description: "Пользователь с таким именем уже существует",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-username")
	async changeUsername(
		@Body() changeUsernameDto: ChangeUsernameReqDto,
		@UserToken() token: string,
	): Promise<void> {
		const user = await this.authService.decodeUserToken(token);

		return await this.usersService.changeUsername(user, changeUsernameDto);
	}

	@ApiExtraModels(ChangeGroupReqDto)
	@ApiOperation({ summary: "Смена группы пользователя", tags: ["users"] })
	@ApiBody({ schema: refs(ChangeGroupReqDto)[0] })
	@ApiOkResponse({ description: "Смена группы прошла успешно" })
	@ApiNotFoundResponse({
		description: "Группа с таким названием не существует",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-group")
	async changeGroup(
		@Body() changeGroupDto: ChangeGroupReqDto,
		@UserToken() token: string,
	): Promise<void> {
		const user = await this.authService.decodeUserToken(token);

		return await this.usersService.changeGroup(user, changeGroupDto);
	}
}
