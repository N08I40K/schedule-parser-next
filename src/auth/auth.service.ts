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
	UpdateTokenDto,
	UpdateTokenResultDto,
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

	async decodeUserToken(token: string): Promise<UserDto | null> {
		const jwtUser: { id: string } =
			await this.jwtService.verifyAsync(token);

		return this.usersService
			.findUnique({ id: jwtUser.id })
			.then((user) => user as UserDto | null);
	}

	async signUp(signUpDto: SignUpReqDto): Promise<SignUpResDto> {
		if (
			![UserRoleDto.STUDENT, UserRoleDto.TEACHER].includes(signUpDto.role)
		) {
			throw new NotAcceptableException("Передана неизвестная роль");
		}

		if (
			await this.usersService.contains({ username: signUpDto.username })
		) {
			throw new ConflictException(
				"Пользователь с таким именем уже существует!",
			);
		}

		const salt = await genSalt(8);
		const id = new Types.ObjectId().toString("hex");

		const input: Prisma.UserCreateInput = {
			id: id,
			username: signUpDto.username,
			salt: salt,
			password: await hash(signUpDto.password, salt),
			accessToken: await this.jwtService.signAsync({
				id: id,
			}),
			role: signUpDto.role as UserRole,
			group: signUpDto.group,
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
			username: signInDto.username,
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
		updateTokenDto: UpdateTokenDto,
	): Promise<UpdateTokenResultDto> {
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
}
