import { PickType } from "@nestjs/swagger";
import { User } from "../../users/entity/user.entity";

export class SignUpResponseDto extends PickType(User, ["id", "accessToken"]) {}
