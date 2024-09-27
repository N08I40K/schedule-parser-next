import "reflect-metadata";

import {
	CallHandler,
	ExecutionContext,
	HttpStatus,
	Injectable,
	InternalServerErrorException,
	NestInterceptor,
	UnprocessableEntityException,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { validate, ValidationOptions } from "class-validator";

@Injectable()
export class ClassValidatorInterceptor implements NestInterceptor {
	constructor(private readonly validatorOptions: ValidationOptions) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<any> | Promise<Observable<any>> {
		return next.handle().pipe(
			map(async (returnValue: any) => {
				const handler = context.getHandler();
				const cls = context.getClass();

				const classDto = Reflect.getMetadata(
					"design:result-dto",
					cls.prototype,
					handler.name,
				);

				const isArrayOfDto = Reflect.getMetadata(
					"design:result-dto-array",
					cls.prototype,
					handler.name,
				);

				if (classDto === null) return returnValue;

				if (classDto === undefined) {
					console.warn(
						`Undefined DTO type for function \"${cls.name}::${handler.name}\"!`,
					);
					return returnValue;
				}

				const dtoArray: Array<any> = isArrayOfDto
					? classDto
					: [classDto];

				for (let idx = 0; idx < dtoArray.length; idx++) {
					const returnValueDto = plainToInstance(
						dtoArray[idx],
						instanceToPlain(returnValue),
					);

					if (!(returnValueDto instanceof Object))
						throw new InternalServerErrorException(
							returnValueDto,
							"Return value is not object!",
						);

					const validationErrors = await validate(
						returnValueDto,
						this.validatorOptions,
					);

					if (validationErrors.length > 0) {
						if (idx !== dtoArray.length - 1) continue;

						throw new UnprocessableEntityException({
							message: validationErrors
								.map((value) =>
									Object.values(value.constraints),
								)
								.flat(),
							object: returnValue,
							error: "Response Validation Failed",
							statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
						});
					}
					return returnValue;
				}
			}),
		);
	}
}

// noinspection FunctionNamingConventionJS
export function ResultDto(dtoType: any) {
	return (target: NonNullable<unknown>, propertyKey: string | symbol) => {
		Reflect.defineMetadata(
			"design:result-dto",
			dtoType,
			target,
			propertyKey,
		);
		Reflect.defineMetadata(
			"design:result-dto-array",
			dtoType !== null && dtoType.constructor === Array,
			target,
			propertyKey,
		);
	};
}
