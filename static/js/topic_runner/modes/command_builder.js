const ZOMBIE_SCENE_SVG = `
  <div class="zombie-stage" id="zombie-stage" aria-hidden="true">
    <div class="script-beam" id="script-beam"></div>
    <svg class="zombie-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="zskin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#7a9e6a"/>
          <stop offset="100%" style="stop-color:#4d6b42"/>
        </linearGradient>
      </defs>
      <g class="zombie-body">
        <ellipse cx="100" cy="118" rx="52" ry="58" fill="url(#zskin)" stroke="#2d3d28" stroke-width="2"/>
        <rect x="62" y="165" width="76" height="38" rx="10" fill="#3d5238" stroke="#2d3d28" stroke-width="1.5"/>
        <ellipse cx="72" cy="132" rx="14" ry="36" fill="url(#zskin)" transform="rotate(-20 72 132)"/>
        <ellipse cx="128" cy="132" rx="14" ry="36" fill="url(#zskin)" transform="rotate(20 128 132)"/>
      </g>
      <g class="zombie-head">
        <ellipse cx="100" cy="72" rx="58" ry="62" fill="url(#zskin)" stroke="#2d3d28" stroke-width="2"/>
        <ellipse cx="78" cy="64" rx="16" ry="18" fill="#f4f7f0"/>
        <ellipse cx="122" cy="62" rx="13" ry="16" fill="#e8f0e0"/>
        <circle cx="82" cy="66" r="6" fill="#8b1538"/>
        <circle cx="124" cy="64" r="5" fill="#6b0f2a"/>
        <path d="M72 92 Q100 108 128 92" fill="none" stroke="#2d3d28" stroke-width="3" stroke-linecap="round"/>
        <path d="M82 96 L88 104 M96 98 L100 108 M108 98 L112 106 M118 96 L124 104" stroke="#f0e8dc" stroke-width="2" stroke-linecap="round"/>
      </g>
      <g class="zombie-dead-face" opacity="0">
        <line x1="76" y1="58" x2="92" y2="74" stroke="#2d3d28" stroke-width="4" stroke-linecap="round"/>
        <line x1="92" y1="58" x2="76" y2="74" stroke="#2d3d28" stroke-width="4" stroke-linecap="round"/>
        <line x1="112" y1="56" x2="128" y2="72" stroke="#2d3d28" stroke-width="4" stroke-linecap="round"/>
        <line x1="128" y1="56" x2="112" y2="72" stroke="#2d3d28" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>
    <div class="zombie-terminal">
      <span class="zombie-prompt">$</span><span class="zombie-cursor">_</span>
    </div>
  </div>
`;

function spawnZombieEpicExplosion(stage) {
  const prev = stage.querySelector('.zombie-boom-fx');
  if (prev) prev.remove();
  const fx = document.createElement('div');
  fx.className = 'zombie-boom-fx';
  fx.setAttribute('aria-hidden', 'true');
  const n = 52;
  for (let i = 0; i < n; i += 1) {
    const s = document.createElement('span');
    const rot = (360 / n) * i + Math.random() * 14 - 7;
    s.style.setProperty('--rot', `${rot}deg`);
    s.style.setProperty('--dist', `${88 + Math.floor(Math.random() * 110)}px`);
    s.style.setProperty('--delay', `${(Math.random() * 0.14).toFixed(3)}s`);
    s.style.setProperty('--hue', `${100 + Math.floor(Math.random() * 80)}`);
    fx.appendChild(s);
  }
  stage.appendChild(fx);
  window.setTimeout(() => fx.remove(), 1200);
}

const THEMES = {
  network: {
    ambientLabel: 'Центр сетевой обороны',
    ambientMode: 'builder',
    hudPill: 'Узлы',
    shellClass: 'network-mode',
    sceneClass: 'network-scene',
    bankClass: 'network-bank',
    tokenClass: 'network-token',
    rowLabel: 'Канал',
    okHint: 'Команда собрана точно. Узел связи отвечает.',
    okMsg: 'Сетевой канал восстановлен.',
    badMsg: 'Пакеты не дошли. Команда составлена неверно.',
    finishMode: 'network-builder',
  },
  zombie: {
    ambientLabel: 'Арена зомби-процессов',
    ambientMode: 'zombie',
    hudPill: 'Зомби',
    shellClass: 'zombie-mode',
    sceneClass: 'zombie-scene',
    rowLabel: 'Волна',
    okHint: 'Команда сработала. Готовься к следующей волне.',
    okMsg: 'Зомби-процесс уничтожен.',
    badMsg: 'Фрагмент не совпал с эталоном. Проверь синтаксис bash и формулировку задания.',
    finishMode: 'zombie-script',
  },
};

