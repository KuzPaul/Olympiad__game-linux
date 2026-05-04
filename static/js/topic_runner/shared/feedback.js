/**
 * @param {'ok'|'bad'} mode
 * @param {{ intense?: boolean, strong?: boolean }} [opts]
 */
export function pulseFeedback(mode, opts = {}) {
  const shell = document.querySelector('.game-shell');
  if (!shell) return;
  const { intense = false, strong = false } = opts;
  shell.classList.remove('feedback-ok', 'feedback-bad', 'feedback-bad-intense', 'feedback-ok-strong');
  void shell.offsetWidth;
  let cls = mode === 'ok' ? 'feedback-ok' : 'feedback-bad';
  if (mode === 'bad' && intense) cls = 'feedback-bad-intense';
  if (mode === 'ok' && strong) cls = 'feedback-ok-strong';
  shell.classList.add(cls);
  const ms = mode === 'bad' && intense ? 820 : mode === 'ok' && strong ? 620 : 480;
  window.setTimeout(() => {
    shell.classList.remove('feedback-ok', 'feedback-bad', 'feedback-bad-intense', 'feedback-ok-strong');
  }, ms);
}

/**
 * @param {'ok'|'bad'} mode
 * @param {{ intense?: boolean, strong?: boolean }} [opts]
 */
export function spawnBurst(app, mode = 'ok', opts = {}) {
  const { intense = false, strong = false } = opts;
  const burst = document.createElement('div');
  burst.className = `burst ${mode}${intense ? ' burst-intense' : ''}${strong ? ' burst-strong' : ''}`;
  let count = 16;
  if (intense) count = 34;
  else if (strong) count = 26;
  const spread = intense ? 280 : 220;
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('span');
    spark.style.setProperty('--dx', `${Math.round(Math.random() * spread - spread / 2)}px`);
    spark.style.setProperty('--dy', `${Math.round(Math.random() * spread - spread / 2)}px`);
    spark.style.setProperty('--delay', `${(Math.random() * 0.22).toFixed(2)}s`);
    burst.appendChild(spark);
  }
  app.appendChild(burst);
  window.setTimeout(() => burst.remove(), intense ? 1150 : strong ? 1000 : 950);
}
