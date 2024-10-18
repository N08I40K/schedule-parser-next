import { IsMongoId, IsObject, IsString } from "class-validator";

export class SetScheduleReplacerDto {
	/**
	 * Идентификатор заменителя (ObjectId)
	 * @example "66e6f1c8775ffeda400d7967"
	 */
	@IsMongoId()
	id: string;

	/**
	 * ETag заменяемого расписания
	 * @example "\"670be780-21e00\""
	 */
	@IsString()
	etag: string;

	/**
	 * Данные файла расписания
	 */
	@IsObject()
	data: ArrayBuffer;
}
