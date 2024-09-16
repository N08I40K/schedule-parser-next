import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ScheduleService } from "./schedule.service";
import {
	GroupScheduleDto,
	GroupScheduleRequestDto,
	ScheduleDto,
	ScheduleGroupsDto,
	SiteMainPageDto,
} from "../dto/schedule.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiExtraModels,
	ApiNotAcceptableResponse,
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
	async getSchedule(): Promise<ScheduleDto> {
		return await this.scheduleService.getSchedule();
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
	@Post("get-group")
	async getGroupSchedule(
		@Body() groupDto: GroupScheduleRequestDto,
	): Promise<GroupScheduleDto> {
		return await this.scheduleService.getGroup(groupDto.name);
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
	@Get("get-group-names")
	async getGroupNames(): Promise<ScheduleGroupsDto> {
		return await this.scheduleService.getGroupNames();
	}

	@ApiExtraModels(SiteMainPageDto)
	@ApiOperation({
		summary: "Обновление данных основной страницы политехникума",
		tags: ["schedule"],
	})
	@ApiOkResponse({ description: "Данные обновлены успешно" })
	@ApiNotAcceptableResponse({
		description: "Передан некорректный код страницы",
	})
	@ResultDto(null)
	@HttpCode(HttpStatus.OK)
	@Post("update-site-main-page")
	async updateSiteMainPage(
		@Body() siteMainPageDto: SiteMainPageDto,
	): Promise<void> {
		return await this.scheduleService.updateSiteMainPage(siteMainPageDto);
	}
}
