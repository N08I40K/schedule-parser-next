import {
	BadRequestException,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { AuthRoles } from "../auth/auth-role.decorator";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { V1ScheduleService } from "./v1-schedule.service";
import { FileInterceptor } from "@nestjs/platform-express";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { ResultDto } from "src/utility/validation/class-validator.interceptor";
import { UserRole } from "../users/user-role.enum";
import { ScheduleReplacerDto } from "./dto/schedule-replacer.dto";
import { ClearScheduleReplacerDto } from "./dto/clear-schedule-replacer.dto";
import { plainToInstance } from "class-transformer";

@ApiTags("v1/schedule-replacer")
@ApiBearerAuth()
@Controller({ path: "schedule-replacer", version: "1" })
@UseGuards(AuthGuard)
export class ScheduleReplacerController {
	constructor(
		private readonly scheduleService: V1ScheduleService,
		private readonly scheduleReplaceService: ScheduleReplacerService,
	) {}

	@ApiOperation({ description: "Замена текущего расписание на новое" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Замена прошла успешно",
	})
	@Post("set")
	@HttpCode(HttpStatus.OK)
	@AuthRoles([UserRole.ADMIN])
	@ResultDto(null)
	@UseInterceptors(
		FileInterceptor("file", { limits: { fileSize: 1024 * 1024 } }),
	)
	async setSchedule(
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		if (!file) throw new BadRequestException("Файл отсутствует");
		if (file.mimetype !== "application/vnd.ms-excel")
			throw new BadRequestException("Некорректный тип файла");

		const etag = (await this.scheduleService.getSourceSchedule()).etag;
		await this.scheduleReplaceService.setByEtag(etag, file.buffer);
		await this.scheduleService.refreshCache();
	}

	@ApiOperation({ description: "Получение списка заменителей расписания" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Список получен успешно",
	})
	@Get("get")
	@HttpCode(HttpStatus.OK)
	@AuthRoles([UserRole.ADMIN])
	@ResultDto(null) // TODO: Как нибудь сделать проверку в таких случаях
	async getReplacers(): Promise<ScheduleReplacerDto[]> {
		return await this.scheduleReplaceService.getAll().then((result) => {
			return result.map((replacer) => {
				return plainToInstance(ScheduleReplacerDto, {
					etag: replacer.etag,
					size: replacer.data.byteLength,
				} as ScheduleReplacerDto);
			});
		});
	}

	@ApiOperation({ description: "Удаление всех замен расписаний" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Отчистка прошла успешно",
		type: ClearScheduleReplacerDto,
	})
	@Post("clear")
	@HttpCode(HttpStatus.OK)
	@AuthRoles([UserRole.ADMIN])
	@ResultDto(ClearScheduleReplacerDto)
	async clear(): Promise<ClearScheduleReplacerDto> {
		const response = { count: await this.scheduleReplaceService.clear() };

		await this.scheduleService.refreshCache();

		return response;
	}
}
