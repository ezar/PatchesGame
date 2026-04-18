import './style.css';
import { loadPuzzle } from './engine';
import { setupEvents } from './ui';
import { loadLevel } from './storage';

function init(): void {
  setupEvents();
  loadPuzzle(loadLevel()); // restore last played level

  // Open rules card on desktop, collapsed on mobile
  const rules = document.getElementById('rules-card') as HTMLDetailsElement | null;
  if (rules && window.innerWidth >= 520) rules.open = true;

  document.body.style.transition = 'opacity 0.25s ease';
  document.body.style.opacity = '1';
}

init();
