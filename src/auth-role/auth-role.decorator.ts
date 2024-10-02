import { Reflector } from "@nestjs/core";
import { UserRoleDto } from "../dto/user.dto";

export const AuthRoles = Reflector.createDecorator<UserRoleDto[]>();
