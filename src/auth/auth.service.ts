import {
	ConflictException,
	Injectable,
	NotAcceptableException,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
	SignInReqDto,
	SignInResDto,
	SignUpReqDto,
	SignUpResDto,
	ChangePasswordReqDto,
	UpdateTokenReqDto,
	UpdateTokenResDto,
} from "../dto/auth.dto";
import { UsersService } from "../users/users.service";
import { genSalt, hash } from "bcrypt";
import { Prisma, UserRole } from "@prisma/client";
import { Types } from "mongoose";
import { UserDto, UserRoleDto } from "../dto/user.dto";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async decodeUserToken(token: string): Promise<UserDto> {
		const jwtUser: { id: string } | null =
			await this.jwtService.verifyAsync(token);

		if (jwtUser === null) {
			throw new UnauthorizedException(
				"Некорректный или недействительный токен",
			);
		}

		const user = await this.usersService
			.findUnique({ id: jwtUser.id })
			.then((user) => user as UserDto | null);

		if (!user)
			throw new UnauthorizedException("Не удалось найти пользователя!");

		if (user.accessToken !== token) {
			throw new UnauthorizedException(
				"Некорректный или недействительный токен",
			);
		}

		return user as UserDto;
	}

	async signUp(signUpDto: SignUpReqDto): Promise<SignUpResDto> {
		const group = signUpDto.group.replaceAll(" ", "");
		const username = signUpDto.username.replaceAll(" ", "");

		if (
			![UserRoleDto.STUDENT, UserRoleDto.TEACHER].includes(signUpDto.role)
		) {
			throw new NotAcceptableException("Передана неизвестная роль");
		}

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
			password: await hash(signUpDto.password, salt),
			accessToken: await this.jwtService.signAsync({
				id: id,
			}),
			role: signUpDto.role as UserRole,
			group: group,
			version: signUpDto.version ?? "1.0.0",
		};

		return this.usersService.create(input).then((user) => {
			return {
				id: user.id,
				accessToken: user.accessToken,
			};
		});
	}

	async signIn(signInDto: SignInReqDto): Promise<SignInResDto> {
		const user = await this.usersService.findUnique({
			username: signInDto.username.replaceAll(" ", ""),
		});

		if (
			!user ||
			user.password !== (await hash(signInDto.password, user.salt))
		) {
			throw new UnauthorizedException(
				"Некорректное имя пользователя или пароль!",
			);
		}

		const accessToken = await this.jwtService.signAsync({ id: user.id });

		await this.usersService.update({
			where: { id: user.id },
			data: { accessToken: accessToken },
		});

		return { id: user.id, accessToken: accessToken };
	}

	async updateToken(
		updateTokenDto: UpdateTokenReqDto,
	): Promise<UpdateTokenResDto> {
		if (
			!(await this.jwtService.verifyAsync(updateTokenDto.accessToken, {
				ignoreExpiration: true,
			}))
		) {
			throw new NotFoundException(
				"Некорректный или недействительный токен!",
			);
		}

		const jwtUser: { id: string } = await this.jwtService.decode(
			updateTokenDto.accessToken,
		);

		const user = await this.usersService.findUnique({ id: jwtUser.id });
		if (!user || user.accessToken !== updateTokenDto.accessToken) {
			throw new NotFoundException(
				"Некорректный или недействительный токен!",
			);
		}

		const accessToken = await this.jwtService.signAsync({ id: user.id });

		await this.usersService.update({
			where: { id: user.id },
			data: { accessToken: accessToken },
		});

		return { accessToken: accessToken };
	}

	async changePassword(
		user: UserDto,
		changePasswordReqDto: ChangePasswordReqDto,
	): Promise<void> {
		const { oldPassword, newPassword } = changePasswordReqDto;

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
