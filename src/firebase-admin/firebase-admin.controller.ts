import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { UserToken } from "../auth/auth.decorator";
import { UserPipe } from "../auth/auth.pipe";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { FirebaseAdminService } from "./firebase-admin.service";
import { FcmPostUpdateDto } from "./dto/fcm-post-update.dto";
import { isSemVer } from "class-validator";
import { User } from "../users/entity/user.entity";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { AuthRoles } from "../auth/auth-role.decorator";
import { UserRole } from "../users/user-role.enum";
import {
	TokenMessage,
	TopicMessage,
} from "firebase-admin/lib/messaging/messaging-api";

@ApiTags("v1/fcm")
@ApiBearerAuth()
@Controller({ path: "fcm", version: "1" })
@UseGuards(AuthGuard)
export class FirebaseAdminController {
	private readonly oldTopics = new Set(["app-update", "schedule-update"]);

	constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

	@ApiOperation({ summary: "Отправка уведомления" })
	@ApiResponse({ status: HttpStatus.OK })
	@Post("post")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	@AuthRoles([UserRole.ADMIN])
	async post(@Body() message: TopicMessage | TokenMessage) {
		await this.firebaseAdminService.send(message);
	}

	@ApiOperation({ summary: "Установка FCM токена пользователем" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Установка токена удалась",
	})
	@Post("set-token/:token")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	async setToken(
		@Param("token") token: string,
		@UserToken(UserPipe) user: User,
	): Promise<void> {
		if (user.fcm?.token === token) return;

		const updatedUser = (
			await this.firebaseAdminService.updateToken(user, token)
		).userDto;

		await this.firebaseAdminService
			.subscribe(updatedUser, new Set(), true)
			.then((userDto) =>
				this.firebaseAdminService.unsubscribe(userDto, this.oldTopics),
			);
	}

	@ApiOperation({ summary: "Установка текущей версии приложения" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Установка версии удалась",
	})
	@Post("update-callback/:version")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	async updateCallback(
		@Param("version") version: string,
		@UserToken(UserPipe) userDto: User,
	): Promise<void> {
		if (!isSemVer(version)) {
			throw new BadRequestException(
				"version must be a Semantic Versioning Specification",
			);
		}

		await this.firebaseAdminService.updateApp(userDto, version);
	}

	@ApiOperation({
		summary: "Уведомление пользователей о выходе новой версии приложения",
	})
	@ApiBody({ type: FcmPostUpdateDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Уведомление отправлено",
	})
	@Post("post-update")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	async postUpdate(@Body() reqDto: FcmPostUpdateDto): Promise<void> {
		await this.firebaseAdminService.sendByTopic("common", {
			android: {
				priority: "high",
			},
			data: {
				type: "app-update",
				version: reqDto.version,
				downloadLink: reqDto.downloadLink,
			},
		});
	}
}
