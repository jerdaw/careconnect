import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("useLocalStorage Hook", () => {
    beforeEach(() => {
        // Ensure localStorage is properly mocked if broken in the environment
        if (typeof window.localStorage.clear !== 'function') {
            const mockStorage: Record<string, string> = {};
            (window as any).localStorage = {
                getItem: (key: string) => mockStorage[key] || null,
                setItem: (key: string, value: string) => { mockStorage[key] = value },
                removeItem: (key: string) => { delete mockStorage[key] },
                clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) },
                length: 0,
                key: (index: number) => Object.keys(mockStorage)[index] || null,
            };
        }
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it("should return the initial value when no value is in localStorage", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
        expect(result.current[0]).toBe("initial");
    });

    it("should return the value from localStorage if it exists", () => {
        window.localStorage.setItem("test-key", JSON.stringify("stored-value"));
        const { result } = renderHook(() => useLocalStorage("test-key", "initial"));
        expect(result.current[0]).toBe("stored-value");
    });

    it("should update localStorage when the state changes", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

        act(() => {
            result.current[1]("new-value");
        });

        expect(result.current[0]).toBe("new-value");
        expect(window.localStorage.getItem("test-key")).toBe(JSON.stringify("new-value"));
    });

    it("should clear localStorage when calling remove", () => {
        window.localStorage.setItem("test-key", JSON.stringify("stored-value"));
        const { result } = renderHook(() => useLocalStorage("test-key", "initial"));

        act(() => {
            result.current[2](); // remove function
        });

        expect(result.current[0]).toBe("initial");
        expect(window.localStorage.getItem("test-key")).toBeNull();
    });

    it("should handle complex objects", () => {
        const initialObj = { a: 1, b: "test" };
        const { result } = renderHook(() => useLocalStorage("obj-key", initialObj));

        const newObj = { a: 2, b: "updated" };
        act(() => {
            result.current[1](newObj);
        });

        expect(result.current[0]).toEqual(newObj);
        expect(JSON.parse(window.localStorage.getItem("obj-key")!)).toEqual(newObj);
    });
});
