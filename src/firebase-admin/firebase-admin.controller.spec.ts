import { Test, TestingModule } from "@nestjs/testing";
import { FirebaseAdminController } from "./firebase-admin.controller";

describe("FirebaseAdminController", () => {
	let controller: FirebaseAdminController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FirebaseAdminController],
		}).compile();

		controller = module.get<FirebaseAdminController>(
			FirebaseAdminController,
		);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});
});
