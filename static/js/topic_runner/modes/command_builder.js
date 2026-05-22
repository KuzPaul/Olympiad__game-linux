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

function spawnZombieEpicExplosion(stage, shardCount = 52) {
  const prev = stage.querySelector('.zombie-boom-fx');
  if (prev) prev.remove();
  const fx = document.createElement('div');
  fx.className = 'zombie-boom-fx';
  fx.setAttribute('aria-hidden', 'true');
  const n = shardCount;
  for (let i = 0; i < n; i += 1) {
    const s = document.createElement('span');
    const rot = (360 / n) * i + Math.random() * 14 - 7;
    s.style.setProperty('--rot', `${rot}deg`);
    s.style.setProperty('--dist', `${88 + Math.floor(Math.random() * 140)}px`);
    s.style.setProperty('--delay', `${(Math.random() * 0.22).toFixed(3)}s`);
    s.style.setProperty('--hue', `${90 + Math.floor(Math.random() * 100)}`);
    fx.appendChild(s);
  }
  stage.appendChild(fx);
  window.setTimeout(() => fx.remove(), 1600);
}

function spawnZombieShockwaves(stage) {
  stage.querySelectorAll('.zombie-shockwave').forEach((el) => el.remove());
  for (let i = 0; i < 3; i += 1) {
    const ring = document.createElement('span');
    ring.className = 'zombie-shockwave';
    ring.style.setProperty('--sw-delay', `${i * 0.18}s`);
    stage.appendChild(ring);
  }
  window.setTimeout(() => stage.querySelectorAll('.zombie-shockwave').forEach((el) => el.remove()), 1400);
}

function spawnZombieVictoryCinematic(stage, shell) {
  if (!stage) return;
  stage.classList.add('zombie-victory-cinematic', 'zombie-epic-detonate');
  shell?.classList.add('zombie-mission-victory');
  document.body.classList.add('zombie-arena-victory');
  window.setTimeout(() => stage.classList.remove('zombie-epic-detonate'), 900);
  spawnZombieShockwaves(stage);
  spawnZombieEpicExplosion(stage, 88);
  const sparks = document.createElement('div');
  sparks.className = 'zombie-victory-sparks';
  sparks.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 24; i += 1) {
    const p = document.createElement('span');
    p.style.setProperty('--sx', `${8 + Math.random() * 84}%`);
    p.style.setProperty('--sy', `${12 + Math.random() * 76}%`);
    p.style.setProperty('--sdelay', `${Math.random() * 0.5}s`);
    sparks.appendChild(p);
  }
  stage.appendChild(sparks);
  window.setTimeout(() => sparks.remove(), 2200);
}

