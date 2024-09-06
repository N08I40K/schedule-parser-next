type Nullable<T> = {
	[P in keyof T]: T[P] | null | Array<any>;
};

export function convertToPrismaInput<T>(dto: Nullable<T>): T {
	return Object.entries(dto)
		.filter((x) => x[1] !== undefined)
		.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) as T;
}
