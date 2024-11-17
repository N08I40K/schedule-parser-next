import {
	ClassConstructor,
	ClassTransformOptions,
} from "class-transformer/types/interfaces";
import { instanceToPlain, plainToInstance } from "class-transformer";

export default function instanceToInstance2<T, V>(
	cls: ClassConstructor<T>,
	instance: V,
	options?: ClassTransformOptions,
): T {
	return plainToInstance(cls, instanceToPlain(instance), options);
}
