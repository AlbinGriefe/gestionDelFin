let logoutFn: (() => Promise<void>) | null = null;

export function registerLogout(fn: () => Promise<void>) {
  logoutFn = fn;
}

export async function triggerLogout() {
  if (logoutFn) {
    await logoutFn();
  }
}
