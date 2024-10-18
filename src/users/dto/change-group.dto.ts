import { PickType } from "@nestjs/swagger";
import { User } from "../entity/user.entity";

export class ChangeGroupDto extends PickType(User, ["group"]) {}
