import { useState, useCallback, useEffect } from 'react';

export default function useNotification() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const sendNotification = useCallback(
    (title, options = {}) => {
      if (permission !== 'granted') return null;
      const notification = new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options,
      });
      return notification;
    },
    [permission]
  );

  return { permission, requestPermission, sendNotification };
}
