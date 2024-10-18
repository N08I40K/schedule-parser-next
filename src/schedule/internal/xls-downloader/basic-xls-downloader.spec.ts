import { BasicXlsDownloader } from "./basic-xls-downloader";
import { XlsDownloaderInterface } from "./xls-downloader.interface";

describe("BasicXlsDownloader", () => {
	let downloader: XlsDownloaderInterface;

	beforeEach(async () => {
		downloader = new BasicXlsDownloader();
	});

	it("Должен вызвать ошибку из-за отсутствия ссылки на скачивание", async () => {
		await expect(async () => {
			const result = await downloader.fetch(false);
			downloader.verifyFetchResult(result);
		}).rejects.toThrow();
	});

	it("Должен вызвать ошибку из-за неверной ссылки на скачивание", async () => {
		await expect(() => {
			return downloader.setDownloadUrl("https://google.com/");
		}).rejects.toThrow();
	});

	it("Должен вернуть скачанный файл", async () => {
		await downloader.setDownloadUrl(
			"https://politehnikum-eng.ru/2024/poltavskaja_07_s_14_po_20_10-5-.xls",
		);

		expect(() => {
			downloader.fetch(false).then((result) => {
				downloader.verifyFetchResult(result);
			});
		}).toBeDefined();
	});
});
