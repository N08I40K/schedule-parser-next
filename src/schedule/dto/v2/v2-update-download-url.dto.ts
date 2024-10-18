import { IsUrl } from "class-validator";

export class V2UpdateDownloadUrlDto {
	/**
	 * Прямая ссылка на скачивание расписания
	 * @example "https://politehnikum-eng.ru/2024/poltavskaja_07_s_14_po_20_10-5-.xls"
	 */
	@IsUrl()
	url: string;
}
