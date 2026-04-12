type ToastType = "success" | "error";

let showToastFn: ((message: string, type?: ToastType) => void) | null = null;

let queue: { message: string; type: ToastType }[] = [];

export function registerToast(fn: (message: string, type?: ToastType) => void) {

    showToastFn = fn;

    queue.forEach((t) => fn(t.message, t.type));
    queue = [];
}

export function toast(message: string, type: ToastType = "error") {
    console.log("Intentando mostrar toast:", message);

    if (!showToastFn) {
        console.warn("Toast no registrado aún, guardando en cola");
        queue.push({ message, type });
        return;
    }

    showToastFn(message, type);
}