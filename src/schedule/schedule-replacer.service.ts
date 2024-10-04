import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleReplacerDto } from "../dto/schedule-replacer.dto";
import { plainToClass } from "class-transformer";

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

	async getByEtag(etag: string): Promise<ScheduleReplacerDto | null> {
		const response = await this.prismaService.scheduleReplace.findUnique({
			where: { etag: etag },
		});
		if (response == null) return null;

		return plainToClass(ScheduleReplacerDto, response);
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
