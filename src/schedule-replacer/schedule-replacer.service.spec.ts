import { Test, TestingModule } from "@nestjs/testing";
import { ScheduleReplacerService } from "./schedule-replacer.service";

describe("ScheduleReplacerService", () => {
	let service: ScheduleReplacerService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ScheduleReplacerService],
		}).compile();

		service = module.get<ScheduleReplacerService>(ScheduleReplacerService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});
});
