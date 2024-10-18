import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SetScheduleReplacerDto } from "./dto/set-schedule-replacer.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class ScheduleReplacerService {
	constructor(private readonly prismaService: PrismaService) {}

	async hasByEtag(etag: string): Promise<boolean> {
		return (
			(await this.prismaService.scheduleReplace.count({
				where: { etag: etag },
			})) > 0
		);
	}

	async getByEtag(etag: string): Promise<SetScheduleReplacerDto | null> {
		const response = await this.prismaService.scheduleReplace.findUnique({
			where: { etag: etag },
		});
		if (response == null) return null;

		return plainToInstance(SetScheduleReplacerDto, response);
	}

	async getAll(): Promise<Array<SetScheduleReplacerDto>> {
		const response = await this.prismaService.scheduleReplace.findMany();

		return plainToInstance(SetScheduleReplacerDto, response);
	}

	async clear(): Promise<number> {
		const count = await this.prismaService.scheduleReplace.count();
		await this.prismaService.scheduleReplace.deleteMany({});

		return count;
	}

	async setByEtag(etag: string, buffer: Buffer): Promise<void> {
		if (
			(await this.prismaService.scheduleReplace.count({
				where: { etag: etag },
			})) > 0
		) {
			await this.prismaService.scheduleReplace.update({
				where: { etag: etag },
				data: {
					data: buffer,
				},
			});
			return;
		}

		await this.prismaService.scheduleReplace.create({
			data: {
				etag: etag,
				data: buffer,
			},
		});
	}
}
