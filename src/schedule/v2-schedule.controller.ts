import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { AuthRoles } from "../auth/auth-role.decorator";
import { UserToken } from "../auth/auth.decorator";
import { UserPipe } from "../auth/auth.pipe";
import { V2ScheduleService } from "./v2-schedule.service";
import { V2ScheduleDto } from "./dto/v2/v2-schedule.dto";
import { CacheInterceptor, CacheKey } from "@nestjs/cache-manager";
import { UserRole } from "../users/user-role.enum";
import { User } from "../users/entity/user.entity";
import { V1CacheStatusDto } from "./dto/v1/v1-cache-status.dto";
import { V2CacheStatusDto } from "./dto/v2/v2-cache-status.dto";
import { V2UpdateDownloadUrlDto } from "./dto/v2/v2-update-download-url.dto";
import { V2GroupScheduleByNameDto } from "./dto/v2/v2-group-schedule-by-name.dto";
import { V2GroupScheduleDto } from "./dto/v2/v2-group-schedule.dto";
import { V2ScheduleGroupNamesDto } from "./dto/v2/v2-schedule-group-names.dto";

@ApiTags("v2/schedule")
@ApiBearerAuth()
@Controller({ path: "schedule", version: "2" })
@UseGuards(AuthGuard)
export class V2ScheduleController {
	constructor(private readonly scheduleService: V2ScheduleService) {}

	@ApiOperation({
		summary: "Получение расписания",
		tags: ["admin"],
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: V2ScheduleDto,
	})
	@ResultDto(V2ScheduleDto)
	@AuthRoles([UserRole.ADMIN])
	@CacheKey("v2-schedule")
	@UseInterceptors(CacheInterceptor)
	@HttpCode(HttpStatus.OK)
	@Get()
	async getSchedule(): Promise<V2ScheduleDto> {
		return await this.scheduleService.getSchedule();
	}

	@ApiOperation({ summary: "Получение расписания группы" })
	@ApiBody({ type: V2GroupScheduleByNameDto })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: V2GroupScheduleDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Требуемая группа не найдена",
	})
	@ResultDto(V2GroupScheduleDto)
	@HttpCode(HttpStatus.OK)
	@Get("group")
	async getGroupSchedule(
		@Body() reqDto: V2GroupScheduleByNameDto,
		@UserToken(UserPipe) user: User,
	): Promise<V2GroupScheduleDto> {
		return await this.scheduleService.getGroup(reqDto.name ?? user.group);
	}

	@ApiOperation({ summary: "Получение списка названий групп" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Список получен успешно",
		type: V2ScheduleGroupNamesDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Требуемая группа не найдена",
	})
	@ResultDto(V2ScheduleGroupNamesDto)
	@CacheKey("v2-schedule-group-names")
	@UseInterceptors(CacheInterceptor)
	@HttpCode(HttpStatus.OK)
	@Get("group-names")
	async getGroupNames(): Promise<V2ScheduleGroupNamesDto> {
		return await this.scheduleService.getGroupNames();
	}

	@ApiOperation({ summary: "Обновление основной страницы политехникума" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Данные обновлены успешно",
		type: V2CacheStatusDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Передан некорректный код страницы",
	})
	@ResultDto(V2CacheStatusDto)
	@HttpCode(HttpStatus.OK)
	@Patch("update-download-url")
	async updateDownloadUrl(
		@Body() reqDto: V2UpdateDownloadUrlDto,
	): Promise<V1CacheStatusDto> {
		return await this.scheduleService.updateDownloadUrl(reqDto.url);
	}

	@ApiOperation({
		summary: "Получение информации о кеше",
		tags: ["cache"],
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Получение данных прошло успешно",
		type: V2CacheStatusDto,
	})
	@ResultDto(V2CacheStatusDto)
	@HttpCode(HttpStatus.OK)
	@Get("cache-status")
	getCacheStatus(): V2CacheStatusDto {
		return this.scheduleService.getCacheStatus();
	}
}
