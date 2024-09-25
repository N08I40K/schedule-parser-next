import {
	IsArray,
	IsBase64,
	IsBoolean,
	IsDate,
	IsEnum,
	IsHash,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";
import { ApiProperty, OmitType, PickType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";

export class LessonTimeDto {
	@ApiProperty({
		example: 0,
		description: "Начало занятия в минутах относительно начала суток",
	})
	@IsNumber()
	start: number;
	@ApiProperty({
		example: 60,
		description: "Конец занятия в минутах относительно начала суток",
	})
	@IsNumber()
	end: number;

	constructor(start: number, end: number) {
		this.start = start;
		this.end = end;
	}

	static fromString(time: string): LessonTimeDto {
		time = time.trim().replaceAll(".", ":");

		const regex = /(\d+:\d+)-(\d+:\d+)/g;

		const parseResult = regex.exec(time);
		if (!parseResult) return new LessonTimeDto(0, 0);

		const start = parseResult[1].split(":");
		const end = parseResult[2].split(":");

		return new LessonTimeDto(
			Number.parseInt(start[0]) * 60 + Number.parseInt(start[1]),
			Number.parseInt(end[0]) * 60 + Number.parseInt(end[1]),
		);
	}
}

export enum LessonTypeDto {
	DEFAULT = 0,
	CUSTOM,
}

export class LessonDto {
	@ApiProperty({
		example: LessonTypeDto.DEFAULT,
		description: "Тип занятия",
	})
	@IsEnum(LessonTypeDto)
	type: LessonTypeDto;

	@ApiProperty({
		example: 1,
		description: "Индекс пары, если присутствует",
	})
	@IsNumber()
	defaultIndex: number;

	@ApiProperty({
		example: "Элементы высшей математики",
		description: "Название занятия",
	})
	@IsString()
	name: string;

	@ApiProperty({
		example: new LessonTimeDto(0, 60),
		description:
			"Начало и конец занятия в минутах относительно начала суток",
		required: false,
	})
	@IsOptional()
	@Type(() => LessonTimeDto)
	time: LessonTimeDto | null;

	@ApiProperty({ example: ["42", "с\\з"], description: "Кабинеты" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => String)
	cabinets: Array<string>;

	@ApiProperty({
		example: ["Хомченко Н.Е."],
		description: "ФИО преподавателей",
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => String)
	teacherNames: Array<string>;

	constructor(
		type: LessonTypeDto,
		defaultIndex: number,
		time: LessonTimeDto,
		name: string,
		cabinets: Array<string>,
		teacherNames: Array<string>,
	) {
		this.type = type;
		this.defaultIndex = defaultIndex;
		this.time = time;
		this.name = name;
		this.cabinets = cabinets;
		this.teacherNames = teacherNames;
	}
}

export class DayDto {
	@ApiProperty({
		example: "Понедельник",
		description: "День недели",
	})
	@IsString()
	name: string;

	@ApiProperty({ example: [0, 1, 3], description: "Индексы занятий" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	nonNullIndices: Array<number>;

	@ApiProperty({ example: [1, 3], description: "Индексы полных пар" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	defaultIndices: Array<number>;

	@ApiProperty({ example: [0], description: "Индексы доп. занятий" })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	customIndices: Array<number>;

	@ApiProperty({ example: [], description: "Занятия" })
	@IsArray()
	@ValidateNested({ each: true })
	@IsOptional()
	@Type(() => LessonDto)
	lessons: Array<LessonDto | null>;

	constructor(name: string) {
		this.name = name;

		this.nonNullIndices = [];
		this.defaultIndices = [];
		this.customIndices = [];

		this.lessons = [];
	}

	public fillIndices(): void {
		this.nonNullIndices = [];
		this.defaultIndices = [];
		this.customIndices = [];

		for (const lessonRawIdx in this.lessons) {
			const lessonIdx = Number.parseInt(lessonRawIdx);

			const lesson = this.lessons[lessonIdx];
			if (lesson === null) continue;

			this.nonNullIndices.push(lessonIdx);

			(lesson.type === LessonTypeDto.DEFAULT
				? this.defaultIndices
				: this.customIndices
			).push(lessonIdx);
		}
	}
}

export class GroupDto {
	@ApiProperty({
		example: "ИС-214/23",
		description: "Название группы",
	})
	@IsString()
	name: string;

	@ApiProperty({ example: [], description: "Дни недели" })
	@IsArray()
	@ValidateNested({ each: true })
	@IsOptional()
	@Type(() => DayDto)
	days: Array<DayDto | null>;

	constructor(name: string) {
		this.name = name;
		this.days = [];
	}
}

export class CacheStatusDto {
	@ApiProperty({
		example: true,
		description: "Нужно ли обновить ссылку для скачивания xls?",
	})
	@IsBoolean()
	cacheUpdateRequired: boolean;

	@ApiProperty({
		example: "e6ff169b01608addf998dbf8f40b019a7f514239",
		description: "Хеш последних полученных данных",
	})
	@IsHash("sha1")
	cacheHash: string;
}

export class ScheduleDto {
	@ApiProperty({
		example: new Date(),
		description:
			"Дата когда последний раз расписание было скачано с сервера политехникума",
	})
	@IsDate()
	updatedAt: Date;

	@ApiProperty({ description: "Расписание групп" })
	@IsObject()
	@IsOptional()
	groups: any;

	@ApiProperty({
		example: { "ИС-214/23": [5, 6] },
		description: "Обновлённые дни с последнего изменения расписания",
	})
	@IsObject()
	@Type(() => Object)
	@Transform(({ value }) => {
		const object = {};

		for (const key in value) {
			object[key] = value[key];
		}

		return object;
	})
	@Type(() => Object)
	lastChangedDays: Array<Array<number>>;
}

export class GroupScheduleRequestDto extends PickType(GroupDto, ["name"]) {}

export class ScheduleGroupsDto {
	@ApiProperty({
		example: ["ИС-214/23", "ИС-213/23"],
		description: "Список названий всех групп в текущем расписании",
	})
	@IsArray()
	names: Array<string>;
}

export class GroupScheduleDto extends OmitType(ScheduleDto, [
	"groups",
	"lastChangedDays",
]) {
	@ApiProperty({ description: "Расписание группы" })
	@IsObject()
	group: GroupDto;

	@ApiProperty({
		example: [5, 6],
		description: "Обновлённые дни с последнего изменения расписания",
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => Number)
	lastChangedDays: Array<number>;
}

export class SiteMainPageDto {
	@ApiProperty({
		example: "MHz=",
		description: "Страница политехникума",
	})
	@IsBase64()
	mainPage: string;
}
