import React from 'react';
import { toast, ToastOptions, Id } from 'react-toastify';
import { UncommonToastBody } from '../components/Common/UncommonToast';

// Keep track of active toasts to prevent duplicates
const activeToasts = new Map<string, { id: Id; timestamp: number }>();

// Debounce time in milliseconds
const DEBOUNCE_TIME = 1000;

interface CustomToastOptions extends ToastOptions {
  preventDuplicate?: boolean;
  debounceTime?: number;
  labelOverride?: string;
}

const createUniqueToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  options: CustomToastOptions = {}
): Id | null => {
  const { preventDuplicate = true, debounceTime = DEBOUNCE_TIME, labelOverride, ...toastOptions } = options;
  
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
  
  const body = React.createElement(UncommonToastBody, { variant: type, message, labelOverride });
  const onClose = () => {
    if (preventDuplicate) {
      activeToasts.delete(toastKey);
    }
    toastOptions.onClose?.();
  };

  const commonOpts: ToastOptions = {
    ...toastOptions,
    toastId: toastKey,
    icon: false,
    className: 'uncommon-toast-outer',
    onClose,
  };

  let toastId: Id;
  switch (type) {
    case 'success':
      toastId = toast.success(body, commonOpts);
      break;
    case 'error':
      toastId = toast.error(body, commonOpts);
      break;
    case 'info':
      toastId = toast.info(body, commonOpts);
      break;
    case 'warning':
      toastId = toast.warning(body, commonOpts);
      break;
    default:
      toastId = toast.info(body, commonOpts);
  }
  
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

  // Dismiss a specific toast by ID or key
  dismiss: (id?: Id) => {
    toast.dismiss(id);
    if (typeof id === 'string') {
      activeToasts.delete(id);
    }
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
