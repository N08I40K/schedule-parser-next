import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";

// TODO: Найти применение этой функции
// noinspection JSUnusedGlobalSymbols
export const UserToken = createParamDecorator(
	(_, context: ExecutionContext) => {
		return AuthGuard.extractTokenFromRequest(
			context.switchToHttp().getRequest(),
		);
	},
);
