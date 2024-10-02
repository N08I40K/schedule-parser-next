import { Module } from "@nestjs/common";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleReplacerController } from "./schedule-replacer.controller";
import { ScheduleModule } from "../schedule/schedule.module";
import { AuthService } from "../auth/auth.service";
import { UsersModule } from "../users/users.module";

@Module({
	imports: [ScheduleModule, UsersModule],
	providers: [AuthService, PrismaService, ScheduleReplacerService],
	exports: [ScheduleReplacerService],
	controllers: [ScheduleReplacerController],
})
export class ScheduleReplacerModule {}
