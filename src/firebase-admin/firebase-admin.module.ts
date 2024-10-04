import { forwardRef, Module } from "@nestjs/common";
import { FirebaseAdminService } from "./firebase-admin.service";
import { UsersModule } from "../users/users.module";
import { FirebaseAdminController } from "./firebase-admin.controller";

@Module({
	imports: [forwardRef(() => UsersModule)],
	providers: [FirebaseAdminService],
	exports: [FirebaseAdminService],
	controllers: [FirebaseAdminController],
})
export class FirebaseAdminModule {}
