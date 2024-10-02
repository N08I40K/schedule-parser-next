import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Post,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiExtraModels,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiUnauthorizedResponse,
	refs,
} from "@nestjs/swagger";
import {
	SignInReqDto,
	SignInResDto,
	SignUpReqDto,
	SignUpResDto,
	ChangePasswordReqDto,
	UpdateTokenReqDto,
	UpdateTokenResDto,
} from "../dto/auth.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { ScheduleService } from "../schedule/schedule.service";
import { UserToken } from "./auth.decorator";

@Controller("api/v1/auth")
export class AuthController {
	constructor(
		private readonly scheduleService: ScheduleService,
		private readonly authService: AuthService,
	) {}

	@ApiExtraModels(SignInReqDto)
	@ApiExtraModels(SignInResDto)
	@ApiOperation({ summary: "Авторизация по логину и паролю", tags: ["auth"] })
	@ApiBody({ schema: refs(SignInReqDto)[0] })
	@ApiOkResponse({
		description: "Авторизация прошла успешно",
		schema: refs(SignInResDto)[0],
	})
	@ApiUnauthorizedResponse({
		description: "Некорректное имя пользователя или пароль",
	})
	@ResultDto(SignInResDto)
	@HttpCode(HttpStatus.OK)
	@Post("sign-in")
	signIn(@Body() signInDto: SignInReqDto) {
		return this.authService.signIn(signInDto);
	}

	@ApiExtraModels(SignUpReqDto)
	@ApiExtraModels(SignUpResDto)
	@ApiOperation({ summary: "Регистрация по логину и паролю", tags: ["auth"] })
	@ApiBody({ schema: refs(SignUpReqDto)[0] })
	@ApiCreatedResponse({
		description: "Регистрация прошла успешно",
		schema: refs(SignUpResDto)[0],
	})
	@ApiConflictResponse({
		description: "Такой пользователь уже существует",
	})
	@ResultDto(SignUpResDto)
	@HttpCode(HttpStatus.CREATED)
	@Post("sign-up")
	async signUp(@Body() signUpDto: SignUpReqDto) {
		if (
			!(await this.scheduleService.getGroupNames()).names.includes(
				signUpDto.group.replaceAll(" ", ""),
			)
		) {
			throw new NotFoundException(
				"Передано название несуществующей группы",
			);
		}

		return this.authService.signUp(signUpDto);
	}

	@ApiExtraModels(UpdateTokenReqDto)
	@ApiExtraModels(UpdateTokenResDto)
	@ApiOperation({
		summary: "Обновление просроченного токена",
		tags: ["auth", "access-token"],
	})
	@ApiBody({ schema: refs(UpdateTokenReqDto)[0] })
	@ApiOkResponse({
		description: "Токен обновлён успешно",
		schema: refs(UpdateTokenResDto)[0],
	})
	@ApiNotFoundResponse({
		description: "Передан несуществующий или недействительный токен",
	})
	@ResultDto(UpdateTokenResDto)
	@HttpCode(HttpStatus.OK)
	@Post("update-token")
	updateToken(
		@Body() updateTokenDto: UpdateTokenReqDto,
	): Promise<UpdateTokenResDto> {
		return this.authService.updateToken(updateTokenDto);
	}

	@ApiExtraModels(ChangePasswordReqDto)
	@ApiOperation({
		summary: "Обновление пароля",
		tags: ["auth", "password"],
	})
	@ApiBody({ schema: refs(ChangePasswordReqDto)[0] })
	@ApiOkResponse({ description: "Пароль обновлён успешно" })
	@ApiConflictResponse({ description: "Пароли идентичны" })
	@ApiUnauthorizedResponse({
		description:
			"Передан неверный текущий пароль или запрос был послан без токена",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-password")
	async changePassword(
		@Body() changePasswordReqDto: ChangePasswordReqDto,
		@UserToken() userToken: string,
	): Promise<void> {
		await this.authService
			.decodeUserToken(userToken)
			.then((user) =>
				this.authService.changePassword(user, changePasswordReqDto),
			);
	}
}
