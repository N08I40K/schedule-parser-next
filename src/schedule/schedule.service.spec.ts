import { Test, TestingModule } from "@nestjs/testing";
import { ScheduleService } from "./schedule.service";
import * as fs from "node:fs";
import { CacheModule } from "@nestjs/cache-manager";
import { FirebaseAdminService } from "../firebase-admin/firebase-admin.service";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleReplacerService } from "./schedule-replacer.service";

describe("ScheduleService", () => {
	let service: ScheduleService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [CacheModule.register()],
			providers: [
				ScheduleService,
				CacheModule,
				FirebaseAdminService,
				UsersService,
				PrismaService,
				ScheduleReplacerService,
			],
		}).compile();

		service = module.get<ScheduleService>(ScheduleService);
	});

	describe("get group schedule", () => {
		it("should return group schedule", async () => {
			const mainPage = fs.readFileSync("./test/mainPage").toString();
			await service.updateSiteMainPage({ mainPage: mainPage });

			const groupName = "ИС-214/23";

			const schedule = await service.getGroup(groupName);
			expect(schedule.group.name).toBe(groupName);

			console.log(schedule.group.days[2].lessons[0].teacherNames);
			expect(schedule.group.days[2].lessons[0].teacherNames.length).toBe(
				2,
			);
		});
	});
});
