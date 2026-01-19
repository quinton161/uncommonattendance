import { toast, ToastOptions, Id } from 'react-toastify';

// Keep track of active toasts to prevent duplicates
const activeToasts = new Map<string, { id: Id; timestamp: number }>();

// Debounce time in milliseconds
const DEBOUNCE_TIME = 1000;

interface CustomToastOptions extends ToastOptions {
  preventDuplicate?: boolean;
  debounceTime?: number;
}

const createUniqueToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  options: CustomToastOptions = {}
): Id | null => {
  const { preventDuplicate = true, debounceTime = DEBOUNCE_TIME, ...toastOptions } = options;
  
  // Create a unique key for this message
  const toastKey = `${type}-${message}`;
  const now = Date.now();
  
  // Check if this toast is already active or was recently shown
  if (preventDuplicate && activeToasts.has(toastKey)) {
    const existing = activeToasts.get(toastKey)!;
    
    // If the toast was shown recently (within debounce time), don't show it again
    if (now - existing.timestamp < debounceTime) {
      return existing.id;
    }
    
    // If it's an old toast, dismiss it first
    toast.dismiss(existing.id);
    activeToasts.delete(toastKey);
  }
  
  // Create the toast with onClose callback to remove from active set
  const toastId = toast[type](message, {
    ...toastOptions,
    toastId: toastKey, // Use the key as toastId to prevent react-toastify duplicates
    onClose: () => {
      if (preventDuplicate) {
        activeToasts.delete(toastKey);
      }
      if (toastOptions.onClose) {
        toastOptions.onClose();
      }
    }
  });
  
  // Add to active toasts with timestamp
  if (preventDuplicate && toastId) {
    activeToasts.set(toastKey, { id: toastId, timestamp: now });
  }
  
  return toastId;
};

export const uniqueToast = {
  success: (message: string, options?: CustomToastOptions) => 
    createUniqueToast(message, 'success', options),
  
  error: (message: string, options?: CustomToastOptions) => 
    createUniqueToast(message, 'error', options),
  
  info: (message: string, options?: CustomToastOptions) => 
    createUniqueToast(message, 'info', options),
  
  warning: (message: string, options?: CustomToastOptions) => 
    createUniqueToast(message, 'warning', options),
  
  // Clear all active toasts tracking (useful for cleanup)
  clearActive: () => {
    activeToasts.clear();
  },
  
  // Dismiss all active toasts
  dismissAll: () => {
    toast.dismiss();
    activeToasts.clear();
  },
  
  // Clean up old toasts (remove entries older than 5 minutes)
  cleanup: () => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    Array.from(activeToasts.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > fiveMinutes) {
        activeToasts.delete(key);
      }
    });
  }
};

export default uniqueToast;
