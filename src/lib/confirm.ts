export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning';
};

export type ConfirmRequest = ConfirmOptions & { resolve: (accepted: boolean) => void };

let activeHandler: ((request: ConfirmRequest) => void) | null = null;

export function registerConfirmHandler(handler: (request: ConfirmRequest) => void) {
  activeHandler = handler;
  return () => { if (activeHandler === handler) activeHandler = null; };
}

export function confirmRio(options: ConfirmOptions): Promise<boolean> {
  // Fail closed if the confirmation UI is unavailable; never execute a destructive action silently.
  if (typeof window === 'undefined' || !activeHandler) return Promise.resolve(false);
  return new Promise(resolve => activeHandler?.({ ...options, resolve }));
}
