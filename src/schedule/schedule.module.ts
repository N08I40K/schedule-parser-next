import { Module } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
	imports: [],
	providers: [ScheduleService, UsersService, PrismaService],
	controllers: [ScheduleController],
	exports: [ScheduleService],
})
export class ScheduleModule {}
