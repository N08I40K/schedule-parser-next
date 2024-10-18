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

	describe("Старое расписание", () => {
		beforeEach(async () => {
			await setLink(
				"https://politehnikum-eng.ru/2024/poltavskaja_06_s_07_po_13_10.xls",
			);
		});

		it("Должен вернуть расписание", defaultTest);
		it("Название дня не должно быть пустым или null", nameTest);
	});

	describe("Новое расписание", () => {
		beforeEach(async () => {
			await setLink(
				"https://politehnikum-eng.ru/2024/poltavskaja_07_s_14_po_20_10-8-1-.xls",
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
	});
});
