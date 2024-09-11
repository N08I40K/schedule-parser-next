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
	UpdateTokenDto,
	UpdateTokenResultDto,
} from "../dto/auth.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { ScheduleService } from "../schedule/schedule.service";

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
	@Post("signIn")
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
	@Post("signUp")
	async signUp(@Body() signUpDto: SignUpReqDto) {
		if (
			!(await this.scheduleService.getGroupNames()).names.includes(
				signUpDto.group,
			)
		) {
			throw new NotFoundException(
				"Передано название несуществующей группы",
			);
		}

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
