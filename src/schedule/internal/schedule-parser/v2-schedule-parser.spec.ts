import { V2ScheduleParser, V2ScheduleParseResult } from "./v2-schedule-parser";
import { BasicXlsDownloader } from "../xls-downloader/basic-xls-downloader";
import { DayDto } from "../../dto/day.dto";
import { GroupDto } from "../../dto/group.dto";
import { V2LessonType } from "../../enum/v2-lesson-type.enum";
import instanceToInstance2 from "../../../utility/class-trasformer/instance-to-instance-2";

describe("V2ScheduleParser", () => {
	let parser: V2ScheduleParser;

	beforeEach(async () => {
		const xlsDownloader = new BasicXlsDownloader();
		parser = new V2ScheduleParser(xlsDownloader);
	});

	describe("Ошибки", () => {
		it("Должен вернуть ошибку из-за отсутствия ссылки на скачивание", async () => {
			await expect(() => parser.getSchedule()).rejects.toThrow();
		});
	});

	async function setLink(link: string): Promise<void> {
		await parser.getXlsDownloader().setDownloadUrl(link);
	}

	const defaultTest = async () => {
		const schedule = await parser.getSchedule();

		expect(schedule).toBeDefined();
	};

	const nameTest = async () => {
		const schedule = await parser.getSchedule();
		expect(schedule).toBeDefined();

		const group: GroupDto | undefined = schedule.groups.get("ИС-214/23");
		expect(group).toBeDefined();

		const monday: DayDto = group.days[0];
		expect(monday).toBeDefined();

		const name = monday.name;
		expect(name).toBeDefined();
		expect(name.length).toBeGreaterThan(0);
	};
	//
	// function mapReplacer(key: any, value: any) {
	// 	if (value instanceof Map) {
	// 		return Array.from(value.entries());
	// 	} else {
	// 		return value;
	// 	}
	// }

	describe("Расписание", () => {
		beforeEach(async () => {
			await setLink(
				"https://politehnikum-eng.ru/2024/poltavskaja_12_s_18_po_24_11.xls",
			);
		});

		it("Должен вернуть расписание", defaultTest);
		it("Название дня не должно быть пустым или null", nameTest);

		it("Зачёт с оценкой v1", async () => {
			const schedule = await parser.getSchedule().then((v) =>
				instanceToInstance2(V2ScheduleParseResult, v, {
					groups: ["v1"],
				}),
			);
			expect(schedule).toBeDefined();

			const group: GroupDto | undefined =
				schedule.groups.get("ИС-214/23");
			expect(group).toBeDefined();

			const tuesday = group.days[1];
			expect(tuesday).toBeDefined();

			const oseLesson = tuesday.lessons[6];
			expect(oseLesson).toBeDefined();

			expect(oseLesson.name.startsWith("ЗАЧЕТ С ОЦЕНКОЙ | ")).toBe(true);
			expect(oseLesson.type).toBe(V2LessonType.DEFAULT);
		});

		it("Зачёт с оценкой v2", async () => {
			const schedule = await parser.getSchedule().then((v) =>
				instanceToInstance2(V2ScheduleParseResult, v, {
					groups: ["v2"],
				}),
			);
			expect(schedule).toBeDefined();

			const group: GroupDto | undefined =
				schedule.groups.get("ИС-214/23");
			expect(group).toBeDefined();

			const tuesday = group.days[1];
			expect(tuesday).toBeDefined();

			const oseLesson = tuesday.lessons[6];
			expect(oseLesson).toBeDefined();

			expect(oseLesson.name.startsWith("Операционные")).toBe(true);
			expect(oseLesson.type).toBe(V2LessonType.EXAM_WITH_GRADE);
		});

		// it("Суббота не должна отсутствовать", async () => {
		// 	const schedule = await parser.getSchedule();
		// 	expect(schedule).toBeDefined();
		//
		// 	const group: V2GroupDto | undefined = schedule.groups["ИС-214/23"];
		// 	expect(group).toBeDefined();
		//
		// 	expect(group.days.length).toBe(6);
		// });
	});
});
