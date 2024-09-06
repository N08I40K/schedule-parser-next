import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
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
	SignInDto,
	SignInResultDto,
	SignUpDto,
	SignUpResultDto,
	UpdateTokenDto,
	UpdateTokenResultDto,
} from "../dto/auth.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";

@Controller("api/v1/auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@ApiExtraModels(SignInDto)
	@ApiExtraModels(SignInResultDto)
	@ApiOperation({ summary: "Авторизация по логину и паролю", tags: ["auth"] })
	@ApiBody({ schema: refs(SignInDto)[0] })
	@ApiOkResponse({
		description: "Авторизация прошла успешно",
		schema: refs(SignInResultDto)[0],
	})
	@ApiUnauthorizedResponse({
		description: "Некорректное имя пользователя или пароль",
	})
	@ResultDto(SignInResultDto)
	@HttpCode(HttpStatus.OK)
	@Post("signIn")
	signIn(@Body() signInDto: SignInDto) {
		return this.authService.signIn(signInDto);
	}

	@ApiExtraModels(SignUpDto)
	@ApiExtraModels(SignUpResultDto)
	@ApiOperation({ summary: "Регистрация по логину и паролю", tags: ["auth"] })
	@ApiBody({ schema: refs(SignUpDto)[0] })
	@ApiCreatedResponse({
		description: "Регистрация прошла успешно",
		schema: refs(SignUpResultDto)[0],
	})
	@ApiConflictResponse({
		description: "Такой пользователь уже существует",
	})
	@ResultDto(SignUpResultDto)
	@HttpCode(HttpStatus.CREATED)
	@Post("signUp")
	signUp(@Body() signUpDto: SignUpDto) {
		return this.authService.signUp(signUpDto);
	}

	@ApiExtraModels(UpdateTokenDto)
	@ApiExtraModels(UpdateTokenResultDto)
	@ApiOperation({
		summary: "Обновление просроченного токена",
		tags: ["auth"],
	})
	@ApiBody({ schema: refs(UpdateTokenDto)[0] })
	@ApiOkResponse({
		description: "Токен обновлён успешно",
		schema: refs(UpdateTokenResultDto)[0],
	})
	@ApiNotFoundResponse({
		description: "Передан несуществующий или недействительный токен",
	})
	@ResultDto(UpdateTokenResultDto)
	@HttpCode(HttpStatus.OK)
	@Post("updateToken")
	updateToken(
		@Body() updateTokenDto: UpdateTokenDto,
	): Promise<UpdateTokenResultDto> {
		return this.authService.updateToken(updateTokenDto);
	}
}
