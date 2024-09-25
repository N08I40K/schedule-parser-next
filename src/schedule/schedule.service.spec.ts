import { Test, TestingModule } from "@nestjs/testing";
import { ScheduleService } from "./schedule.service";
import * as fs from "node:fs";
import { CacheModule } from "@nestjs/cache-manager";

describe("ScheduleService", () => {
	let service: ScheduleService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [CacheModule.register()],
			providers: [ScheduleService, CacheModule],
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

			console.log(schedule.group.days);
			expect(schedule.group.days[2].nonNullIndices.length).toBe(3);
			expect(schedule.group.days[2].defaultIndices.length).toBe(3);

			expect(schedule.group.days[3]).toBeNull();
		});
	});
});
