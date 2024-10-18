export enum FetchError {
	BAD_STATUS_CODE,
	INCORRECT_FILE_TYPE,
	BAD_HEADERS,
}

export type FetchFailedResult = {
	type: "fail";

	/**
	 * Тип ошибки, если присутствует
	 */
	error: FetchError;

	/**
	 * Тип файла, если error === FetchError.INCORRECT_FILE_TYPE
	 */
	contentType?: string;

	/**
	 * Код ошибки, если error === FetchError.BAD_STATUS_CODE
	 */
	statusCode?: number;

	/**
	 * Текст ошибки, если error === FetchError.BAD_STATUS_CODE
	 */
	statusText?: string;
};

export type FetchSuccessResult = {
	type: "success";

	/**
	 * ETag xls файла
	 */
	etag: string;

	/**
	 * Дата, когда файл был загружен на сервер
	 */
	uploadedAt: Date;

	/**
	 * Дата, когда файл был совершён запрос
	 */
	requestedAt: Date;

	/**
	 * Данные файла
	 */
	data?: ArrayBuffer;
};

export type FetchResult = FetchFailedResult | FetchSuccessResult;

export interface XlsDownloaderInterface {
	/**
	 * Получает информацию о xls файле
	 * @param {boolean} head - только заголовки
	 * @returns {FetchFailedResult} - запрос не удался или не соответствует ожиданиям
	 * @returns {FetchSuccessResult} - запрос удался
	 * @async
	 */
	fetch(head: boolean): Promise<FetchResult>;

	setDownloadUrl(url: string): Promise<void>;

	/**
	 * Проверяет FetchResult на ошибки
	 * @param {FetchResult} fetchResult - результат
	 */
	verifyFetchResult(fetchResult: FetchResult): void;
}
