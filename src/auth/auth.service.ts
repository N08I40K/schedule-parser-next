import {
	ConflictException,
	Injectable,
	NotAcceptableException,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { genSalt, hash } from "bcrypt";
import { Prisma } from "@prisma/client";
import { Types } from "mongoose";
import { UserRole } from "../users/user-role.enum";
import { User } from "../users/entity/user.entity";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	/**
	 * Получение пользователя по его токену
	 * @param token - jwt токен
	 * @returns {User} - пользователь
	 * @throws {UnauthorizedException} - некорректный или недействительный токен
	 * @throws {UnauthorizedException} - токен указывает на несуществующего пользователя
	 * @throws {UnauthorizedException} - текущий токен устарел и был обновлён на новый
	 * @async
	 */
	async decodeUserToken(token: string): Promise<User> {
		const jwtUser: { id: string } | null =
			await this.jwtService.verifyAsync(token);

		const throwError = () => {
			throw new UnauthorizedException(
				"Некорректный или недействительный токен",
			);
		};

		if (jwtUser === null) throwError();

		const user = await this.usersService.findUnique({ id: jwtUser.id });

		if (!user || user.accessToken !== token) throwError();

		return user;
	}

	/**
	 * Регистрация нового пользователя
	 * @param signUp - данные нового пользователя
	 * @returns {User} - пользователь
	 * @throws {NotAcceptableException} - передана недопустимая роль
	 * @throws {ConflictException} - пользователь с таким именем уже существует
	 * @async
	 */
	async signUp(signUp: SignUpDto): Promise<User> {
		const group = signUp.group.replaceAll(" ", "");
		const username = signUp.username.replaceAll(" ", "");

		if (![UserRole.STUDENT, UserRole.TEACHER].includes(signUp.role))
			throw new NotAcceptableException("Передана неизвестная роль");

		if (await this.usersService.contains({ username: username })) {
			throw new ConflictException(
				"Пользователь с таким именем уже существует!",
			);
		}

		const salt = await genSalt(8);
		const id = new Types.ObjectId().toString("hex");

		const input: Prisma.UserCreateInput = {
			id: id,
			username: username,
			salt: salt,
			password: await hash(signUp.password, salt),
			accessToken: await this.jwtService.signAsync({
				id: id,
			}),
			role: signUp.role as UserRole,
			group: group,
			version: signUp.version ?? "1.0.0",
		};

		return await this.usersService.create(input);
	}

	/**
	 * Авторизация пользователя
	 * @param signIn - данные авторизации
	 * @returns {User} - пользователь
	 * @throws {UnauthorizedException} - некорректное имя пользователя или пароль
	 * @async
	 */
	async signIn(signIn: SignInDto): Promise<User> {
		const user = await this.usersService.findUnique({
			username: signIn.username.replaceAll(" ", ""),
		});

		if (
			!user ||
			user.password !== (await hash(signIn.password, user.salt))
		) {
			throw new UnauthorizedException(
				"Некорректное имя пользователя или пароль!",
			);
		}

		const accessToken = await this.jwtService.signAsync({ id: user.id });

		return await this.usersService.update({
			where: { id: user.id },
			data: { accessToken: accessToken },
		});
	}

	/**
	 * Обновление токена пользователя
	 * @param oldToken - старый токен
	 * @returns {User} - пользователь
	 * @throws {NotFoundException} - некорректный или недействительный токен
	 * @throws {NotFoundException} - токен указывает на несуществующего пользователя
	 * @throws {NotFoundException} - текущий токен устарел и был обновлён на новый
	 * @async
	 */
	async updateToken(oldToken: string): Promise<User> {
		if (
			!(await this.jwtService.verifyAsync(oldToken, {
				ignoreExpiration: true,
			}))
		) {
			throw new NotFoundException(
				"Некорректный или недействительный токен!",
			);
		}

		const jwtUser: { id: string } = await this.jwtService.decode(oldToken);

		const user = await this.usersService.findUnique({ id: jwtUser.id });
		if (!user || user.accessToken !== oldToken) {
			throw new NotFoundException(
				"Некорректный или недействительный токен!",
			);
		}

		const accessToken = await this.jwtService.signAsync({ id: user.id });

		return await this.usersService.update({
			where: { id: user.id },
			data: { accessToken: accessToken },
		});
	}

	/**
	 * Смена пароля пользователя
	 * @param user - пользователь
	 * @param changePassword - старый и новый пароли
	 * @throws {ConflictException} - пароли идентичны
	 * @throws {UnauthorizedException} - неверный исходный пароль
	 * @async
	 */
	async changePassword(
		user: User,
		changePassword: ChangePasswordDto,
	): Promise<void> {
		const { oldPassword, newPassword } = changePassword;

		if (oldPassword == newPassword)
			throw new ConflictException("Пароли идентичны");

		if (user.password !== (await hash(oldPassword, user.salt)))
			throw new UnauthorizedException("Передан неверный исходный пароль");

		await this.usersService.update({
			where: { id: user.id },
			data: {
				password: await hash(newPassword, user.salt),
			},
		});
	}
}
