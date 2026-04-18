const KEY_LAST   = 'patches_last_played';
const KEY_ENABLED = 'patches_notif_enabled';

export function markPlayed(): void {
  localStorage.setItem(KEY_LAST, String(Date.now()));
}

export function notificationsEnabled(): boolean {
  return !!localStorage.getItem(KEY_ENABLED) &&
    'Notification' in window &&
    Notification.permission === 'granted';
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'denied') return false;

  const result = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();

  if (result === 'granted') {
    localStorage.setItem(KEY_ENABLED, '1');
    updateBellButton(true);
    return true;
  }
  return false;
}

/** Call on app start — shows a notification if user hasn't played in 20+ hours. */
export function checkReminder(): void {
  if (!notificationsEnabled()) return;
  const last = Number(localStorage.getItem(KEY_LAST) || '0');
  if ((Date.now() - last) < 20 * 60 * 60 * 1000) return;

  new Notification('Patches 🧩', {
    body: 'Ready for today\'s puzzle?',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
}

export function updateBellButton(enabled: boolean): void {
  const btn = document.getElementById('btn-bell');
  if (!btn) return;
  btn.textContent = enabled ? '🔔 Reminders on' : '🔕 Daily reminder';
  btn.classList.toggle('bell-on', enabled);
}
