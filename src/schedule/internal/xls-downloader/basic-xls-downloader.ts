import {
	FetchError,
	FetchResult,
	XlsDownloaderInterface,
} from "./xls-downloader.interface";
import axios from "axios";
import {
	NotAcceptableException,
	ServiceUnavailableException,
} from "@nestjs/common";

export class BasicXlsDownloader implements XlsDownloaderInterface {
	private url: string | null = null;

	public async fetch(head: boolean): Promise<FetchResult> {
		if (this.url === null) {
			throw new ServiceUnavailableException(
				"Отсутствует начальная ссылка на скачивание!",
			);
		}

		return BasicXlsDownloader.fetchSpecified(this.url, head);
	}

	/**
	 * Проверяет указанную ссылку на работоспособность
	 * @param {string} url - ссылка на скачивание
	 * @param {boolean} head - не скачивать файл
	 * @returns {FetchFailedResult} - если запрос не удался или он не соответствует ожиданиям
	 * @returns {FetchSuccessResult} - если запрос удался
	 * @static
	 * @async
	 */
	static async fetchSpecified(
		url: string,
		head: boolean,
	): Promise<FetchResult> {
		const response = await (head
			? axios.head(url)
			: axios.get(url, { responseType: "arraybuffer" }));

		if (response.status !== 200) {
			console.error(`${response.status} ${response.statusText}`);

			return {
				type: "fail",
				error: FetchError.BAD_STATUS_CODE,
				statusCode: response.status,
				statusText: response.statusText,
			};
		}

		type HeaderValue = string | undefined;

		const contentType: HeaderValue = response.headers["content-type"];
		const etag: HeaderValue = response.headers["etag"];
		const uploadedAt: HeaderValue = response.headers["last-modified"];
		const requestedAt: HeaderValue = response.headers["date"];

		if (!contentType || !etag || !uploadedAt || !requestedAt) {
			return {
				type: "fail",
				error: FetchError.BAD_HEADERS,
			};
		}

		if (contentType !== "application/vnd.ms-excel") {
			return {
				type: "fail",
				error: FetchError.INCORRECT_FILE_TYPE,
				contentType: contentType,
			};
		}

		return {
			type: "success",
			etag: etag,
			uploadedAt: new Date(uploadedAt),
			requestedAt: new Date(requestedAt),
			data: head ? undefined : response.data.buffer,
		};
	}

	/**
	 * Проверяет FetchResult на ошибки
	 * @param {FetchResult} fetchResult - результат
	 * @throws {NotAcceptableException} - некорректный статус-код
	 * @throws {NotAcceptableException} - некорректный тип файла
	 * @throws {NotAcceptableException} - отсутствуют требуемые заголовки
	 * @static
	 */
	public verifyFetchResult(fetchResult: FetchResult): void {
		if (fetchResult.type === "fail") {
			switch (fetchResult.error) {
				case FetchError.BAD_STATUS_CODE:
					console.error(
						`${fetchResult.statusCode}: ${fetchResult.statusText}`,
					);
					throw new NotAcceptableException(
						`Не удалось получить информацию о файле, так как сервер вернул статус-код ${fetchResult.statusCode}!`,
					);
				case FetchError.INCORRECT_FILE_TYPE:
					throw new NotAcceptableException(
						`Тип файла ${fetchResult.contentType} на который указывает ссылка не равен application/vnd.ms-excel!`,
					);
				case FetchError.BAD_HEADERS:
					throw new NotAcceptableException(
						`Не удалось получить информацию о файле, так как сервер не вернул ожидаемые заголовки!`,
					);
			}
		}
	}

	public async setDownloadUrl(url: string): Promise<void> {
		const result = await BasicXlsDownloader.fetchSpecified(url, true);
		this.verifyFetchResult(result);

		this.url = url;
	}
}
