import { forwardRef, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { V2UsersController } from "./v2-users.controller";
import { ScheduleModule } from "../schedule/schedule.module";
import { AuthModule } from "../auth/auth.module";
import { V1UsersController } from "./v1-users.controller";

@Module({
	imports: [forwardRef(() => ScheduleModule), forwardRef(() => AuthModule)],
	providers: [PrismaService, UsersService],
	exports: [UsersService],
	controllers: [V1UsersController, V2UsersController],
})
export class UsersModule {}
