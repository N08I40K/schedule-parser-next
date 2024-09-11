import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { UserDto } from "../dto/user.dto";

@Injectable()
export class UsersService {
	constructor(private readonly prismaService: PrismaService) {}

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
	}): Promise<UserDto | null> {
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
}
