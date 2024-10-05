import {
	ArgumentMetadata,
	PipeTransform,
	Type,
	ValidationPipe,
} from "@nestjs/common";
import { ValidationPipeOptions } from "@nestjs/common/pipes/validation.pipe";

export class PartialValidationPipe implements PipeTransform {
	private readonly validationPipe: ValidationPipe;
	private readonly partialValidationPipe: ValidationPipe;

	constructor(options?: ValidationPipeOptions) {
		this.validationPipe = new ValidationPipe(options);
		this.partialValidationPipe = new ValidationPipe({
			...options,
			...{
				skipUndefinedProperties: false,
				skipNullValues: false,
			},
		});
	}

	canBePartial(metatype?: Type): boolean {
		if (metatype === undefined) return false;
		return (
			["Update"].find((kw) => metatype.name.includes(kw)) !== undefined
		);
	}

	transform(value: any, metadata: ArgumentMetadata): any {
		if (metadata.type == "body" && this.canBePartial(metadata.metatype))
			return this.partialValidationPipe.transform(value, metadata);

		return this.validationPipe.transform(value, metadata);
	}
}
