import {
	isObject,
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
} from "class-validator";

export function IsMap(
	keyValidators: ((value: unknown) => boolean)[],
	valueValidators: ((value: unknown) => boolean)[],
	validationOptions?: ValidationOptions,
) {
	return function (object: unknown, propertyName: string) {
		registerDecorator({
			name: "isMap",
			target: (object as any).constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown, args: ValidationArguments): boolean {
					if (!isObject(value)) return false;
					const keys = Object.keys(value);
					const isInvalid = keys.some((key) => {
						const isKeyInvalid = keyValidators.some(
							(validator) => !validator(key),
						);
						if (isKeyInvalid) return true;

						return valueValidators.some(
							(validator) => !validator(value[key]),
						);
					});

					return !isInvalid;
				},
			},
		});
	};
}
