import { OmitType } from "@nestjs/swagger";
import { User } from "../../entity/user.entity";
import { plainToInstance } from "class-transformer";

export class V2ClientUserDto extends OmitType(User, [
	"password",
	"salt",
	"fcm",
	"version",
]) {
	static fromUser(userDto: User): V2ClientUserDto {
		return plainToInstance(V2ClientUserDto, {
			id: userDto.id,
			username: userDto.username,
			accessToken: userDto.accessToken,
			group: userDto.group,
			role: userDto.role,
		} as V2ClientUserDto);
	}
}
