import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { UsersService } from "../users/users.service";
import { Reflector } from "@nestjs/core";
import { AuthRoles } from "../auth-role/auth-role.decorator";
import { isJWT } from "class-validator";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
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

		let jwtUser: { id: string } | null = null;

		if (
			!isJWT(token) ||
			!(jwtUser = await this.jwtService
				.verifyAsync(token)
				.catch(() => null))
		)
			throw new UnauthorizedException();

		const user = await this.usersService.findUnique({ id: jwtUser.id });
		if (!user || user.accessToken !== token)
			throw new UnauthorizedException();

		const acceptableRoles = this.reflector.get(
			AuthRoles,
			context.getHandler(),
		);

		if (acceptableRoles != null && !acceptableRoles.includes(user.role))
			throw new ForbiddenException();

		return true;
	}
}
