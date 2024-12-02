import { forwardRef, Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminModule } from "../firebase-admin/firebase-admin.module";
import { UsersModule } from "src/users/users.module";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { ScheduleReplacerController } from "./schedule-replacer.controller";
import { ScheduleService } from "./schedule.service";
import { V2ScheduleController } from "./v2-schedule.controller";
import { V3ScheduleController } from "./v3-schedule.controller";
import { V4ScheduleController } from "./v4-schedule.controller";

@Module({
	imports: [forwardRef(() => UsersModule), FirebaseAdminModule],
	providers: [PrismaService, ScheduleService, ScheduleReplacerService],
	controllers: [
		V2ScheduleController,
		V3ScheduleController,
		V4ScheduleController,
		ScheduleReplacerController,
	],
	exports: [ScheduleService],
})
export class ScheduleModule {}
