import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ClientVersion = createParamDecorator(
	(_, context: ExecutionContext) => {
		const sourceVersion: string | null = context.switchToHttp().getRequest()
			.headers.version;
		const parsedVersion = Number.parseInt(sourceVersion);

		if (Number.isNaN(parsedVersion) || parsedVersion < 0) return 0;

		return parsedVersion;
	},
);
