import {
	XlsDownloaderBase,
	XlsDownloaderCacheMode,
	XlsDownloaderResult,
} from "./xls-downloader.base";
import axios from "axios";
import { JSDOM } from "jsdom";
import {
	NotAcceptableException,
	ServiceUnavailableException,
} from "@nestjs/common";

export class BasicXlsDownloader extends XlsDownloaderBase {
	cache: XlsDownloaderResult | null = null;
	preparedData: { downloadLink: string; updateDate: string } | null = null;
	private lastUpdate: number = 0;

	private async getDOM(preparedData: any): Promise<JSDOM | null> {
		try {
			return new JSDOM(atob(preparedData), {
				url: this.url,
				contentType: "text/html",
			});
		} catch {
			throw new NotAcceptableException(
				"Передан некорректный код страницы",
			);
		}
	}

	private parseData(dom: JSDOM): {
		downloadLink: string;
		updateDate: string;
	} {
		try {
			const scheduleBlock = dom.window.document.getElementById("cont-i");
			if (scheduleBlock === null)
				// noinspection ExceptionCaughtLocallyJS
				throw new Error("Не удалось найти блок расписаний!");

			const schedules = scheduleBlock.getElementsByTagName("div");
			if (schedules === null || schedules.length === 0)
				// noinspection ExceptionCaughtLocallyJS
				throw new Error("Не удалось найти строку с расписанием!");

			const poltavskaya = schedules[0];
			const link = poltavskaya.getElementsByTagName("a")[0]!;

			const spans = poltavskaya.getElementsByTagName("span");
			const updateDate = spans[3].textContent!.trimStart();

			return {
				downloadLink: link.href,
				updateDate: updateDate,
			};
		} catch (exception) {
			console.error(exception);
			throw new NotAcceptableException(
				"Передан некорректный код страницы",
			);
		}
	}

	public async getCachedXLS(): Promise<XlsDownloaderResult | null> {
		if (this.cache === null) return null;

		this.cache.new = this.cacheMode === XlsDownloaderCacheMode.HARD;

		return this.cache;
	}

	public isUpdateRequired(): boolean {
		return (Date.now() - this.lastUpdate) / 1000 / 60 > 5;
	}

	public async setPreparedData(preparedData: string): Promise<void> {
		const dom = await this.getDOM(preparedData);
		this.preparedData = this.parseData(dom);

		this.lastUpdate = Date.now();
	}

	public async downloadXLS(): Promise<XlsDownloaderResult> {
		if (
			this.cacheMode === XlsDownloaderCacheMode.HARD &&
			this.cache !== null
		)
			return this.getCachedXLS();

		if (!this.preparedData) {
			throw new ServiceUnavailableException(
				"Отсутствует начальная ссылка на скачивание!",
			);
		}

		// noinspection Annotator
		const response = await axios.get(this.preparedData.downloadLink, {
			responseType: "arraybuffer",
		});
		if (response.status !== 200) {
			throw new Error(`Не удалось получить excel файл!
Статус код: ${response.status}
${response.statusText}`);
		}

		const result: XlsDownloaderResult = {
			fileData: response.data.buffer,
			updateDate: this.preparedData.updateDate,
			etag: response.headers["etag"],
			new:
				this.cacheMode === XlsDownloaderCacheMode.NONE
					? true
					: this.cache?.etag !== response.headers["etag"],
			updateRequired: this.isUpdateRequired(),
		};

		if (this.cacheMode !== XlsDownloaderCacheMode.NONE) this.cache = result;

		return result;
	}
}
