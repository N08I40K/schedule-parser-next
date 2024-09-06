import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../contants";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
	imports: [
		UsersModule,
		JwtModule.register({
			global: true,
			secret: jwtConstants.secret,
			signOptions: { expiresIn: "720h" },
		}),
	],
	providers: [AuthService, UsersService, PrismaService],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