export function initCommandBuilder(ctx, themeKey) {
  const T = THEMES[themeKey];
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

  const tasks = topic.tasks;
  const results = [];
  const levelOutcomes = [];
  let taskIndex = 0;

  app.innerHTML = '';
  app.appendChild(createAmbientLayer(T.ambientLabel, T.ambientMode));
  app.appendChild(createHud(`<div class="hud-pill">${T.hudPill} <strong id="builder-cleared-value">0</strong></div>`));
  const sceneBlock =
    themeKey === 'zombie'
      ? `
      <div class="builder-shell ${T.shellClass}">
        <div class="builder-scene">
          <div class="scene-grid"></div>
          <div class="scene-object ${T.sceneClass}">
            ${ZOMBIE_SCENE_SVG}
          </div>
        </div>
        <div class="builder-mission" id="builder-mission"></div>
      </div>
    `
      : `
      <div class="builder-shell ${T.shellClass}">
        <div class="builder-scene">
          <div class="scene-grid"></div>
          <div class="scene-object ${T.sceneClass}"></div>
        </div>
        <div class="builder-mission" id="builder-mission"></div>
      </div>
    `;
  app.insertAdjacentHTML('beforeend', sceneBlock);

  const mission = document.getElementById('builder-mission');
  const clearedEl = document.getElementById('builder-cleared-value');

  function resetZombieStage() {
    const stage = document.getElementById('zombie-stage');
    const beam = document.getElementById('script-beam');
    if (stage) {
      stage.classList.remove('zombie-dead', 'zombie-angry', 'script-strike', 'zombie-epic-detonate');
      stage.querySelector('.zombie-boom-fx')?.remove();
      const svg = stage.querySelector('.zombie-svg');
      if (svg) svg.classList.remove('is-dead');
    }
    if (beam) beam.textContent = '';
  }

  function renderNetworkTask() {
    const task = tasks[taskIndex];
    const selectedTokens = [];
    const answerLength = task.answer.length;
    let checked = false;
    stepEl.textContent = `${taskIndex + 1}/${tasks.length}`;

    mission.innerHTML = `
        <div class="question-header">
          <div class="question-kicker">${T.rowLabel} ${taskIndex + 1}</div>
          <div class="question-tip">Собери точную команду в нужном порядке</div>
        </div>
        <h3>${escapeHtml(task.scenario)}</h3>
        <div class="slot-rack" id="slot-rack"></div>
        <div class="token-bank ${T.bankClass}" id="token-bank"></div>
        <div class="builder-actions">
          <button type="button" class="secondary-btn small-btn" id="undo-token">Шаг назад</button>
          <button type="button" class="secondary-btn small-btn" id="clear-command">Очистить</button>
          <button type="button" class="primary-btn small-btn" id="check-command">Проверить</button>
        </div>
        <div class="builder-status muted" id="builder-status">Собери команду и нажми «Проверить».</div>
      `;

    const rack = document.getElementById('slot-rack');
    const tokenBank = document.getElementById('token-bank');
    const statusEl = document.getElementById('builder-status');
    const clearButton = document.getElementById('clear-command');
    const undoButton = document.getElementById('undo-token');
    const checkButton = document.getElementById('check-command');
    const buttonsByToken = [];

    function updateRack() {
      rack.innerHTML = Array.from({ length: answerLength })
        .map((_, idx) => {
          const token = selectedTokens[idx];
          return `<div class="command-slot ${token ? 'filled' : ''}">${token ? escapeHtml(token) : `<span>${idx + 1}</span>`}</div>`;
        })
        .join('');
    }

    const noisyTokens = shuffle(task.tokens);
    noisyTokens.forEach((token, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `token-btn ${T.tokenClass}`;
      if (idx % 4 === 0) button.classList.add('tilt');
      button.textContent = token;
      button.addEventListener('click', () => {
        if (checked || state.completed || selectedTokens.length >= answerLength || button.disabled) return;
        selectedTokens.push(token);
        button.disabled = true;
        button.classList.add('picked');
        updateRack();
      });
      tokenBank.appendChild(button);
      buttonsByToken.push(button);
    });

    clearButton.addEventListener('click', () => {
      if (checked || state.completed) return;
      selectedTokens.length = 0;
      buttonsByToken.forEach((button) => {
        button.disabled = false;
        button.classList.remove('picked');
      });
      updateRack();
    });

    undoButton.addEventListener('click', () => {
      if (checked || state.completed || !selectedTokens.length) return;
      const last = selectedTokens.pop();
      const button = buttonsByToken.find((entry) => entry.textContent === last && entry.disabled);
      if (button) {
        button.disabled = false;
        button.classList.remove('picked');
      }
      updateRack();
    });

    checkButton.addEventListener('click', () => {
      if (checked || state.completed) return;
      checked = true;
      const accepted = [task.answer, ...(task.accepted || [])];
      const isCorrect = accepted.some((variant) => JSON.stringify(variant) === JSON.stringify(selectedTokens));
      state.step = taskIndex + 1;
      if (isCorrect) state.score += 1;
      addCombo(isCorrect);
      updateMeta();
      pulseFeedback(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });
      burst(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });

      results.push({
        scenario: task.scenario,
        answer: selectedTokens.join(' '),
        correctAnswer: task.answer.join(' '),
        ok: isCorrect,
      });

      statusEl.textContent = isCorrect ? T.okHint : 'Сборка отклонена. Попробуй другую последовательность токенов.';
      statusEl.classList.remove('muted', 'success', 'error');
      statusEl.classList.add(isCorrect ? 'success' : 'error');
      clearedEl.textContent = String(results.filter((entry) => entry.ok).length);
      setMessage(isCorrect ? T.okMsg : T.badMsg, isCorrect ? 'success' : 'error');

      window.setTimeout(() => {
        taskIndex += 1;
        if (taskIndex >= tasks.length) finish({ mode: T.finishMode, results });
        else renderNetworkTask();
      }, 850);
    });

    updateRack();
  }

  function normalizeScript(raw) {
    return (raw || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  function renderZombieBashTask() {
    resetZombieStage();
    const task = tasks[taskIndex];
    let checked = false;
    stepEl.textContent = `${taskIndex + 1}/${tasks.length}`;
    const isFinalLevel = taskIndex === tasks.length - 1;

    mission.innerHTML = `
        <div class="question-header">
          <div class="question-kicker">${T.rowLabel} ${taskIndex + 1}</div>
          <div class="question-tip">1–2 строки кода bash; Enter — новая строка, проверка — кнопка или Ctrl+Enter</div>
        </div>
        <h3>${escapeHtml(task.scenario)}</h3>
        <label class="bash-input-label" for="bash-input">Код bash</label>
        <textarea class="bash-input" id="bash-input" autocomplete="off" spellcheck="false" rows="4"></textarea>
        <div class="builder-actions">
          <button type="button" class="secondary-btn small-btn" id="clear-command">Очистить</button>
          <button type="button" class="primary-btn small-btn" id="check-command">Проверить</button>
        </div>
        <div class="builder-status muted" id="builder-status">Введи код и нажми «Проверить» или Ctrl+Enter (⌘+Enter на Mac).</div>
      `;

    const inputEl = document.getElementById('bash-input');
    const statusEl = document.getElementById('builder-status');
    const clearButton = document.getElementById('clear-command');
    const checkButton = document.getElementById('check-command');

    clearButton.addEventListener('click', () => {
      if (checked || state.completed) return;
      inputEl.value = '';
      inputEl.focus();
    });

    function processAnswer() {
      if (checked || state.completed) return;
      checked = true;
      const typed = inputEl.value;
      const normalizedTyped = normalizeScript(typed);
      const accepted = [task.answer, ...(task.accepted || [])];
      let isCorrect = accepted.some((variant) => normalizeScript(variant) === normalizedTyped);
      const previousAllCorrect = levelOutcomes.every(Boolean);
      const blockedByPrevious = isFinalLevel && !previousAllCorrect;
      if (blockedByPrevious) {
        isCorrect = false;
      }

      state.step = taskIndex + 1;
      if (isCorrect) state.score += 1;
      addCombo(isCorrect);
      updateMeta();
      pulseFeedback(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });
      burst(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });

      const stage = document.getElementById('zombie-stage');
      const beam = document.getElementById('script-beam');
      if (stage) {
        if (isCorrect) {
          stage.classList.add('script-strike');
          if (beam) beam.textContent = normalizedTyped.replace(/\n/g, ' ').trim();
          spawnZombieEpicExplosion(stage);
          stage.classList.add('zombie-epic-detonate');
          window.setTimeout(() => {
            stage.classList.remove('zombie-epic-detonate');
            stage.classList.add('zombie-dead');
            const svg = stage.querySelector('.zombie-svg');
            if (svg) svg.classList.add('is-dead');
          }, 380);
          window.setTimeout(() => stage.classList.remove('script-strike'), 920);
        } else {
          stage.classList.add('zombie-angry');
          window.setTimeout(() => stage.classList.remove('zombie-angry'), 550);
        }
      }

      const failReason = blockedByPrevious
        ? 'Финальный зомби защищен: на одном из предыдущих уровней был неверный bash-код.'
        : 'Ответ не совпадает с допустимым фрагментом bash. Сверься с формулировкой уровня.';

      statusEl.textContent = isCorrect ? T.okHint : failReason;
      statusEl.classList.remove('muted', 'success', 'error');
      statusEl.classList.add(isCorrect ? 'success' : 'error');
      setMessage(isCorrect ? T.okMsg : blockedByPrevious ? 'Финальный уровень не пройден: есть ошибки на прошлых уровнях.' : T.badMsg, isCorrect ? 'success' : 'error');

      levelOutcomes.push(isCorrect);
      clearedEl.textContent = String(levelOutcomes.filter(Boolean).length);
      results.push({
        scenario: task.scenario,
        answer: normalizedTyped,
        correctAnswer: task.answer,
        ok: isCorrect,
      });

      window.setTimeout(() => {
        taskIndex += 1;
        if (taskIndex >= tasks.length) finish({ mode: T.finishMode, results, allPreviousBeforeFinalCorrect: previousAllCorrect });
        else renderZombieBashTask();
      }, 850);
    }

    checkButton.addEventListener('click', processAnswer);
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) processAnswer();
    });
    inputEl.focus();
  }

  if (themeKey === 'zombie') renderZombieBashTask();
  else renderNetworkTask();
}
