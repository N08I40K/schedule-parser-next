import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Post,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { V1ScheduleService } from "../schedule/v1-schedule.service";
import { UserToken } from "./auth.decorator";
import { ResponseVersion } from "../version/response-version.decorator";
import { SignInDto } from "./dto/sign-in.dto";
import { SignInResponseDto } from "./dto/sign-in-response.dto";
import { SignUpResponseDto } from "./dto/sign-up-response.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { UpdateTokenDto } from "./dto/update-token.dto";
import { UpdateTokenResponseDto } from "./dto/update-token-response.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@ApiTags("v1/auth")
@Controller({ path: "auth", version: "1" })
export class V1AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly scheduleService: V1ScheduleService,
	) {}

	@ApiOperation({ summary: "Авторизация по логину и паролю" })
	@ApiBody({ type: SignInDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Авторизация прошла успешно",
		type: SignInResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: "Некорректное имя пользователя или пароль",
	})
	@ResultDto(SignInResponseDto)
	@HttpCode(HttpStatus.OK)
	@Post("sign-in")
	async signIn(
		@Body() signInDto: SignInDto,
		@ResponseVersion() responseVersion: number,
	): Promise<SignInResponseDto> {
		const data = await this.authService.signIn(signInDto);

		return {
			id: data.id,
			accessToken: data.accessToken,
			group: responseVersion ? data.group : null,
		};
	}

	@ApiOperation({ summary: "Регистрация по логину и паролю" })
	@ApiBody({ type: SignUpDto })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Регистрация прошла успешно",
		type: SignUpResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: "Такой пользователь уже существует",
	})
	@ResultDto(SignUpResponseDto)
	@HttpCode(HttpStatus.CREATED)
	@Post("sign-up")
	async signUp(@Body() signUpDto: SignUpDto): Promise<SignUpResponseDto> {
		if (
			!(await this.scheduleService.getGroupNames()).names.includes(
				signUpDto.group.replaceAll(" ", ""),
			)
		) {
			throw new NotFoundException(
				"Передано название несуществующей группы",
			);
		}

		const user = await this.authService.signUp(signUpDto);
		return {
			id: user.id,
			accessToken: user.accessToken,
		};
	}

	@ApiOperation({ summary: "Обновление просроченного токена" })
	@ApiBody({ type: UpdateTokenDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Токен обновлён успешно",
		type: UpdateTokenResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Передан несуществующий или недействительный токен",
	})
	@ResultDto(UpdateTokenResponseDto)
	@HttpCode(HttpStatus.OK)
	@Post("update-token")
	updateToken(
		@Body() updateTokenDto: UpdateTokenDto,
	): Promise<UpdateTokenResponseDto> {
		return this.authService.updateToken(updateTokenDto.accessToken);
	}

	@ApiOperation({ summary: "Обновление пароля" })
	@ApiBody({ type: ChangePasswordDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Пароль обновлён успешно",
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: "Пароли идентичны",
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description:
			"Передан неверный текущий пароль или запрос был послан без токена",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("change-password")
	async changePassword(
		@Body() changePasswordReqDto: ChangePasswordDto,
		@UserToken() userToken: string,
	): Promise<void> {
		await this.authService
			.decodeUserToken(userToken)
			.then((user) =>
				this.authService.changePassword(user, changePasswordReqDto),
			);
	}
}
