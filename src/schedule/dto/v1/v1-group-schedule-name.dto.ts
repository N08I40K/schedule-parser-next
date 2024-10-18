import { PartialType, PickType } from "@nestjs/swagger";
import { V1GroupDto } from "./v1-group.dto";

export class V1GroupScheduleNameDto extends PartialType(
	PickType(V1GroupDto, ["name"]),
) {}
