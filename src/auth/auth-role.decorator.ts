import { Reflector } from "@nestjs/core";

import { UserRole } from "../users/user-role.enum";

export const AuthRoles = Reflector.createDecorator<UserRole[]>();
export const AuthUnauthorized = Reflector.createDecorator<true>();
