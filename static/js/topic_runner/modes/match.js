export function initMatch(ctx) {
  const {
    topic,
    app,
    state,
    stepEl,
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
  } = ctx;

  const pairs = shuffle(topic.pairs.map((pair, id) => ({ ...pair, id })));
  const results = [];
  let index = 0;

  app.innerHTML = '';
  app.appendChild(createAmbientLayer('Взлом хранилища прав доступа', 'match'));
  app.appendChild(createHud('<div class="hud-pill">Открыто замков <strong id="lock-opened-value">0</strong></div>'));
  app.insertAdjacentHTML(
    'beforeend',
    `
      <div class="vault-shell">
        <div class="vault-door-grid">
          ${Array.from({ length: pairs.length })
            .map((_, i) => `<div class="vault-lock ${i === 0 ? 'active' : ''}" data-lock-index="${i}"></div>`)
            .join('')}
        </div>
        <div class="vault-mission" id="vault-mission"></div>
      </div>
    `
  );

  const mission = document.getElementById('vault-mission');
  const openedEl = document.getElementById('lock-opened-value');

  function renderRound() {
    const current = pairs[index];
    const decoys = shuffle(topic.pairs.filter((pair) => pair.right !== current.right))
      .slice(0, 3)
      .map((pair) => pair.right);
    const options = shuffle([current.right, ...decoys]);
    stepEl.textContent = `${index + 1}/${pairs.length}`;
    mission.innerHTML = `
        <div class="question-header">
          <div class="question-kicker">Замок ${index + 1}</div>
          <div class="question-tip">Соедини термин и назначение, чтобы открыть секцию</div>
        </div>
        <div class="cipher-card">
          <div class="cipher-left">
            <div class="cipher-label">Фрагмент</div>
            <code>${escapeHtml(current.left)}</code>
          </div>
          <div class="cipher-right arcade-options compact">
            ${options
              .map(
                (option) => `
              <button class="arcade-answer vault-answer" type="button" data-value="${escapeHtml(option)}">
                <span>${escapeHtml(option)}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;

    mission.querySelectorAll('.vault-answer').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.completed) return;
        const picked = button.textContent.trim();
        const isCorrect = picked === current.right;
        state.step = index + 1;
        if (isCorrect) state.score += 1;
        addCombo(isCorrect);
        updateMeta();
        pulseFeedback(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });
        burst(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });

        results.push({ left: current.left, picked, right: current.right, ok: isCorrect });
        mission.querySelectorAll('.vault-answer').forEach((btn) => {
          btn.disabled = true;
          if (btn.textContent.trim() === current.right) btn.classList.add('correct-outline');
        });
        button.classList.add(isCorrect ? 'correct' : 'incorrect');
        document.querySelector(`[data-lock-index="${index}"]`)?.classList.add(isCorrect ? 'opened' : 'broken');
        openedEl.textContent = String(results.filter((entry) => entry.ok).length);
        setMessage(
          isCorrect
            ? `Секция открыта: <strong>${escapeHtml(current.left)}</strong> — замок снят, переходи дальше.`
            : 'Замок не поддался. Сигнал тревоги по шифру — выбери другой вариант в следующем раунде.',
          isCorrect ? 'success' : 'error'
        );

        window.setTimeout(() => {
          index += 1;
          if (index >= pairs.length) finish({ mode: 'vault-match', results });
          else {
            document.querySelector(`[data-lock-index="${index}"]`)?.classList.add('active');
            renderRound();
          }
        }, 760);
      });
    });
  }

  renderRound();
}
