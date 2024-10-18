import { PickType } from "@nestjs/swagger";
import { User } from "../entity/user.entity";

export class ChangeUsernameDto extends PickType(User, ["username"]) {}
