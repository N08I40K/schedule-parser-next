import { configDotenv } from "dotenv";
configDotenv();

export const jwtConstants = {
	secret: process.env.JWT_SECRET!,
};
