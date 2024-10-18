import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../contants";
import { AuthService } from "./auth.service";
import { V1AuthController } from "./v1-auth.controller";
import { UsersModule } from "../users/users.module";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleModule } from "../schedule/schedule.module";
import { V2AuthController } from "./v2-auth.controller";

@Module({
	imports: [
		forwardRef(() => UsersModule),
		forwardRef(() => ScheduleModule),
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: "720h" },
		}),
	],
	providers: [AuthService, PrismaService],
	controllers: [V1AuthController, V2AuthController],
	exports: [AuthService],
})
export class AuthModule {}
