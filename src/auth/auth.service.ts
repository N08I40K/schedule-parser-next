import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
	SignInDto,
	SignInResultDto,
	SignUpDto,
	SignUpResultDto,
	UpdateTokenDto,
	UpdateTokenResultDto,
} from "../dto/auth.dto";
import { UsersService } from "../users/users.service";
import { genSalt, hash } from "bcrypt";
import { Prisma } from "@prisma/client";
import { Types } from "mongoose";

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async signUp(signUpDto: SignUpDto): Promise<SignUpResultDto> {
		if (await this.usersService.has({ username: signUpDto.username }))
			throw new ConflictException(
				"Пользователь с таким именем уже существует!",
			);

		const salt = await genSalt(8);
		const id = new Types.ObjectId().toString("hex");

		const input: Prisma.userCreateInput = {
			id: id,
			username: signUpDto.username,
			salt: salt,
			password: await hash(signUpDto.password, salt),
			access_token: await this.jwtService.signAsync({
				id: id,
			}),
		};

		return this.usersService.create(input).then((user) => {
			return {
				id: user.id,
				access_token: user.access_token,
			};
		});
	}

	async signIn(signInDto: SignInDto): Promise<SignInResultDto> {
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

		const access_token = await this.jwtService.signAsync({ id: user.id });

		await this.usersService.update({
			where: { id: user.id },
			data: { access_token: access_token },
		});

		return { id: user.id, access_token: access_token };
	}

	async updateToken(
		updateTokenDto: UpdateTokenDto,
	): Promise<UpdateTokenResultDto> {
		if (
			!(await this.jwtService.verifyAsync(updateTokenDto.access_token, {
				ignoreExpiration: true,
			}))
		) {
			throw new NotFoundException(
				"Некорректный или недействительный токен!",
			);
		}

		const jwt_user: { id: string } = await this.jwtService.decode(
			updateTokenDto.access_token,
		);

		const user = await this.usersService.findUnique({ id: jwt_user.id });
		if (!user || user.access_token !== updateTokenDto.access_token) {
			throw new NotFoundException(
				"Некорректный или недействительный токен!",
			);
		}

		const access_token = await this.jwtService.signAsync({ id: user.id });

		await this.usersService.update({
			where: { id: user.id },
			data: { access_token: access_token },
		});

		return { access_token: access_token };
	}
}
