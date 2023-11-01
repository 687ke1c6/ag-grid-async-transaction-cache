import { GridApiLike } from "./gridlike.model";

export interface RowCache<TApi extends GridApiLike<TData>, TData> {
    getRow: (id: string) => TData | undefined;
    applyTransactionAsync: TApi['applyTransactionAsync'];
    count: () => number;
    clear: () => void;
}

export interface RowCacheOptions<TData> {
    patch?: boolean;
    getId: (row: TData) => (string | number | symbol);
}
