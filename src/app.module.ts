import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ScheduleModule } from "./schedule/schedule.module";
import { CacheModule } from "@nestjs/cache-manager";
import { FirebaseAdminModule } from "./firebase-admin/firebase-admin.module";

@Module({
	imports: [
		AuthModule,
		UsersModule,
		ScheduleModule,
		CacheModule.register({ ttl: 5 * 60 * 1000, isGlobal: true }),
		FirebaseAdminModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
