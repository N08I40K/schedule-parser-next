import {
	ConflictException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import {
	ChangeGroupReqDto,
	ChangeUsernameReqDto,
	UserDto,
} from "../dto/user.dto";
import { ScheduleService } from "../schedule/schedule.service";

@Injectable()
export class UsersService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly scheduleService: ScheduleService,
	) {}

	private static convertToDto = (user: UserDto | null) =>
		user as UserDto | null;

	async findUnique(
		where: Prisma.UserWhereUniqueInput,
	): Promise<UserDto | null> {
		return this.prismaService.user
			.findUnique({ where: where })
			.then(UsersService.convertToDto);
	}

	async update(params: {
		where: Prisma.UserWhereUniqueInput;
		data: Prisma.UserUpdateInput;
	}): Promise<UserDto> {
		return this.prismaService.user
			.update(params)
			.then(UsersService.convertToDto);
	}

	async create(data: Prisma.UserCreateInput): Promise<UserDto> {
		return this.prismaService.user
			.create({ data })
			.then(UsersService.convertToDto);
	}

	async contains(where: Prisma.UserWhereUniqueInput): Promise<boolean> {
		return this.prismaService.user
			.count({ where })
			.then((count) => count > 0);
	}

	async changeUsername(
		user: UserDto,
		changeUsernameDto: ChangeUsernameReqDto,
	): Promise<void> {
		if (user.username === changeUsernameDto.username) return;

		if (await this.contains({ username: changeUsernameDto.username })) {
			throw new ConflictException(
				"Пользователь с таким именем уже существует",
			);
		}

		await this.update({
			where: { id: user.id },
			data: { username: changeUsernameDto.username },
		});
	}

	async changeGroup(
		user: UserDto,
		changeGroupDto: ChangeGroupReqDto,
	): Promise<void> {
		if (user.group === changeGroupDto.group) return;

		const groupNames = await this.scheduleService.getGroupNames();
		if (!groupNames.names.includes(changeGroupDto.group)) {
			throw new NotFoundException(
				"Группа с таким названием не существует",
			);
		}

		await this.update({
			where: { id: user.id },
			data: { group: changeGroupDto.group },
		});
	}
}
