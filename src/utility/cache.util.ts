import { Cache } from "@nestjs/cache-manager";
import { instanceToPlain } from "class-transformer";

export async function cacheGetOrFill<T>(
	cache: Cache,
	key: string,
	onMiss: () => Promise<T>,
): Promise<T> {
	const value: Record<string, any> | undefined = await cache.get(key);
	if (value !== undefined) return value as T;

	const newValue = await onMiss();
	await cache.set(key, instanceToPlain<T>(newValue));

	return newValue;
}
