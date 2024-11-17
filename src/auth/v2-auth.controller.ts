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
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { UpdateTokenDto } from "./dto/update-token.dto";
import { V2ClientUserDto } from "../users/dto/v2/v2-client-user.dto";
import { ScheduleService } from "../schedule/schedule.service";

@ApiTags("v2/auth")
@Controller({ path: "auth", version: "2" })
export class V2AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly scheduleService: ScheduleService,
	) {}

	@ApiOperation({ summary: "Авторизация по логину и паролю" })
	@ApiBody({ type: SignInDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Авторизация прошла успешно",
		type: V2ClientUserDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description: "Некорректное имя пользователя или пароль",
	})
	@ResultDto(V2ClientUserDto)
	@HttpCode(HttpStatus.OK)
	@Post("sign-in")
	async signIn(@Body() reqDto: SignInDto): Promise<V2ClientUserDto> {
		return V2ClientUserDto.fromUser(await this.authService.signIn(reqDto));
	}

	@ApiOperation({ summary: "Регистрация по логину и паролю" })
	@ApiBody({ type: SignUpDto })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "Регистрация прошла успешно",
		type: V2ClientUserDto,
	})
	@ApiResponse({
		status: HttpStatus.CONFLICT,
		description: "Такой пользователь уже существует",
	})
	@ResultDto(V2ClientUserDto)
	@HttpCode(HttpStatus.CREATED)
	@Post("sign-up")
	async signUp(@Body() reqDto: SignUpDto): Promise<V2ClientUserDto> {
		if (
			!(await this.scheduleService.getGroupNames()).names.includes(
				reqDto.group.replaceAll(" ", ""),
			)
		) {
			throw new NotFoundException(
				"Передано название несуществующей группы",
			);
		}

		return V2ClientUserDto.fromUser(await this.authService.signUp(reqDto));
	}

	@ApiOperation({ summary: "Обновление просроченного токена" })
	@ApiBody({ type: UpdateTokenDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Токен обновлён успешно",
		type: V2ClientUserDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Передан несуществующий или недействительный токен",
	})
	@ResultDto(V2ClientUserDto)
	@HttpCode(HttpStatus.OK)
	@Post("update-token")
	async updateToken(
		@Body() reqDto: UpdateTokenDto,
	): Promise<V2ClientUserDto> {
		return V2ClientUserDto.fromUser(
			await this.authService.updateToken(reqDto.accessToken),
		);
	}
}
