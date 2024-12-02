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
				"https://politehnikum-eng.ru/2024/poltavskaja_14_s_2_po_8_12.xls",
			);
		});

		it("Должен вернуть расписание", defaultTest);
		it("Название дня не должно быть пустым или null", nameTest);

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

			const day = group.days[5];
			expect(day).toBeDefined();

			const lesson = day.lessons[0];
			expect(lesson).toBeDefined();

			expect(lesson.type).toBe(V2LessonType.EXAM);
		});
	});
});
