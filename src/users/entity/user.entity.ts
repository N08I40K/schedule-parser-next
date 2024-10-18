import {
	IsEnum,
	IsJWT,
	IsMongoId,
	IsObject,
	IsOptional,
	IsSemVer,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { UserRole } from "../user-role.enum";

import { FcmUser } from "./fcm-user.entity";

export class User {
	/**
	 * Идентификатор (ObjectId)
	 * @example "66e1b7e255c5d5f1268cce90"
	 */
	@IsMongoId()
	id: string;

	/**
	 * Имя
	 * @example "n08i40k"
	 */
	@IsString()
	@MinLength(4)
	@MaxLength(10)
	username: string;

	/**
	 * Соль пароля
	 * @example "$2b$08$34xwFv1WVJpvpVi3tZZuv."
	 */
	@IsString()
	salt: string;

	/**
	 * Хеш пароля
	 * @example "$2b$08$34xwFv1WVJpvpVi3tZZuv."
	 */
	@IsString()
	password: string;

	/**
	 * Последний токен доступа
	 * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXCJ9..."
	 */
	@IsJWT()
	accessToken: string;

	/**
	 * Группа
	 * @example "ИС-214/23"
	 */
	@IsString()
	group: string;

	/**
	 * Роль
	 * @example STUDENT
	 */
	@IsEnum(UserRole)
	role: UserRole;

	/**
	 * Данные Firebase Cloud Messaging
	 */
	@IsObject()
	@Type(() => FcmUser)
	@IsOptional()
	fcm?: FcmUser;

	/**
	 * Версия установленного приложения
	 * @example "2.0.0"
	 */
	@IsSemVer()
	version: string;
}
