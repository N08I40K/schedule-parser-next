import { configDotenv } from "dotenv";
import * as process from "node:process";

configDotenv();

export const jwtConstants = {
	secret: process.env.JWT_SECRET!,
};

export const httpsConstants = {
	certPath: process.env.CERT_PEM_PATH!,
	keyPath: process.env.KEY_PEM_PATH!,
};

export const apiConstants = {
	port: +(process.env.API_PORT ?? 5050),
	version: process.env.SERVER_VERSION!,
};

export const firebaseConstants = {
	serviceAccountPath: process.env.FIREBASE_ACCOUNT_PATH!,
};

export const scheduleConstants = {
	cacheInvalidateDelay: +(process.env.SERVER_CACHE_INVALIDATE_DELAY! ?? 5),
};
