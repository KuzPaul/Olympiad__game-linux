export function initClassification(ctx) {
  const {
    topic,
    app,
    state,
    finish,
    updateMeta,
    addCombo,
    setMessage,
    pulseFeedback,
    burst,
    escapeHtml,
    shuffle,
    createAmbientLayer,
    createHud,
    trackMissionProgress,
  } = ctx;

  const items = shuffle(topic.items);
  const results = [];
  let index = 0;
  let itemTimer = null;
  let itemStartTs = 0;
  const itemLimitMs = 5800;

  app.innerHTML = '';
  app.appendChild(createAmbientLayer('Конвейер модулей', 'classification'));
  app.appendChild(createHud('<div class="hud-pill">Поток <strong id="lane-flow-value">1</strong></div>'));
  app.insertAdjacentHTML(
    'beforeend',
    `
      <div class="arcade-classification-shell">
        <div class="reactor-gauge">
          <div class="reactor-gauge-label">Стабильность сектора</div>
          <div class="reactor-gauge-track"><div class="reactor-gauge-fill" id="item-pressure"></div></div>
        </div>
        <div class="conveyor-stage">
          <div class="conveyor-lane lane-left"></div>
          <div class="conveyor-lane lane-center"></div>
          <div class="conveyor-lane lane-right"></div>
          <div class="module-capsule" id="module-capsule"></div>
        </div>
        <div class="lane-buttons" id="lane-buttons"></div>
        <div class="resolved-row" id="resolved-row"></div>
      </div>
    `
  );

  const capsule = document.getElementById('module-capsule');
  const laneButtons = document.getElementById('lane-buttons');
  const resolvedRow = document.getElementById('resolved-row');
  const pressureEl = document.getElementById('item-pressure');
  const flowEl = document.getElementById('lane-flow-value');

  topic.categories.forEach((category, idx) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lane-btn lane-${idx + 1}`;
    button.innerHTML = `<span>${escapeHtml(category)}</span>`;
    button.addEventListener('click', () => pickCategory(category));
    laneButtons.appendChild(button);
  });

  function updatePressure() {
    if (state.completed || index >= items.length) return;
    const elapsed = Date.now() - itemStartTs;
    const ratio = 1 - (elapsed / itemLimitMs);
    pressureEl.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
    pressureEl.classList.toggle('danger', ratio <= 0.28);
    if (elapsed >= itemLimitMs) {
      pickCategory('__timeout__');
    }
  }

  function showItem() {
    if (index >= items.length) {
      finish({ mode: 'classification-arcade', results });
      return;
    }
    const item = items[index];
    flowEl.textContent = String(index + 1);
    capsule.className = 'module-capsule spawn';
    capsule.innerHTML = `
        <div class="capsule-tag">МОДУЛЬ ${index + 1}</div>
        <strong>${escapeHtml(item.label)}</strong>
      `;
    window.setTimeout(() => capsule.classList.remove('spawn'), 300);
    itemStartTs = Date.now();
    clearInterval(itemTimer);
    itemTimer = window.setInterval(updatePressure, 100);
    updatePressure();
  }

  function pickCategory(chosen) {
    if (state.completed || index >= items.length) return;
    clearInterval(itemTimer);
    const item = items[index];
    const isCorrect = chosen === item.category;
    state.step += 1;
    if (isCorrect) state.score += 1;
    addCombo(isCorrect);
    updateMeta();
    pulseFeedback(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });
    burst(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });

    capsule.classList.add(isCorrect ? 'launch-ok' : 'launch-bad');
    const card = document.createElement('div');
    card.className = `resolved-card ${isCorrect ? 'resolved-ok' : 'resolved-bad'}`;
    card.innerHTML = `
        <strong>${escapeHtml(item.label)}</strong>
        <span>${isCorrect ? `Ушёл в сектор: ${escapeHtml(item.category)}` : 'Сбой маршрута · попробуй другой сектор.'}</span>
      `;
    resolvedRow.prepend(card);

    results.push({ label: item.label, chosen, correct: item.category, ok: isCorrect });
    trackMissionProgress({ mode: 'classification', results: results.slice(), step: state.step });
    setMessage(
      isCorrect
        ? `Модуль <strong>${escapeHtml(item.label)}</strong> классифицирован верно — конвейер стабилен.`
        : `Модуль <strong>${escapeHtml(item.label)}</strong> ушёл не туда. Сектор пересчитан, продолжай.`,
      isCorrect ? 'success' : 'error'
    );

    index += 1;
    window.setTimeout(showItem, 520);
  }

  showItem();
}
