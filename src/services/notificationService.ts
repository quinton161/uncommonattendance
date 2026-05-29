const STORAGE_KEY = 'uncommon_notifications_enabled';
const PROMPT_KEY = 'uncommon_notifications_prompted';

export const notificationService = {
  isEnabled(): boolean {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v !== 'false';
    } catch {
      return true;
    }
  },

  setEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  },

  wasPermissionPrompted(): boolean {
    try {
      return localStorage.getItem(PROMPT_KEY) === '1';
    } catch {
      return false;
    }
  },

  markPermissionPrompted(): void {
    try {
      localStorage.setItem(PROMPT_KEY, '1');
    } catch {
      /* ignore */
    }
  },

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  sendNotification(title: string, body: string, icon: string = '/favicon.ico'): void {
    if (!this.isEnabled()) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon,
          silent: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Failed to send browser notification:', error);
      }
    }
  },
};
