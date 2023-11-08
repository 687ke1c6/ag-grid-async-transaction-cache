# ag-grid-async-transaction-cache

To create the cache for a `GridApi`, call `createRowCache(api)` after the `onGridReady` event is fired.

```typescript
import {createRowCache} from '@00ag4cd1/ag-grid-async-transaction-cache';

/** GridOptions.onGridReady callback */
function onGridReady({api}: GridReadyEvent<TData>) {
    createRowCache(api, { getId: (data) => data.id });
}
```

From this point on any calls to `GridApi.applyTransactionAsync()` will populate the cache, and be made available with `getRow(id)`.

```typescript
import {getRowCache} from '@00ag4cd1/ag-grid-async-transaction-cache';

function subscribeToServer(api: GridApi<TData>) {
    const rowCache = getRowCache(api);
    serverApi /** mock server */
        .subscribe(message => {
            if (message.type === 'ADD_MESSAGE') {
                const rowData: TData = message.row;
                api.applyTransactionAsync({add: [rowData]});
            }
            if (message.type === 'UPDATE_MESSAGE') {
                // First consult the cache for the full row, otherwise call getRowNode(id). 
                // Merge full with partial 
                const rowData: Partial<TData> = message.row;
                const fullRowData = rowCache.getRow(rowData.id) ?? api.getRowNode(rowData.id)?.data;
                const mergedRow = Object.assign({}, fullRowData, rowData);
                api.applyTrasactionAsync({update: [mergedRow]});
            }
        })
}

```

## Why use an async-transaction-cache?

When using the Ag-Grid async transaction api in a high frequency environment, an update can be applied immediately after the row has been added, and even before it has been rendered.
This is because the api requires full (non-partial) rows for both adding and updating in a transaction.

```typescript
export interface RowDataTransaction<TData = any> {
    /** Index to add rows */
    addIndex?: number | null;
    /** Rows to add */
    add?: TData[] | null;
    /** Rows to remove */
    remove?: TData[] | null;
    /** Rows to update */
    update?: TData[] | null;
}
```

But in the _update_ case it might be that only partials are available to you. This would make sense if high frequency updates are streamed from a server as partials to save on network usage. But a _"full row"_ is required to satisfy the `applyTransactionAsync()` api, not just a partial row. In this case it makes sense to get the full row from the grid using `getRowNode(id)`, and do some casual merging before using the api to update the grid. But because the api is "async", in that rows are only rendered after `asyncTransactionWaitMillis` has elapsed, the full row might not yet be available (or up to date) when using `getRowNode(id)`.

This is where the cache becomes convenient. It will simply keep a copy of the latest version of a transaction row (add/update) by id. When looking for a full row that might not yet be rendered in the grid, consult the cache first. If the row does not exist in the cache, then it has been rendered and will be availalbe using `getRowNode(id)`.
