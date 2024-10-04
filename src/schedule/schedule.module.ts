import { forwardRef, Module } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { ScheduleController } from "./schedule.controller";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminModule } from "../firebase-admin/firebase-admin.module";
import { UsersModule } from "src/users/users.module";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { ScheduleReplacerController } from "./schedule-replacer.controller";

@Module({
	imports: [forwardRef(() => UsersModule), FirebaseAdminModule],
	providers: [PrismaService, ScheduleService, ScheduleReplacerService],
	controllers: [ScheduleController, ScheduleReplacerController],
	exports: [ScheduleService],
})
export class ScheduleModule {}