function spawnZombieDefeatCinematic(stage, shell) {
  if (!stage) return;
  stage.classList.add('zombie-defeat-cinematic', 'zombie-feast');
  shell?.classList.add('zombie-mission-defeat');
  document.body.classList.add('zombie-arena-defeat');
  const bite = document.createElement('div');
  bite.className = 'zombie-bite-overlay';
  bite.setAttribute('aria-hidden', 'true');
  bite.innerHTML = '<span class="zombie-bite-flash"></span><span class="zombie-bite-teeth"></span>';
  stage.appendChild(bite);
  window.setTimeout(() => bite.remove(), 2400);
  const swarm = document.createElement('div');
  swarm.className = 'zombie-swarm-fx';
  swarm.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 14; i += 1) {
    const z = document.createElement('span');
    z.style.setProperty('--zi', String(i));
    swarm.appendChild(z);
  }
  stage.appendChild(swarm);
  window.setTimeout(() => swarm.remove(), 2600);
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
    hudPill: 'Фрагменты',
    shellClass: 'zombie-mode',
    sceneClass: 'zombie-scene',
    rowLabel: 'Фрагмент',
    okHint:
      'Все строки скрипта верны. Построчный отчёт ниже — у каждой позиции ✓.',
    okMsg: 'Антидот сработал: все команды верны, орда зомби-процессов обезврежена.',
    badMsg: 'Хотя бы одна строка неверна. Толпа сомкнула кольцо — смотри ✗ в таблице.',
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
    setTopicTimeoutHandler,
    lockForVerdict,
    submitMissionEnd,
  } = ctx;

  const tasks = topic.tasks;
  const results = [];
  const enteredScriptLines = [];
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

  /** Нормализация одной строки bash для сравнения (пробелы, $(( … )), вокруг `=`). */
  function normalizeBashLine(line) {
    let s = (line || '').trim();
    if (!s) return '';
    s = s.replace(/\s+/g, ' ');
    s = s.replace(/\s*;\s*$/, ';');
    if (s.endsWith(';')) s = s.slice(0, -1).trim();
    s = s.replace(/\s*=\s*/g, '=');
    s = s.replace(/\$\(\(\s*([^)]+?)\s*\)\)/g, (_, inner) => `$((${inner.replace(/\s+/g, '')}))`);
    s = s.replace(/\s*;\s*/g, '; ');
    s = s.replace(/\s+in\s+/gi, ' in ');
    s = s.replace(/\s+do\s+/gi, ' do ');
    s = s.replace(/\s+done\s*$/i, ' done');
    return s.trim();
  }

  function lineMatchesAccepted(typed, task) {
    if (!task?.answer) return false;
    const normTyped = normalizeBashLine(typed);
    if (!normTyped) return false;
    const options = [task.answer, ...(task.accepted || [])];
    return options.some((variant) => normalizeBashLine(variant) === normTyped);
  }

  function evaluateZombieScript(userLines) {
    const lineRows = [];
    let isCorrect = userLines.length === tasks.length;

    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i];
      const got = userLines[i];
      const lineOk = got !== undefined && lineMatchesAccepted(got, task);
      if (!lineOk) isCorrect = false;
      lineRows.push({
        got,
        exp: task.answer,
        lineOk,
        scenario: task.scenario,
      });
    }

    for (let i = tasks.length; i < userLines.length; i += 1) {
      lineRows.push({ got: userLines[i], exp: '—', lineOk: false, scenario: '—' });
      isCorrect = false;
    }

    if (userLines.length < tasks.length) isCorrect = false;

    return { lineRows, isCorrect };
  }

  /** Непустые строки из поля ввода (минимум одна — это текущая строка фрагмента). */
  function linesFromRawInput(raw) {
    return (raw || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function bindZombieDismissButton(pendingFinish) {
    const btn = document.getElementById('zombie-dismiss-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (state.completed) return;
      btn.disabled = true;
      btn.textContent = 'Сохранение…';
      submitMissionEnd(pendingFinish);
    });
  }

  function renderZombieVerdictScreen({
    isCorrect,
    fullTyped,
    lineRows,
    userLines,
    timeout = false,
    pendingFinish,
  }) {
    lockForVerdict();
    state.step = tasks.length;
    if (timeout) state.score = 0;
    else state.score = isCorrect ? topic.max_score : 0;
    updateMeta();

    const shell = app.querySelector('.builder-shell');
    const stage = document.getElementById('zombie-stage');
    const beam = document.getElementById('script-beam');

    pulseFeedback(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });
    burst(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });

    if (stage) {
      if (isCorrect) {
        stage.classList.add('script-strike');
        if (beam) beam.textContent = (fullTyped || '').replace(/\n/g, ' ').trim().slice(0, 260);
        spawnZombieVictoryCinematic(stage, shell);
        window.setTimeout(() => {
          stage.classList.add('zombie-dead');
          const svg = stage.querySelector('.zombie-svg');
          if (svg) svg.classList.add('is-dead');
        }, 520);
        window.setTimeout(() => stage.classList.remove('script-strike'), 1100);
      } else {
        stage.classList.add('zombie-angry');
        spawnZombieDefeatCinematic(stage, shell);
        window.setTimeout(() => stage.classList.remove('zombie-angry'), 1200);
      }
    }

    const bannerKicker = timeout
      ? 'Время вышло'
      : isCorrect
        ? 'Антидот активирован'
        : 'Скрипт отвергнут';
    const bannerTitle = timeout
      ? 'Орда настигла тебя'
      : isCorrect
        ? 'Орда уничтожена!'
        : 'Тебя сожрали';
    const wrongCount = lineRows ? lineRows.filter((r) => !r.lineOk).length : tasks.length;
    const bannerSub = timeout
      ? 'Таймер обнулился до финальной проверки. Результат: 0 баллов.'
      : isCorrect
        ? `+${topic.max_score} баллов. Все ${tasks.length} строк верны.`
        : wrongCount === 1
          ? 'Одна строка не совпала с эталоном — орда выжила.'
          : `Неверных строк: ${wrongCount} из ${tasks.length}.`;

    setMessage(timeout ? 'Время вышло. Изучи отчёт и нажми «Завершить».' : isCorrect ? T.okMsg : T.badMsg, isCorrect && !timeout ? 'success' : 'error');

    const tableBlock =
      lineRows && lineRows.length
        ? `
          <table class="zombie-diff-table">
            <thead><tr><th>#</th><th>Что ты ввёл</th><th>Эталон</th><th></th></tr></thead>
            <tbody>${lineRows
              .map((row, idx) => {
                const cellOk = row.lineOk ? '✓' : '✗';
                const cls = row.lineOk ? 'diff-ok' : 'diff-bad';
                return `<tr class="${cls}"><td>${idx + 1}</td><td><code>${escapeHtml(row.got ?? '—')}</code></td><td><code>${escapeHtml(row.exp ?? '—')}</code></td><td>${cellOk}</td></tr>`;
              })
              .join('')}</tbody>
          </table>`
        : '<p class="muted">Скрипт не был собран до конца.</p>';

    const trophySrc = window.BRAND_IMAGES?.trophy || '';
    const trophyHtml =
      isCorrect && trophySrc
        ? `<img src="${escapeHtml(trophySrc)}" alt="" class="zombie-finale-trophy" width="112" height="112">`
        : '';

    mission.innerHTML = `
      <div class="zombie-finale-banner ${isCorrect ? 'zombie-finale-win' : 'zombie-finale-loss'}" role="status">
        ${trophyHtml}
        <p class="zombie-finale-kicker">${escapeHtml(bannerKicker)}</p>
        <h2 class="zombie-finale-title">${escapeHtml(bannerTitle)}</h2>
        <p class="zombie-finale-sub">${escapeHtml(bannerSub)}</p>
      </div>
      <div class="question-header">
        <div class="question-kicker">Итог проверки</div>
        <div class="question-tip">${timeout ? 'Миссия остановлена по таймеру.' : isCorrect ? 'Все команды построчно верны — победа.' : 'Не все строки совпали с эталоном — поражение.'}</div>
      </div>
      <div class="zombie-script-summary ${isCorrect ? 'success' : 'error'}" role="region" aria-label="Построчный отчёт">
        <h4 class="zombie-script-summary-title">Построчно: что ввёл / эталон</h4>
        ${tableBlock}
        ${
          userLines && userLines.length
            ? `<details class="zombie-script-aggregate">
            <summary>Сводка заданий (формулировки шагов)</summary>
            <ol class="zombie-scenarios-list">${tasks
              .map((t, i) => `<li>${escapeHtml(t.scenario)} — <code>${escapeHtml(userLines[i] ?? '')}</code></li>`)
              .join('')}</ol>
          </details>`
            : ''
        }
      </div>
      <div class="builder-status ${isCorrect ? 'success' : 'error'}" id="builder-status">
        ${isCorrect ? escapeHtml(T.okHint) : timeout ? 'Время истекло. Нажми «Завершить», чтобы зафиксировать результат и выйти.' : 'Сборка скрипта ошибочна. Строки с ✗ — неверные. Нажми «Завершить», чтобы выйти.'}
      </div>
      <div class="zombie-finale-actions">
        <button type="button" class="primary-btn zombie-dismiss-btn" id="zombie-dismiss-btn">Завершить</button>
        <p class="zombie-finale-hint muted">Результат сохранится на сервере только после нажатия кнопки.</p>
      </div>
    `;

    bindZombieDismissButton(pendingFinish);
  }

  function renderZombieBashTask() {
    resetZombieStage();

    if (setTopicTimeoutHandler) {
      setTopicTimeoutHandler(() => {
        if (state.completed || state.awaitingDismiss) return;
        const userLines = enteredScriptLines.slice();
        const partial = normalizeScript(userLines.join('\n'));
        const { lineRows } = evaluateZombieScript(userLines);
        const pendingFinish = {
          mode: T.finishMode,
          results: [
            {
              scenario: 'Таймаут миссии',
              answer: partial,
              correctAnswer: normalizeScript(topic.full_script || ''),
              ok: false,
            },
          ],
          timeout: true,
          scriptOk: false,
        };
        renderZombieVerdictScreen({
          isCorrect: false,
          fullTyped: partial,
          lineRows,
          userLines,
          timeout: true,
          pendingFinish,
        });
      });
    }

    function applyFullScriptResult() {
      const userLines = enteredScriptLines.slice();
      const fullTyped = normalizeScript(userLines.join('\n'));
      const { lineRows, isCorrect } = evaluateZombieScript(userLines);

      addCombo(isCorrect);

      lineRows.forEach((row, i) => {
        results.push({
          scenario: tasks[i]?.scenario ?? `Строка ${i + 1}`,
          answer: row.got ?? '',
          correctAnswer: row.exp ?? '',
          ok: row.lineOk,
        });
      });

      results.push({
        scenario: 'Итог: все строки скрипта',
        answer: fullTyped,
        correctAnswer: tasks.map((t) => t.answer).join('\n'),
        ok: isCorrect,
      });

      renderZombieVerdictScreen({
        isCorrect,
        fullTyped,
        lineRows,
        userLines,
        timeout: false,
        pendingFinish: {
          mode: T.finishMode,
          results: results.slice(),
          scriptOk: isCorrect,
          linesCorrect: lineRows.filter((r) => r.lineOk).length,
          linesTotal: tasks.length,
        },
      });
    }

    function renderZombieLineStep() {
      resetZombieStage();
      const task = tasks[taskIndex];
      const isLast = taskIndex >= tasks.length - 1;

      clearedEl.textContent = `${enteredScriptLines.length}/${tasks.length}`;
      state.step = taskIndex + 1;
      updateMeta();

      mission.innerHTML = `
        <div class="question-header">
          <div class="question-kicker">${T.rowLabel} ${taskIndex + 1} из ${tasks.length}</div>
          <div class="question-tip">
            Одна строка за шаг. Промежуточных вердиктов нет —
            результат появится после последней строки. Ctrl+Enter / ⌘+Enter — то же, что кнопка.
          </div>
        </div>
        <h3>${escapeHtml(task.scenario)}</h3>
        <label class="bash-input-label" for="bash-input">Текущая строка скрипта</label>
        <textarea class="bash-input" id="bash-input" autocomplete="off" spellcheck="false" rows="3"></textarea>
        <div class="builder-actions">
          <button type="button" class="secondary-btn small-btn" id="clear-command">Очистить поле</button>
          <button type="button" class="primary-btn small-btn" id="check-command">${isLast ? 'Проверить весь скрипт' : 'Добавить строку'}</button>
        </div>
        <div class="builder-status muted" id="builder-status">
          ${isLast ? 'После нажатия будет сверка всего скрипта с эталоном.' : 'Строка попадёт в общий скрипт; верно или нет — узнаешь в конце.'}
        </div>
      `;

      const inputEl = document.getElementById('bash-input');
      const statusEl = document.getElementById('builder-status');
      const clearButton = document.getElementById('clear-command');
      const checkButton = document.getElementById('check-command');

      clearButton.addEventListener('click', () => {
        if (state.completed) return;
        inputEl.value = '';
        inputEl.focus();
      });

      function processLine() {
        if (state.completed || state.awaitingDismiss) return;
        const parts = linesFromRawInput(inputEl.value);
        if (parts.length === 0) {
          statusEl.textContent = 'Введи непустую строку (один фрагмент за шаг).';
          statusEl.classList.remove('muted', 'success', 'error');
          statusEl.classList.add('error');
          return;
        }
        if (parts.length > 1) {
          statusEl.textContent = 'За один шаг — ровно одна строка кода. Убери лишние переносы или раздели по шагам.';
          statusEl.classList.remove('muted', 'success', 'error');
          statusEl.classList.add('error');
          return;
        }
        const line = parts[0];
        enteredScriptLines.push(line);

        if (!isLast) {
          statusEl.textContent = 'Строка записана в скрипт. Дальше — следующий фрагмент.';
          statusEl.classList.remove('muted', 'success', 'error');
          statusEl.classList.add('muted');
          taskIndex += 1;
          window.setTimeout(() => renderZombieLineStep(), 320);
          return;
        }

        applyFullScriptResult();
      }

      checkButton.addEventListener('click', processLine);
      inputEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) processLine();
      });
      inputEl.focus();
    }

    renderZombieLineStep();
  }

  if (themeKey === 'zombie') renderZombieBashTask();
  else renderNetworkTask();
}
