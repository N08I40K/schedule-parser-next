import {
	XlsDownloaderBase,
	XlsDownloaderCacheMode,
	XlsDownloaderResult,
} from "./xls-downloader.base";
import axios from "axios";
import { JSDOM } from "jsdom";

export class BasicXlsDownloader extends XlsDownloaderBase {
	cache: XlsDownloaderResult | null = null;

	private async getDOM(): Promise<JSDOM> {
		const response = await axios.get(this.url);

		if (response.status !== 200) {
			throw new Error(`Не удалось получить данные с основной страницы!
Статус код: ${response.status}
${response.statusText}`);
		}

		return new JSDOM(response.data, {
			url: this.url,
			contentType: "text/html",
		});
	}

	private parseData(dom: JSDOM): {
		downloadLink: string;
		updateDate: string;
	} {
		const scheduleBlock = dom.window.document.getElementById("cont-i");
		if (scheduleBlock === null)
			throw new Error("Не удалось найти блок расписаний!");

		const schedules = scheduleBlock.getElementsByTagName("div");
		if (schedules === null || schedules.length === 0)
			throw new Error("Не удалось найти строку с расписанием!");

		const poltavskaya = schedules[0];
		const link = poltavskaya.getElementsByTagName("a")[0]!;

		const spans = poltavskaya.getElementsByTagName("span");
		const updateDate = spans[3].textContent!.trimStart();

		return {
			downloadLink: link.href,
			updateDate: updateDate,
		};
	}

	public async getCachedXLS(): Promise<XlsDownloaderResult | null> {
		if (this.cache === null) return null;

		this.cache.new = this.cacheMode === XlsDownloaderCacheMode.HARD;

		return this.cache;
	}

	public async downloadXLS(): Promise<XlsDownloaderResult> {
		if (
			this.cacheMode === XlsDownloaderCacheMode.HARD &&
			this.cache !== null
		)
			return this.getCachedXLS();

		const dom = await this.getDOM();
		const parseData = this.parseData(dom);

		// FIX-ME: Что такое Annotator и почему он выдаёт пустое предупреждение?
		// noinspection Annotator
		const response = await axios.get(parseData.downloadLink, {
			responseType: "arraybuffer",
		});
		if (response.status !== 200) {
			throw new Error(`Не удалось получить excel файл!
Статус код: ${response.status}
${response.statusText}`);
		}

		const result: XlsDownloaderResult = {
			fileData: response.data.buffer,
			updateDate: parseData.updateDate,
			etag: response.headers["etag"],
			new:
				this.cacheMode === XlsDownloaderCacheMode.NONE
					? true
					: this.cache?.etag !== response.headers["etag"],
		};

		if (this.cacheMode !== XlsDownloaderCacheMode.NONE) this.cache = result;

		return result;
	}
}
