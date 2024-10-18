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
import { V1ScheduleService } from "./v1-schedule.service";
import { V1ScheduleDto } from "./dto/v1/v1-schedule.dto";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiBearerAuth,
	ApiExtraModels,
	ApiNotAcceptableResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	refs,
} from "@nestjs/swagger";
import { ResponseVersion } from "../version/response-version.decorator";
import { AuthRoles, AuthUnauthorized } from "../auth/auth-role.decorator";
import { UserToken } from "../auth/auth.decorator";
import { UserPipe } from "../auth/auth.pipe";
import { UserRole } from "../users/user-role.enum";
import { User } from "../users/entity/user.entity";
import { V1CacheStatusDto } from "./dto/v1/v1-cache-status.dto";
import { V2CacheStatusDto } from "./dto/v2/v2-cache-status.dto";
import { CacheStatusDto } from "./dto/v1/cache-status.dto";
import { V1GroupScheduleNameDto } from "./dto/v1/v1-group-schedule-name.dto";
import { V1ScheduleGroupNamesDto } from "./dto/v1/v1-schedule-group-names.dto";
import { V1GroupScheduleDto } from "./dto/v1/v1-group-schedule.dto";
import { V1SiteMainPageDto } from "./dto/v1/v1-site-main-page.dto";

@ApiTags("v1/schedule")
@ApiBearerAuth()
@Controller({ path: "schedule", version: "1" })
@UseGuards(AuthGuard)
export class V1ScheduleController {
	constructor(private readonly scheduleService: V1ScheduleService) {}

	@ApiExtraModels(V1ScheduleDto)
	@ApiOperation({
		summary: "Получение расписания",
		tags: ["admin"],
	})
	@ApiOkResponse({
		description: "Расписание получено успешно",
		schema: refs(V1ScheduleDto)[0],
	})
	@ResultDto(V1ScheduleDto)
	@AuthRoles([UserRole.ADMIN])
	@HttpCode(HttpStatus.OK)
	@Get("get")
	async getSchedule(): Promise<V1ScheduleDto> {
		return await this.scheduleService.getSchedule();
	}

	@ApiExtraModels(V1GroupScheduleDto)
	@ApiOperation({ summary: "Получение расписания группы" })
	@ApiOkResponse({
		description: "Расписание получено успешно",
		schema: refs(V1GroupScheduleDto)[0],
	})
	@ApiNotFoundResponse({ description: "Требуемая группа не найдена" })
	@ResultDto(V1GroupScheduleDto)
	@HttpCode(HttpStatus.OK)
	@Post("get-group")
	async getGroupSchedule(
		@Body() groupDto: V1GroupScheduleNameDto,
		@UserToken(UserPipe) user: User,
	): Promise<V1GroupScheduleDto> {
		return await this.scheduleService.getGroup(groupDto.name ?? user.group);
	}

	@ApiExtraModels(V1ScheduleGroupNamesDto)
	@ApiOperation({
		summary: "Получение списка названий всех групп в расписании",
	})
	@ApiOkResponse({
		description: "Список получен успешно",
		schema: refs(V1ScheduleGroupNamesDto)[0],
	})
	@ApiNotFoundResponse({ description: "Требуемая группа не найдена" })
	@ResultDto(V1ScheduleGroupNamesDto)
	@AuthUnauthorized()
	@HttpCode(HttpStatus.OK)
	@Get("get-group-names")
	async getGroupNames(): Promise<V1ScheduleGroupNamesDto> {
		return await this.scheduleService.getGroupNames();
	}

	@ApiExtraModels(V1SiteMainPageDto)
	@ApiExtraModels(V1CacheStatusDto)
	@ApiExtraModels(V2CacheStatusDto)
	@ApiOperation({
		summary: "Обновление данных основной страницы политехникума",
	})
	@ApiOkResponse({
		description: "Данные обновлены успешно",
		schema: refs(V1CacheStatusDto)[0],
	})
	@ApiOkResponse({
		description: "Данные обновлены успешно",
		schema: refs(V1CacheStatusDto)[1],
	})
	@ApiNotAcceptableResponse({
		description: "Передан некорректный код страницы",
	})
	@ResultDto([V1CacheStatusDto, V2CacheStatusDto])
	@HttpCode(HttpStatus.OK)
	@Post("update-site-main-page")
	async updateSiteMainPage(
		@Body() siteMainPageDto: V1SiteMainPageDto,
		@ResponseVersion() version: number,
	): Promise<V1CacheStatusDto> {
		return CacheStatusDto.stripVersion(
			await this.scheduleService.updateSiteMainPage(siteMainPageDto),
			version,
		);
	}

	@ApiExtraModels(V1CacheStatusDto)
	@ApiExtraModels(V2CacheStatusDto)
	@ApiOperation({
		summary: "Получение информации о кеше",
		tags: ["cache"],
	})
	@ApiOkResponse({
		description: "Получение данных прошло успешно",
		schema: refs(V1CacheStatusDto)[0],
	})
	@ApiOkResponse({
		description: "Получение данных прошло успешно",
		schema: refs(V2CacheStatusDto)[0],
	})
	@ResultDto([V1CacheStatusDto, V2CacheStatusDto])
	@HttpCode(HttpStatus.OK)
	@Get("cache-status")
	getCacheStatus(
		@ResponseVersion() version: number,
	): V1CacheStatusDto | V2CacheStatusDto {
		return CacheStatusDto.stripVersion(
			this.scheduleService.getCacheStatus(),
			version,
		);
	}
}
