import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	public static extractTokenFromRequest(req: Request): string {
		const [type, token] = req.headers.authorization?.split(" ") ?? [];

		if (type !== "Bearer" || !token || token.length === 0)
			throw new UnauthorizedException("Не указан токен!");

		return token;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = AuthGuard.extractTokenFromRequest(request);

		if (!token)
			try {
				if (
					!(await this.jwtService.verifyAsync(token)) ||
					!(await this.usersService.contains({ accessToken: token }))
				) {
					// noinspection ExceptionCaughtLocallyJS
					throw new Error();
				}
			} catch {
				throw new UnauthorizedException("Указан неверный токен!");
			}

		return true;
	}
}
