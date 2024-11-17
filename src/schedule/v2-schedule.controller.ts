import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ResultDto } from "../utility/validation/class-validator.interceptor";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { AuthRoles, AuthUnauthorized } from "../auth/auth-role.decorator";
import { UserToken } from "../auth/auth.decorator";
import { UserPipe } from "../auth/auth.pipe";
import { ScheduleService } from "./schedule.service";
import { ScheduleDto } from "./dto/schedule.dto";
import { CacheInterceptor, CacheKey } from "@nestjs/cache-manager";
import { UserRole } from "../users/user-role.enum";
import { User } from "../users/entity/user.entity";
import { CacheStatusDto } from "./dto/cache-status.dto";
import { UpdateDownloadUrlDto } from "./dto/update-download-url.dto";
import { GroupScheduleDto } from "./dto/group-schedule.dto";
import { ScheduleGroupNamesDto } from "./dto/schedule-group-names.dto";
import { TeacherScheduleDto } from "./dto/teacher-schedule.dto";
import { ScheduleTeacherNamesDto } from "./dto/schedule-teacher-names.dto";
import instanceToInstance2 from "../utility/class-trasformer/instance-to-instance-2";

@ApiTags("v2/schedule")
@ApiBearerAuth()
@Controller({ path: "schedule", version: "2" })
@UseGuards(AuthGuard)
export class V2ScheduleController {
	constructor(private readonly scheduleService: ScheduleService) {}

	@ApiOperation({
		summary: "Получение расписания",
		tags: ["admin"],
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: ScheduleDto,
	})
	@ResultDto(ScheduleDto)
	@AuthRoles([UserRole.ADMIN])
	@CacheKey("v2-schedule")
	@UseInterceptors(CacheInterceptor)
	@HttpCode(HttpStatus.OK)
	@Get()
	async getSchedule(): Promise<ScheduleDto> {
		return await this.scheduleService.getSchedule().then((result) =>
			instanceToInstance2(ScheduleDto, result, {
				groups: ["v1"],
			}),
		);
	}

	@ApiOperation({ summary: "Получение расписания группы" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: GroupScheduleDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Требуемая группа не найдена",
	})
	@ResultDto(GroupScheduleDto)
	@HttpCode(HttpStatus.OK)
	@Get("group")
	async getGroupSchedule(
		@UserToken(UserPipe) user: User,
	): Promise<GroupScheduleDto> {
		return await this.scheduleService.getGroup(user.group).then((result) =>
			instanceToInstance2(GroupScheduleDto, result, {
				groups: ["v1"],
			}),
		);
	}

	@ApiOperation({ summary: "Получение списка названий групп" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Список получен успешно",
		type: ScheduleGroupNamesDto,
	})
	@ResultDto(ScheduleGroupNamesDto)
	@CacheKey("v2-schedule-group-names")
	@UseInterceptors(CacheInterceptor)
	@AuthUnauthorized()
	@HttpCode(HttpStatus.OK)
	@Get("group-names")
	async getGroupNames(): Promise<ScheduleGroupNamesDto> {
		return await this.scheduleService.getGroupNames();
	}

	@ApiOperation({ summary: "Получение расписания преподавателя" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Расписание получено успешно",
		type: TeacherScheduleDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "Требуемый преподаватель не найден",
	})
	@ResultDto(TeacherScheduleDto)
	@HttpCode(HttpStatus.OK)
	@Get("teacher/:name")
	async getTeacherSchedule(
		@Param("name") name: string,
	): Promise<TeacherScheduleDto> {
		return await this.scheduleService.getTeacher(name).then((result) =>
			instanceToInstance2(TeacherScheduleDto, result, {
				groups: ["v1"],
			}),
		);
	}

	@ApiOperation({ summary: "Получение списка ФИО преподавателей" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Список получен успешно",
		type: ScheduleTeacherNamesDto,
	})
	@ResultDto(ScheduleTeacherNamesDto)
	@CacheKey("v2-schedule-teacher-names")
	@UseInterceptors(CacheInterceptor)
	@AuthUnauthorized()
	@HttpCode(HttpStatus.OK)
	@Get("teacher-names")
	async getTeacherNames(): Promise<ScheduleTeacherNamesDto> {
		return await this.scheduleService.getTeacherNames();
	}

	@ApiOperation({ summary: "Обновление основной страницы политехникума" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Данные обновлены успешно",
		type: CacheStatusDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_ACCEPTABLE,
		description: "Передан некорректный код страницы",
	})
	@ResultDto(CacheStatusDto)
	@HttpCode(HttpStatus.OK)
	@Patch("update-download-url")
	async updateDownloadUrl(
		@Body() reqDto: UpdateDownloadUrlDto,
	): Promise<CacheStatusDto> {
		return await this.scheduleService.updateDownloadUrl(reqDto.url);
	}

	@ApiOperation({
		summary: "Получение информации о кеше",
		tags: ["cache"],
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Получение данных прошло успешно",
		type: CacheStatusDto,
	})
	@ResultDto(CacheStatusDto)
	@HttpCode(HttpStatus.OK)
	@Get("cache-status")
	getCacheStatus(): CacheStatusDto {
		return this.scheduleService.getCacheStatus();
	}
}
