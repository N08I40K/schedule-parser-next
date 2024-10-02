import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../contants";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleModule } from "../schedule/schedule.module";

@Module({
	imports: [
		UsersModule,
		ScheduleModule,
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: "720h" },
		}),
	],
	providers: [AuthService, PrismaService],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
