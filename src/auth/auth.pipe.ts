import {
	Injectable,
	PipeTransform,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";

import { User } from "../users/entity/user.entity";

@Injectable()
export class UserPipe implements PipeTransform {
	constructor(
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
	) {}

	async transform(token: string): Promise<User> {
		const jwtUser: { id: string } = await this.jwtService.decode(token);

		if (!jwtUser)
			throw new UnauthorizedException("Передан некорректный токен!");

		const user = await this.usersService.findUnique({ id: jwtUser.id });
		if (!user)
			throw new UnauthorizedException("Передан некорректный токен!");

		return user as User;
	}
}
