export function trimAll(str: string): string {
	return str.replace(/\s\s+/g, " ").trim();
}

export function toNormalString(data: any): string | null {
	if (typeof data === "number") data = data.toString();

	return typeof data === "string" &&
		data.length > 0 &&
		data.replaceAll(/[\s\n\r]/g, "").length > 0
		? data
		: null;
}
