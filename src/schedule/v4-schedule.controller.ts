import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
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
import { AuthRoles } from "../auth/auth-role.decorator";
import { UserToken } from "../auth/auth.decorator";
import { UserPipe } from "../auth/auth.pipe";
import { ScheduleService } from "./schedule.service";
import { ScheduleDto } from "./dto/schedule.dto";
import { CacheInterceptor, CacheKey } from "@nestjs/cache-manager";
import { UserRole } from "../users/user-role.enum";
import { User } from "../users/entity/user.entity";
import { GroupScheduleDto } from "./dto/group-schedule.dto";
import { TeacherScheduleDto } from "./dto/teacher-schedule.dto";
import instanceToInstance2 from "../utility/class-trasformer/instance-to-instance-2";

@ApiTags("v4/schedule")
@ApiBearerAuth()
@Controller({ path: "schedule", version: "4" })
@UseGuards(AuthGuard)
export class V4ScheduleController {
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
	@CacheKey("v4-schedule")
	@UseInterceptors(CacheInterceptor)
	@HttpCode(HttpStatus.OK)
	@Get()
	async getSchedule(): Promise<ScheduleDto> {
		return await this.scheduleService.getSchedule().then((result) =>
			instanceToInstance2(ScheduleDto, result, {
				groups: ["v3"],
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
				groups: ["v3"],
			}),
		);
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
				groups: ["v3"],
			}),
		);
	}
}
