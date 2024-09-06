import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ScheduleModule } from "./schedule/schedule.module";

@Module({
	imports: [AuthModule, UsersModule, ScheduleModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
