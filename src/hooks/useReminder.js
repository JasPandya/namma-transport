import { useState, useCallback, useEffect, useRef } from 'react';
import useNotification from './useNotification';

export default function useReminder() {
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem('metro-reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const timersRef = useRef({});
  const { permission, requestPermission, sendNotification } = useNotification();

  useEffect(() => {
    localStorage.setItem('metro-reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    reminders.forEach((reminder) => {
      if (reminder.active && !timersRef.current[reminder.id]) {
        scheduleTimer(reminder);
      }
    });

    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const scheduleTimer = useCallback(
    (reminder) => {
      const now = Date.now();
      const triggerAt = reminder.triggerAt;
      const delay = triggerAt - now;

      if (delay <= 0) {
        setReminders((prev) =>
          prev.map((r) => (r.id === reminder.id ? { ...r, active: false, fired: true } : r))
        );
        return;
      }

      timersRef.current[reminder.id] = setTimeout(() => {
        sendNotification('Namma Metro Reminder', {
          body: `Your train to ${reminder.destination} arrives at ${reminder.stationName} in 10 minutes! (${reminder.scheduledTime})`,
          tag: reminder.id,
          requireInteraction: true,
        });
        setReminders((prev) =>
          prev.map((r) => (r.id === reminder.id ? { ...r, active: false, fired: true } : r))
        );
        delete timersRef.current[reminder.id];
      }, delay);
    },
    [sendNotification]
  );

  const addReminder = useCallback(
    async (train, stationName) => {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }

      const now = Date.now();
      const triggerAt = now + (train.eta - 10) * 60 * 1000;

      if (triggerAt <= now) {
        return null;
      }

      const reminder = {
        id: `reminder-${train.id}-${Date.now()}`,
        trainId: train.id,
        line: train.line,
        lineName: train.lineName,
        destination: train.destination,
        stationName,
        scheduledTime: train.scheduledTime,
        eta: train.eta,
        triggerAt,
        createdAt: now,
        active: true,
        fired: false,
      };

      setReminders((prev) => [...prev, reminder]);
      scheduleTimer(reminder);
      return reminder;
    },
    [permission, requestPermission, scheduleTimer]
  );

  const removeReminder = useCallback((reminderId) => {
    if (timersRef.current[reminderId]) {
      clearTimeout(timersRef.current[reminderId]);
      delete timersRef.current[reminderId];
    }
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
  }, []);

  const activeReminders = reminders.filter((r) => r.active);
  const firedReminders = reminders.filter((r) => r.fired);

  return { reminders, activeReminders, firedReminders, addReminder, removeReminder };
}
