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
	CacheStatusDto,
	CacheStatusV0Dto,
	CacheStatusV1Dto,
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
import { ClientVersion } from "../version/client-version.decorator";

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
	@ApiExtraModels(CacheStatusV0Dto)
	@ApiExtraModels(CacheStatusV1Dto)
	@ApiOperation({
		summary: "Обновление данных основной страницы политехникума",
		tags: ["schedule"],
	})
	@ApiOkResponse({
		description: "Данные обновлены успешно",
		schema: refs(CacheStatusV0Dto)[0],
	})
	@ApiOkResponse({
		description: "Данные обновлены успешно",
		schema: refs(CacheStatusV0Dto)[1],
	})
	@ApiNotAcceptableResponse({
		description: "Передан некорректный код страницы",
	})
	@ResultDto([CacheStatusV0Dto, CacheStatusV1Dto])
	@HttpCode(HttpStatus.OK)
	@Post("update-site-main-page")
	async updateSiteMainPage(
		@Body() siteMainPageDto: SiteMainPageDto,
		@ClientVersion() version: number,
	): Promise<CacheStatusV0Dto> {
		return CacheStatusDto.stripVersion(
			await this.scheduleService.updateSiteMainPage(siteMainPageDto),
			version,
		);
	}

	@ApiExtraModels(CacheStatusV0Dto)
	@ApiExtraModels(CacheStatusV1Dto)
	@ApiOperation({
		summary: "Получение информации о кеше",
		tags: ["schedule", "cache"],
	})
	@ApiOkResponse({
		description: "Получение данных прошло успешно",
		schema: refs(CacheStatusV0Dto)[0],
	})
	@ApiOkResponse({
		description: "Получение данных прошло успешно",
		schema: refs(CacheStatusV1Dto)[0],
	})
	@ResultDto([CacheStatusV0Dto, CacheStatusV1Dto])
	@HttpCode(HttpStatus.OK)
	@Get("cache-status")
	getCacheStatus(
		@ClientVersion() version: number,
	): CacheStatusV0Dto | CacheStatusV1Dto {
		return CacheStatusDto.stripVersion(
			this.scheduleService.getCacheStatus(),
			version,
		);
	}
}
