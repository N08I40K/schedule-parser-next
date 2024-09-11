import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus, Post,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ScheduleService } from "./schedule.service";
import {
	GroupScheduleDto,
	GroupScheduleRequestDto,
	ScheduleDto,
	ScheduleGroupsDto,
} from "../dto/schedule.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiExtraModels,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	refs,
} from "@nestjs/swagger";

@Controller("api/v1/schedule")
@UseGuards(AuthGuard)
export class ScheduleController {
	constructor(private readonly scheduleService: ScheduleService) {}

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

	@ApiExtraModels(GroupScheduleDto)
	@ApiOperation({
		summary: "Получение расписания группы",
		tags: ["schedule"],
	})
	@ApiOkResponse({
		description: "Расписание получено успешно",
		schema: refs(GroupScheduleDto)[0],
	})
	@ApiNotFoundResponse({ description: "Требуемая группа не найдена" })
	@ResultDto(GroupScheduleDto)
	@HttpCode(HttpStatus.OK)
	@Post("getGroup")
	getGroupSchedule(
		@Body() groupDto: GroupScheduleRequestDto,
	): Promise<GroupScheduleDto> {
		return this.scheduleService.getGroup(groupDto.name);
	}

	@ApiExtraModels(ScheduleGroupsDto)
	@ApiOperation({
		summary: "Получение списка названий всех групп в расписании",
		tags: ["schedule"],
	})
	@ApiOkResponse({
		description: "Список получен успешно",
		schema: refs(ScheduleGroupsDto)[0],
	})
	@ApiNotFoundResponse({ description: "Требуемая группа не найдена" })
	@ResultDto(ScheduleGroupsDto)
	@HttpCode(HttpStatus.OK)
	@Get("getGroupNames")
	async getGroupNames(): Promise<ScheduleGroupsDto> {
		return this.scheduleService.getGroupNames();
	}
}
