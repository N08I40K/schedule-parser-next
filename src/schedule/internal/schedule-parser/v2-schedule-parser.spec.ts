import { V2ScheduleParser } from "./v2-schedule-parser";
import { BasicXlsDownloader } from "../xls-downloader/basic-xls-downloader";
import { V2DayDto } from "../../dto/v2/v2-day.dto";
import { V2GroupDto } from "../../dto/v2/v2-group.dto";

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

		const group: V2GroupDto | undefined = schedule.groups["ИС-214/23"];
		expect(group).toBeDefined();

		const saturday: V2DayDto = group.days[5];
		expect(saturday).toBeDefined();

		const name = saturday.name;
		expect(name).toBeDefined();
		expect(name.length).toBeGreaterThan(0);
	};

	describe("Расписание", () => {
		beforeEach(async () => {
			await setLink(
				"https://politehnikum-eng.ru/2024/poltavskaja_11_s_11_11_po_17_11-5-.xls",
			);
		});

		it("Должен вернуть расписание", defaultTest);
		it("Название дня не должно быть пустым или null", nameTest);

		it("Парсер должен вернуть корректное время если она на нескольких линиях", async () => {
			const schedule = await parser.getSchedule();
			expect(schedule).toBeDefined();

			const group: V2GroupDto | undefined = schedule.groups["ИС-214/23"];
			expect(group).toBeDefined();

			const saturday: V2DayDto = group.days[5];
			expect(saturday).toBeDefined();

			const firstLesson = saturday.lessons[0];
			expect(firstLesson).toBeDefined();

			expect(firstLesson.time).toBeDefined();

			expect(firstLesson.time.start).toBeDefined();
			expect(firstLesson.time.end).toBeDefined();

			const startMinutes =
				firstLesson.time.start.getHours() * 60 +
				firstLesson.time.start.getMinutes();
			const endMinutes =
				firstLesson.time.end.getHours() * 60 +
				firstLesson.time.end.getMinutes();

			const differenceMinutes = endMinutes - startMinutes;

			expect(differenceMinutes).toBe(190);

			expect(firstLesson.defaultRange).toStrictEqual([1, 3]);
		});

		it("Ошибка парсинга?", async () => {
			const schedule = await parser.getSchedule();
			expect(schedule).toBeDefined();

			const group: V2GroupDto | undefined = schedule.groups["ИС-214/23"];
			expect(group).toBeDefined();

			const thursday: V2DayDto = group.days[3];
			expect(thursday).toBeDefined();

			expect(thursday.lessons.length).toBe(5);

			const lastLessonName = thursday.lessons[4].name;
			expect(lastLessonName).toBe(
				"МДК.05.01 Проектирование и дизайн информационных систем",
			);
		});

		it("Суббота не должна отсутствовать", async () => {
			const schedule = await parser.getSchedule();
			expect(schedule).toBeDefined();

			const group: V2GroupDto | undefined = schedule.groups["ИС-214/23"];
			expect(group).toBeDefined();

			expect(group.days.length).toBe(6);
		});
	});
});
