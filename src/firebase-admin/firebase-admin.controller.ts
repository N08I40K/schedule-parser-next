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
import { UserFromTokenPipe } from "../auth/auth.pipe";
import { UserDto } from "../dto/user.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import { FirebaseAdminService } from "./firebase-admin.service";
import { FcmPostUpdateDto } from "../dto/fcm.dto";
import { isSemVer } from "class-validator";

@Controller("api/v1/fcm")
@UseGuards(AuthGuard)
export class FirebaseAdminController {
	private readonly oldTopics = new Set(["app-update", "schedule-update"]);
	private readonly defaultTopics = new Set(["common"]);

	constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

	@Post("set-token/:token")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	async setToken(
		@Param("token") token: string,
		@UserToken(UserFromTokenPipe) user: UserDto,
	): Promise<void> {
		if (user.fcm?.token === token) return;

		const updatedUser = (
			await this.firebaseAdminService.updateToken(user, token)
		).userDto;

		await this.firebaseAdminService
			.subscribe(updatedUser, this.defaultTopics, true)
			.then((userDto) =>
				this.firebaseAdminService.unsubscribe(userDto, this.oldTopics),
			);
	}

	@Post("update-callback/:version")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	async updateCallback(
		@UserToken(UserFromTokenPipe) userDto: UserDto,
		@Param("version") version: string,
	) {
		if (!isSemVer(version)) {
			throw new BadRequestException(
				"version must be a Semantic Versioning Specification",
			);
		}

		await this.firebaseAdminService.updateApp(
			userDto,
			version,
			this.defaultTopics,
		);
	}

	@Post("post-update")
	@HttpCode(HttpStatus.OK)
	@ResultDto(null)
	async postUpdate(@Body() postUpdateDto: FcmPostUpdateDto): Promise<void> {
		await this.firebaseAdminService.sendByTopic("app-update", {
			data: {
				type: "app-update",
				version: postUpdateDto.version,
				downloadLink: postUpdateDto.downloadLink,
			},
		});
	}
}
