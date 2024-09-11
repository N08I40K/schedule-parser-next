import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidatorOptions } from "class-validator";
import { PartialValidationPipe } from "./utility/validation/partial-validation.pipe";
import { ClassValidatorInterceptor } from "./utility/validation/class-validator.interceptor";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { httpsConstants } from "./contants";
import * as path from "node:path";
import * as fs from "node:fs";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		httpsOptions: {
			cert: fs.readFileSync(
				path.join(__dirname, httpsConstants.certPath),
			),
			key: fs.readFileSync(path.join(__dirname, httpsConstants.keyPath)),
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

	const swaggerConfig = new DocumentBuilder()
		.setTitle("Schedule Parser")
		.setDescription("Парсер расписания")
		.setVersion("1.0")
		.build();
	const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
	swaggerDocument.servers = [
		{
			url: "http://localhost:3000",
			description: "Локальный сервер для разработки",
		},
	];
	SwaggerModule.setup("api-docs", app, swaggerDocument);

	await app.listen(3000);
}

bootstrap().then();
