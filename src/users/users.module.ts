import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersController } from "./users.controller";
import { AuthService } from "../auth/auth.service";
import { ScheduleModule } from "../schedule/schedule.module";

@Module({
	imports: [ScheduleModule],
	providers: [PrismaService, UsersService, AuthService],
	exports: [UsersService],
	controllers: [UsersController],
})
export class UsersModule {}
