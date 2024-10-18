import { V2CacheStatusDto } from "../v2/v2-cache-status.dto";
import { instanceToPlain, plainToClass } from "class-transformer";
import { V1CacheStatusDto } from "./v1-cache-status.dto";

export class CacheStatusDto extends V2CacheStatusDto {
	public static stripVersion(instance: CacheStatusDto, version: number) {
		switch (version) {
			default:
				return instance;
			case 0: {
				return plainToClass(
					V1CacheStatusDto,
					instanceToPlain(instance),
					{ excludeExtraneousValues: true },
				);
			}
		}
	}
}