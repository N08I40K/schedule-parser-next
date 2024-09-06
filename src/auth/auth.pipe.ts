import {
	Injectable,
	PipeTransform,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { user } from "@prisma/client";
import { UsersService } from "../users/users.service";

@Injectable()
export class UserFromTokenPipe implements PipeTransform {
	constructor(
		private readonly jwtService: JwtService,
		private readonly usersService: UsersService,
	) {}

	async transform(token: string): Promise<user | null> {
		const jwtUser: { id: string } = await this.jwtService.decode(token);

		if (!jwtUser)
			throw new UnauthorizedException("Передан некорректный токен!");

		const user = await this.usersService.findUnique({ id: jwtUser.id });
		if (!user)
			throw new UnauthorizedException("Передан некорректный токен!");

		return user;
	}
}
