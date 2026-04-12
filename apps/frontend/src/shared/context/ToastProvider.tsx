import { useState, useEffect, useRef, useCallback } from "react";
import { ToastContext } from "./toast.context";
import type { ToastType } from "./toast.context";
import { registerToast } from "../services/toastService";

type Toast = {
    id: number;
    message: string;
    type: ToastType;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const idRef = useRef(0);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = idRef.current++;

        setToasts((prev) => [...prev, { id, message, type }]);

        if (type !== "error") {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        }
    }, []);

    useEffect(() => {
        registerToast(showToast);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div className="fixed top-5 right-5 space-y-2 z-50">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-2 rounded text-white flex justify-between items-center ${toast.type === "error" ? "bg-red-500" : "bg-green-500"
                            }`}
                    >
                        <span>{toast.message}</span>

                        <button
                            onClick={() =>
                                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                            }
                            className="ml-4 text-sm"
                        >
                            ✖
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}