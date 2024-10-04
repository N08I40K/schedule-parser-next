import {
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

@Controller("api/v1/fcm")
@UseGuards(AuthGuard)
export class FirebaseAdminController {
	private readonly defaultTopics = new Set(["schedule-update"]);

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

		await this.firebaseAdminService.subscribe(
			updatedUser,
			this.defaultTopics,
		);
	}
}
