import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, user } from "@prisma/client";

@Injectable()
export class UsersService {
	constructor(private readonly prismaService: PrismaService) {}

	async findUnique(where: Prisma.userWhereUniqueInput): Promise<user | null> {
		return this.prismaService.user.findUnique({ where: where });
	}

	async update(params: {
		where: Prisma.userWhereUniqueInput;
		data: Prisma.userUpdateInput;
	}): Promise<user | null> {
		return this.prismaService.user.update(params);
	}

	async create(data: Prisma.userCreateInput): Promise<user> {
		return this.prismaService.user.create({ data });
	}

	async contains(where: Prisma.userWhereUniqueInput): Promise<boolean> {
		return (await this.prismaService.user.count({ where })) > 0;
	}
}
