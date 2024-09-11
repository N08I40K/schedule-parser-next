import { configDotenv } from "dotenv";

configDotenv();

export const jwtConstants = {
	secret: process.env.JWT_SECRET!,
};

export const httpsConstants = {
	certPath: process.env.CERT_PEM_PATH!,
	keyPath: process.env.KEY_PEM_PATH!,
};
