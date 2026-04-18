import './style.css';
import { loadPuzzle } from './engine';
import { setupEvents } from './ui';
import { loadLevel } from './storage';

function init(): void {
  setupEvents();
  loadPuzzle(loadLevel()); // restore last played level
  document.body.style.transition = 'opacity 0.25s ease';
  document.body.style.opacity = '1';
}

init();
