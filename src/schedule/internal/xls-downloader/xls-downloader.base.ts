export type XlsDownloaderResult = {
	fileData: ArrayBuffer;
	updateDate: string;
	etag: string;
	new: boolean;
	updateRequired: boolean;
};

export enum XlsDownloaderCacheMode {
	NONE = 0,
	SOFT, // читать кеш только если не был изменён etag.
	HARD, // читать кеш всегда, кроме случаев его отсутствия
}

export abstract class XlsDownloaderBase {
	public constructor(
		protected readonly url: string,
		protected readonly cacheMode = XlsDownloaderCacheMode.NONE,
	) {}

	public abstract downloadXLS(): Promise<XlsDownloaderResult>;

	public abstract getCachedXLS(): Promise<XlsDownloaderResult | null>;

	public abstract isUpdateRequired(): boolean;

	public abstract setPreparedData(preparedData: string): Promise<void>;

	public getCacheMode(): XlsDownloaderCacheMode {
		return this.cacheMode;
	}
}
