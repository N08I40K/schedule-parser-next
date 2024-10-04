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
import {
	ClearScheduleReplacerResDto,
	ScheduleReplacerResDto,
} from "../dto/schedule-replacer.dto";
import { AuthRoles } from "../auth-role/auth-role.decorator";
import { UserRoleDto } from "../dto/user.dto";
import { ScheduleReplacerService } from "./schedule-replacer.service";
import { ScheduleService } from "./schedule.service";
import { FileInterceptor } from "@nestjs/platform-express";
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiOperation,
	refs,
} from "@nestjs/swagger";
import { ResultDto } from "src/utility/validation/class-validator.interceptor";

@Controller("/api/v1/schedule-replacer")
@UseGuards(AuthGuard)
export class ScheduleReplacerController {
	constructor(
		private readonly scheduleService: ScheduleService,
		private readonly scheduleReplaceService: ScheduleReplacerService,
	) {}

	@ApiOperation({
		description: "Замена текущего расписание на новое",
		tags: ["schedule", "replacer"],
	})
	@ApiOkResponse({ description: "Замена прошла успешно" })
	@Post("set")
	@HttpCode(HttpStatus.OK)
	@AuthRoles([UserRoleDto.ADMIN])
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

	@ApiExtraModels(ScheduleReplacerResDto)
	@ApiOperation({
		description: "Получение списка заменителей расписания",
		tags: ["schedule", "replacer"],
	})
	@ApiOkResponse({ description: "Список получен успешно" }) // TODO: ааа((((
	@Get("get")
	@HttpCode(HttpStatus.OK)
	@AuthRoles([UserRoleDto.ADMIN])
	@ResultDto(null) // TODO: Как нибудь сделать проверку в таких случаях
	async getReplacers(): Promise<ScheduleReplacerResDto[]> {
		const etag = (await this.scheduleService.getSourceSchedule()).etag;

		const replacer = await this.scheduleReplaceService.getByEtag(etag);
		if (!replacer) return [];

		return [
			{
				etag: replacer.etag,
				size: replacer.data.byteLength,
			},
		];
	}

	@ApiExtraModels(ClearScheduleReplacerResDto)
	@ApiOperation({
		description: "Удаление всех замен расписаний",
		tags: ["schedule", "replacer"],
	})
	@ApiOkResponse({
		description: "Отчистка прошла успешно",
		schema: refs(ClearScheduleReplacerResDto)[0],
	})
	@Post("clear")
	@HttpCode(HttpStatus.OK)
	@AuthRoles([UserRoleDto.ADMIN])
	@ResultDto(ClearScheduleReplacerResDto)
	async clear(): Promise<ClearScheduleReplacerResDto> {
		const resDto = { count: await this.scheduleReplaceService.clear() };

		await this.scheduleService.refreshCache();

		return resDto;
	}
}
