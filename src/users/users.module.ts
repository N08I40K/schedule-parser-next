import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersController } from "./users.controller";
import { AuthService } from "../auth/auth.service";
import { ScheduleService } from "../schedule/schedule.service";

@Module({
	providers: [PrismaService, UsersService, AuthService, ScheduleService],
	exports: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}
