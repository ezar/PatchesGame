import './style.css';
import { loadPuzzle } from './engine';
import { setupEvents } from './ui';
import { loadLevel } from './storage';
import { checkReminder, notificationsEnabled, requestPermission, updateBellButton } from './notifications';

function init(): void {
  setupEvents();
  loadPuzzle(loadLevel());

  // Open rules card on desktop, collapsed on mobile
  const rules = document.getElementById('rules-card') as HTMLDetailsElement | null;
  if (rules && window.innerWidth >= 520) rules.open = true;

  // Notifications
  checkReminder();
  updateBellButton(notificationsEnabled());
  document.getElementById('btn-bell')?.addEventListener('click', async () => {
    const granted = await requestPermission();
    if (!granted) alert('Notifications are blocked. Enable them in your browser settings.');
  });

  document.body.style.transition = 'opacity 0.25s ease';
  document.body.style.opacity = '1';
}

init();
