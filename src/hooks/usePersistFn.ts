import { useRef } from 'react';

export function usePersistFn<T extends (...args: any[]) => any>(fn: T) {
    const fnRef = useRef(fn);
    fnRef.current = fn;

    const persistFn = useRef<T>(undefined);
    if (!persistFn.current) {
        persistFn.current = function (this: any, ...args: any[]) {
            return fnRef.current!.apply(this, args);
        } as T;
    }

    return persistFn.current!;
}
