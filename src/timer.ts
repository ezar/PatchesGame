let interval: ReturnType<typeof setInterval> | null = null;

function format(elapsed: number): string {
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function startTimer(startTime: number): void {
  stopTimer();
  const el = document.getElementById('timer');
  if (!el) return;
  const update = () => {
    el.textContent = format(Math.floor((Date.now() - startTime) / 1000));
  };
  update();
  interval = setInterval(update, 1000);
}

export function stopTimer(): void {
  if (interval !== null) { clearInterval(interval); interval = null; }
}

export function getElapsedStr(startTime: number): string {
  return format(Math.floor((Date.now() - startTime) / 1000));
}
