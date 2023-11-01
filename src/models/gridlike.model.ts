export interface GridApiLike<TData> {
    getRowNode(id: string): {data?: TData} | undefined;
    applyTransactionAsync: (rowDataTransaction: RowDataTransactionLike<TData>, callback?: (res: RowNodeTransactionLike<TData>) => void) => void;
}

interface IRowNodeLike<TData> {
    data?: TData;
}

export interface RowDataTransactionLike<TData> {
    addIndex?: number | null;
    add?: TData[] | null;
    remove?: TData[] | null;
    update?: TData[] | null;
}

export interface RowNodeTransactionLike<TData> {
    add?: IRowNodeLike<TData>[] | null;
    remove?: IRowNodeLike<TData>[] | null;
    update?: IRowNodeLike<TData>[] | null;
}