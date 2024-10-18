import { OmitType } from "@nestjs/swagger";
import { User } from "../../entity/user.entity";
import { plainToInstance } from "class-transformer";

export class V1ClientUserDto extends OmitType(User, [
	"accessToken",
	"password",
	"salt",
	"fcm",
	"version",
]) {
	static fromUser(userDto: User): V1ClientUserDto {
		return plainToInstance(V1ClientUserDto, {
			id: userDto.id,
			username: userDto.username,
			group: userDto.group,
			role: userDto.role,
		} as V1ClientUserDto);
	}
}
