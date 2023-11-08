# ag-grid-async-transaction-cache

## Why use an async-transaction-cache?

The Ag-Grid async transaction api does not allow partial updates. To get the full row first, you might try `getRowNode(id)`, but the row might not yet be rendered to the grid at this point, or it might not be up to date as `asyncTransactionWaitMillis` has not yet elapsed.

This is where the cache becomes convenient. It will simply keep a copy of the latest version of a transaction row (add/update) by id. When looking for a full row that might not yet be rendered in the grid, consult the cache first. If the row does not exist in the cache, then it has been rendered and will be availalbe using `getRowNode(id)`.

## Usage

To create the cache for a `GridApi`, call `createRowCache(api)` after the `onGridReady` event is fired.

```typescript
import {createRowCache} from 'ag-grid-async-transaction-cache';

/** GridOptions.onGridReady callback */
function onGridReady({api}: GridReadyEvent<TData>) {
    createRowCache(api, { getId: (data) => data.id });
}
```

From this point on any calls to `GridApi.applyTransactionAsync()` will populate the cache, and be made available with `getRow(id)`.

```typescript
import {getRowCache} from 'ag-grid-async-transaction-cache';

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
