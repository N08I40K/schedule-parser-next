import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidatorOptions } from "class-validator";
import { PartialValidationPipe } from "./utility/validation/partial-validation.pipe";
import { ClassValidatorInterceptor } from "./utility/validation/class-validator.interceptor";
import { RedocModule } from "nest-redoc";
import { apiConstants, httpsConstants } from "./contants";
import * as fs from "node:fs";
import { VersioningType } from "@nestjs/common";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		httpsOptions: {
			cert: fs.readFileSync(httpsConstants.certPath),
			key: fs.readFileSync(httpsConstants.keyPath),
		},
	});
	const validatorOptions: ValidatorOptions = {
		enableDebugMessages: true,
		forbidNonWhitelisted: true,
		whitelist: true,
	};
	app.useGlobalPipes(new PartialValidationPipe(validatorOptions));
	app.useGlobalInterceptors(new ClassValidatorInterceptor(validatorOptions));
	app.enableCors();

	app.setGlobalPrefix("api");
	app.enableVersioning({
		type: VersioningType.URI,
	});

	const swaggerConfig = RedocModule.createDocumentBuilder()
		.setTitle("Schedule Parser")
		.setDescription("Парсер расписания")
		.setVersion(apiConstants.version)
		.build();
	const swaggerDocument = RedocModule.createDocument(app, swaggerConfig, {
		deepScanRoutes: true,
	});
	swaggerDocument.servers = [
		{
			url: `https://localhost:${apiConstants.port}`,
			description: "Локальный сервер для разработки",
		},
	];
	await RedocModule.setup("api-docs", app, swaggerDocument, {});

	await app.listen(apiConstants.port);
}

bootstrap().then();
