import { PartialType, PickType } from "@nestjs/swagger";
import { V1GroupDto } from "../v1/v1-group.dto";

export class V2GroupScheduleByNameDto extends PartialType(
	PickType(V1GroupDto, ["name"]),
) {}
