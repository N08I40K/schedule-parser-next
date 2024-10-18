import { IntersectionType, PartialType, PickType } from "@nestjs/swagger";
import { SignInDto } from "./sign-in.dto";
import { User } from "../../users/entity/user.entity";

export class SignUpDto extends IntersectionType(
	SignInDto,
	PickType(User, ["role", "group"]),
	PartialType(PickType(User, ["version"])),
) {}
