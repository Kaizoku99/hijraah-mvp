
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from "react";

// A wrapper for "JSON.parse" to support "undefined" value
function parseJSON<T>(value: string | null): T | undefined {
    try {
        return value === "undefined" ? undefined : JSON.parse(value ?? "");
    } catch {
        console.log("parsing error on", { value });
        return undefined;
    }
}

export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState<T>(initialValue);

    // Hydrate from local storage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(parseJSON<T>(item) ?? initialValue);
            }
        } catch (error) {
            console.warn(`Error hydrating localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue: Dispatch<SetStateAction<T>> = useCallback(
        (value) => {
            try {
                setStoredValue((oldValue) => {
                    // Allow value to be a function so we have same API as useState
                    const valueToStore =
                        value instanceof Function ? value(oldValue) : value;

                    // Save to local storage
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));

                        // Dispatch a custom event so duplicate hooks across the app update
                        window.dispatchEvent(
                            new CustomEvent("local-storage", { detail: { key } })
                        );
                    }

                    return valueToStore;
                });
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key]
    );

    useEffect(() => {
        setStoredValue(() => {
            if (typeof window === "undefined") {
                return initialValue;
            }

            try {
                const item = window.localStorage.getItem(key);
                return item ? (parseJSON<T>(item) ?? initialValue) : initialValue;
            } catch (error) {
                console.warn(`Error reading localStorage key "${key}":`, error);
                return initialValue;
            }
        });
    }, [key, initialValue]);

    // Read the latest value from localStorage on mount and when key changes
    // and listen for changes in other tabs or duplicate hooks
    useEffect(() => {
        const handleStorageChange = (event: Event | CustomEvent) => {
            if (typeof window === "undefined") return;

            // Check if this is a custom event and if the key matches
            if (
                event instanceof CustomEvent &&
                event.detail?.key &&
                event.detail.key !== key
            ) {
                return;
            }

            try {
                const item = window.localStorage.getItem(key);
                const newValue = item
                    ? parseJSON<T>(item) ?? initialValue
                    : initialValue;
                setStoredValue(newValue);
            } catch (error) {
                console.warn(`Error reading localStorage key "${key}":`, error);
            }
        };

        // this is a custom event, triggered in writeValueToLocalStorage
        window.addEventListener("local-storage", handleStorageChange as EventListener);
        // this is a native event, triggered by other tabs
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("local-storage", handleStorageChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [key, initialValue]);

    return [storedValue, setValue];
}
