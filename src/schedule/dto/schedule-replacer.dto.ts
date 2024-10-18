import { PickType } from "@nestjs/swagger";
import { IsNumber } from "class-validator";
import { SetScheduleReplacerDto } from "./set-schedule-replacer.dto";

export class ScheduleReplacerDto extends PickType(SetScheduleReplacerDto, [
	"etag",
]) {
	/**
	 * Размер файла в байтах
	 * @example 12567
	 */
	@IsNumber()
	size: number;
}
