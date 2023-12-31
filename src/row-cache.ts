import { GridApiLike, RowDataTransactionLike, RowNodeTransactionLike } from "./models/gridlike.model";
import { RowCache, RowCacheOptions } from "./models/row-cache.model";
import { ObjKey } from "./models/util.model";

const cache_key = '__row_cache__';

type Generic<T> = T extends GridApiLike<infer U> ? U : never;
type CacheType<TData> = Record<ObjKey, readonly [number, TData]>;

export const getRowCache = <TApi extends GridApiLike<TData>, TData = Generic<TApi>>(gridApi: TApi): RowCache<TApi, TData> =>
    (gridApi as any)[cache_key];

export const createRowCache = <TApi extends GridApiLike<TData>, TData = Generic<TApi>>(gridApi: TApi, options: RowCacheOptions<TData>) => {
    const localOptions = { patch: true, ...options};
    const cache: CacheType<TData> = {};

    const cacheRows = (rows: TData[]) => {
        const context = rows.reduce<CacheType<TData>>((acc, row) => {
            const id = localOptions.getId(row);
            const ver = cache[id]?.[0] ?? -1;
            const val = [ver + 1, row] as const;
            return {
                ...acc,
                [id]: val
            };
        }, {});

        Object.entries(context).map(([id, cacheRow]) => {
            cache[id] = cacheRow;
        });

        return context;
    }

    const invalidate = (cacheContext: CacheType<TData>) =>
        Object.entries(cacheContext).map(([id, [version]]) => {
            if (cache[id]?.[0] === version) {
                delete cache[id];
            }
        });

    const original_applyTransactionAsync = gridApi.applyTransactionAsync.bind(gridApi);

    const rowCache: RowCache<TApi, TData> = {
        getRow: (id: ObjKey) => cache[id]?.[1],
        applyTransactionAsync: (rowDataTransaction: RowDataTransactionLike<TData>, callback?: (res: RowNodeTransactionLike<TData>) => void | undefined) => {
            const context = cacheRows((rowDataTransaction.add || []).concat(rowDataTransaction.update || []));
            original_applyTransactionAsync(rowDataTransaction, (committedRowDataTransaction: RowNodeTransactionLike<TData>) => {
                invalidate(context);
                callback?.(committedRowDataTransaction);
            });
        },
        count: () => Object.keys(cache).length,
        clear: () => Object.keys(cache).forEach(key => delete cache[key])
    };

    if (localOptions.patch) {
        gridApi.applyTransactionAsync = rowCache.applyTransactionAsync;
    }

    (gridApi as any)[cache_key] = rowCache;
    return rowCache;
}
