import { forwardRef, Module } from "@nestjs/common";
import { V1ScheduleService } from "./v1-schedule.service";
import { V1ScheduleController } from "./v1-schedule.controller";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminModule } from "../firebase-admin/firebase-admin.module";
import { UsersModule } from "src/users/users.module";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { ScheduleReplacerController } from "./schedule-replacer.controller";
import { V2ScheduleService } from "./v2-schedule.service";
import { V2ScheduleController } from "./v2-schedule.controller";

@Module({
	imports: [forwardRef(() => UsersModule), FirebaseAdminModule],
	providers: [
		PrismaService,
		V1ScheduleService,
		V2ScheduleService,
		ScheduleReplacerService,
	],
	controllers: [
		V1ScheduleController,
		V2ScheduleController,
		ScheduleReplacerController,
	],
	exports: [V1ScheduleService, V2ScheduleService],
})
export class ScheduleModule {}
