import { GridApiLike } from "./gridlike.model";
import { ObjKey } from "./util.model";

export interface RowCache<TApi extends GridApiLike<TData>, TData> {
    getRow: (id: ObjKey) => TData | undefined;
    applyTransactionAsync: TApi['applyTransactionAsync'];
    count: () => number;
    clear: () => void;
}

export interface RowCacheOptions<TData> {
    patch?: boolean;
    getId: (row: TData) => ObjKey;
}
