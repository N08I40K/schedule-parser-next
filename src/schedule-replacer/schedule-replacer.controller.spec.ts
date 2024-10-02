import { Test, TestingModule } from "@nestjs/testing";
import { ScheduleReplacerController } from "./schedule-replacer.controller";

describe("ScheduleReplacerController", () => {
	let controller: ScheduleReplacerController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ScheduleReplacerController],
		}).compile();

		controller = module.get<ScheduleReplacerController>(
			ScheduleReplacerController,
		);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
