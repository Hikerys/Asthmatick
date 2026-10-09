import { App as CapApp } from "@capacitor/app";

export type BackHandler = () => boolean;

const backHandlers: BackHandler[] = [];

/**
 * Register a back handler (e.g. for modal sheets, open dialogs).
 * Handlers are evaluated in LIFO order (newest/topmost first).
 * If a handler returns true, the back action was consumed.
 * Returns an unregister function.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  backHandlers.push(handler);
  return () => {
    const idx = backHandlers.lastIndexOf(handler);
    if (idx !== -1) {
      backHandlers.splice(idx, 1);
    }
  };
}

/**
 * Try to trigger the topmost back handler.
 * Returns true if any handler handled the back action.
 */
export function triggerBack(): boolean {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    const handler = backHandlers[i];
    if (handler()) {
      return true;
    }
  }
  return false;
}
