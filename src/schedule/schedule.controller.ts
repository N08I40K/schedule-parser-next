import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ScheduleService } from "./schedule.service";
import { ScheduleDto } from "../dto/schedule.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiOperation,
	refs,
} from "@nestjs/swagger";

@Controller("api/v1/schedule")
@UseGuards(AuthGuard)
export class ScheduleController {
	constructor(private scheduleService: ScheduleService) {}

	@ApiExtraModels(ScheduleDto)
	@ApiOperation({ summary: "Получение расписания", tags: ["schedule"] })
	@ApiOkResponse({
		description: "Расписание получено успешно",
		schema: refs(ScheduleDto)[0],
	})
	@ResultDto(ScheduleDto)
	@HttpCode(HttpStatus.OK)
	@Get("get")
	getSchedule(): Promise<ScheduleDto> {
		return this.scheduleService.getSchedule();
	}
}
