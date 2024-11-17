import {
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { User } from "./entity/user.entity";
import { ChangeUsernameDto } from "./dto/change-username.dto";
import { ChangeGroupDto } from "./dto/change-group.dto";
import { plainToInstance } from "class-transformer";
import { ScheduleService } from "../schedule/schedule.service";

@Injectable()
export class UsersService {
	constructor(
		private readonly prismaService: PrismaService,
		@Inject(forwardRef(() => ScheduleService))
		private readonly scheduleService: ScheduleService,
	) {}

	async findUnique(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
		return plainToInstance(
			User,
			await this.prismaService.user.findUnique({ where: where }),
		);
	}

	async update(params: {
		where: Prisma.UserWhereUniqueInput;
		data: Prisma.UserUpdateInput;
	}): Promise<User> {
		return plainToInstance(
			User,
			await this.prismaService.user.update(params),
		);
	}

	async create(data: Prisma.UserCreateInput): Promise<User> {
		return plainToInstance(
			User,
			await this.prismaService.user.create({ data }),
		);
	}

	async contains(where: Prisma.UserWhereUniqueInput): Promise<boolean> {
		return await this.prismaService.user
			.count({ where })
			.then((count) => count > 0);
	}

	async changeUsername(
		user: User,
		changeUsernameDto: ChangeUsernameDto,
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
		user: User,
		changeGroupDto: ChangeGroupDto,
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
