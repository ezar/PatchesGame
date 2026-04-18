const URL = 'https://precious-platypus-837e9b.netlify.app';

export async function shareResult(
  level: number,
  timeStr: string,
  hintsUsed: number,
): Promise<void> {
  const hints   = hintsUsed > 0 ? ` · ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}` : ' · no hints';
  const text    = `Patches Level ${level + 1} ✅\n🕐 ${timeStr}${hints}\n🔗 ${URL}`;

  // Web Share API (mobile native sheet)
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch { /* cancelled */ }
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback();
  } catch {
    prompt('Copy and share:', text);
  }
}

function showCopyFeedback(): void {
  const btn = document.getElementById('btn-share');
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = '✅ Copied!';
  setTimeout(() => { btn.textContent = orig; }, 2000);
}
