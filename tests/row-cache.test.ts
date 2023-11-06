import { getRowCache, createRowCache } from '../src/row-cache';
describe('row-cache tests', () => {
    it('Creating a row cache should return a rowCache object.', () => {
        const mockApi = {} as any;
        const cache = createRowCache(mockApi, { getId: jest.fn() });
        expect(cache).toBeTruthy();
    });

    it('applyTransactionAsync should cache adds and return the correct id on getRow().', () => {
        const mockApi = {
            applyTransactionAsync: jest.fn(),
            getRowNode: jest.fn()
        } as any;
        const cache = createRowCache(mockApi, { getId: (data: any) => data.id});
        cache.applyTransactionAsync({ add: [{ id: 'some-key', name: 'Warren Buffet', age: 81 }] });
        const row = cache.getRow('some-key');
        expect(row).toEqual({ id: 'some-key', name: 'Warren Buffet', age: 81 });
        expect(mockApi.getRowNode).toHaveBeenCalledTimes(0);
    });

    it('applyTransactionAsync with updates should cache updates', () => {
        const mockApi = {
            applyTransactionAsync: jest.fn(),
            getRowNode: jest.fn()
        } as any;
        const cache = createRowCache(mockApi, { getId: (data: any) => data.id});
        cache.applyTransactionAsync({ update: [{ id: 'some-key', name: 'Warren Buffet', age: 81 }] });
        const row = cache.getRow('some-key');
        expect(row).toEqual({ id: 'some-key', name: 'Warren Buffet', age: 81 });
        expect(mockApi.getRowNode).toHaveBeenCalledTimes(0);
    });

    it('After transactions have been committed, the cache should be clear.', () => {
        const mockApi = {
            applyTransactionAsync: jest.fn().mockImplementation((_transaction, callback) => { callback() }),
            getRowNode: jest.fn()
        } as any;

        const cache = createRowCache(mockApi, { getId: (data: any) => data.id});

        // in this example, callback is invoked immediately, clearing the context from cache.
        cache.applyTransactionAsync({ add: [{ id: 'some-key', name: 'Warren Buffet', age: 22 }] });
        expect(cache.count()).toBe(0);
    });

    it('After earlier rows have been committed to the grid, subsequent updates should exist in the cache.', () => {
        const mockApi = {
            applyTransactionAsync: jest.fn().mockImplementationOnce((_transaction, callback) => { callback() }),
            getRowNode: jest.fn()
        } as any;

        const cache = createRowCache(mockApi, { getId: (data: any) => data.id});

        cache.applyTransactionAsync({ add: [{ id: 'some-key', name: 'Warren Buffet', age: 22 }] });
        cache.applyTransactionAsync({ update: [{ id: 'some-key', name: 'Charlie Munger', age: 20 }] });
        expect(cache.getRow('some-key')).toEqual({ id: 'some-key', name: 'Charlie Munger', age: 20 })
    });
})