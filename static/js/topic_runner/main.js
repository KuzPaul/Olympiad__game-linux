import { escapeHtml, shuffle, formatTime } from './shared/util.js';
import { pulseFeedback, spawnBurst } from './shared/feedback.js';
import { initClassification } from './modes/classification.js';
import { initQuiz } from './modes/quiz.js';
import { initMatch } from './modes/match.js';
import { initCommandBuilder } from './modes/command_builder.js';
import { startMissionMusic, stopMissionMusic } from './music.js';

const topic = window.TOPIC_DATA;
if (!topic) {
  throw new Error('TOPIC_DATA missing');
}

const app = document.getElementById('topic-app');
const scoreEl = document.getElementById('current-score');
const stepEl = document.getElementById('current-step');
const resultMessage = document.getElementById('result-message');
const timerValueEl = document.getElementById('timer-value');
const timerBarEl = document.getElementById('timer-bar');

const isTester = !!window.IS_TESTER;
const musicEnabled = !!window.MUSIC_ENABLED;

const state = {
  score: 0,
  step: 0,
  completed: false,
  details: {},
  saved: false,
  saving: false,
  deadlineTs: 0,
  timerId: null,
  elapsedSeconds: 0,
  combo: 0,
  bestCombo: 0,
  totalSteps:
    topic.items?.length ||
    topic.questions?.length ||
    topic.pairs?.length ||
    topic.tasks?.length ||
    0,
};

function currentStepLabel() {
  return `${state.step}/${state.totalSteps}`;
}

function updateMeta() {
  scoreEl.textContent = String(state.score);
  stepEl.textContent = currentStepLabel();
}

function setMessage(text, mode = 'info') {
  resultMessage.innerHTML = text;
  resultMessage.className = `result-message ${mode}`;
}

function addCombo(isCorrect) {
  if (isCorrect) {
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
  } else {
    state.combo = 0;
  }
  const comboChip = document.getElementById('combo-value');
  if (comboChip) comboChip.textContent = String(state.combo);
  const bestComboChip = document.getElementById('best-combo-value');
  if (bestComboChip) bestComboChip.textContent = String(state.bestCombo);
}

function updateTimer() {
  if (!timerValueEl || !timerBarEl) return;
  const remaining = Math.max(0, Math.ceil((state.deadlineTs - Date.now()) / 1000));
  state.elapsedSeconds = Math.max(0, topic.time_limit_seconds - remaining);
  timerValueEl.textContent = formatTime(remaining);
  const ratio = topic.time_limit_seconds ? (remaining / topic.time_limit_seconds) : 0;
  timerBarEl.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  timerBarEl.classList.toggle('warning', ratio <= 0.35 && ratio > 0.15);
  timerBarEl.classList.toggle('danger', ratio <= 0.15);
  document.body.classList.toggle('time-danger', ratio <= 0.15);
  if (!state.completed && remaining <= 0) {
    finish({ timeout: true, elapsedSeconds: topic.time_limit_seconds, mode: topic.type, auto: true });
  }
}

function startTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.deadlineTs = Date.now() + topic.time_limit_seconds * 1000;
  updateTimer();
  state.timerId = window.setInterval(updateTimer, 250);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

async function saveResult() {
  if (!state.completed || state.saved || state.saving) return;
  state.saving = true;
  setMessage('Система фиксирует прохождение и шифрует твой результат в базе...', 'info');
  try {
    const response = await fetch(window.SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: state.score, details: state.details }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка сохранения.');
    state.saved = true;
    const tail = isTester
      ? 'Можно снова открыть тему и прогнать сценарий.'
      : 'Попытка уже запечатана и не может быть изменена.';
    setMessage(
      `Миссия закрыта. Результат: <strong>${state.score}/${topic.max_score}</strong>. ${tail}`,
      'success'
    );
    window.setTimeout(() => window.location.reload(), 1100);
  } catch (error) {
    state.saving = false;
    setMessage(error.message || 'Не удалось сохранить результат.', 'error');
  }
}

function finish(details) {
  if (state.completed) return;
  state.completed = true;
  state.details = {
    ...(details || {}),
    elapsedSeconds: state.elapsedSeconds,
    timeLimitSeconds: topic.time_limit_seconds,
    bestCombo: state.bestCombo,
  };
  stopTimer();
  stopMissionMusic();
  updateMeta();
  if (details?.timeout) {
    pulseFeedback('bad', { intense: true });
    spawnBurst(app, 'bad', { intense: true });
    setMessage(`Время вышло. Миссия оборвана. Фиксируем результат: <strong>${state.score}/${topic.max_score}</strong>.`, 'error');
  } else {
    pulseFeedback('ok', { strong: true });
    spawnBurst(app, 'ok', { strong: true });
    setMessage(
      `Все этапы пройдены, миссия завершена. Итог: <strong>${state.score}/${topic.max_score}</strong>. Результат отправляется на сервер.`,
      'success'
    );
  }
  saveResult();
}

function createAmbientLayer(label, mode) {
  const ambient = document.createElement('div');
  ambient.className = `ambient-layer ambient-${mode || topic.type}`;
  ambient.innerHTML = `
      <div class="ambient-label">${escapeHtml(label)}</div>
      <div class="ambient-grid"></div>
      ${Array.from({ length: 12 })
        .map((_, index) => `<span class="ambient-node" style="--i:${index}"></span>`)
        .join('')}
    `;
  return ambient;
}

function createHud(extra = '') {
  const hud = document.createElement('div');
  hud.className = 'arcade-hud';
  hud.innerHTML = `
      <div class="hud-pill">Комбо <strong id="combo-value">0</strong></div>
      <div class="hud-pill">Лучшее <strong id="best-combo-value">0</strong></div>
      ${extra}
    `;
  return hud;
}

const burst = (mode, opts) => spawnBurst(app, mode, opts);

const ctx = {
  topic,
  app,
  state,
  scoreEl,
  stepEl,
  resultMessage,
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
};

function boot() {
  state.score = 0;
  state.step = 0;
  state.completed = false;
  state.details = {};
  state.saved = false;
  state.saving = false;
  state.elapsedSeconds = 0;
  state.combo = 0;
  state.bestCombo = 0;
  updateMeta();
  setMessage(
    'Это уже не просто карточки — это игровой модуль. Проходи быстро и точно: результат фиксируется автоматически.',
    'info'
  );
  app.innerHTML = '';
  startTimer();

  if (topic.type === 'classification') initClassification(ctx);
  else if (topic.type === 'quiz') initQuiz(ctx);
  else if (topic.type === 'match') initMatch(ctx);
  else if (topic.type === 'builder') initCommandBuilder(ctx, 'network');
  else if (topic.type === 'zombie_script') initCommandBuilder(ctx, 'zombie');
}

function runMission() {
  startMissionMusic(topic.id, musicEnabled);
  boot();
}

const briefing = document.getElementById('mission-briefing');
if (briefing) {
  const btn = briefing.querySelector('[data-mission-start]');
  if (btn) {
    btn.addEventListener('click', () => {
      briefing.classList.add('hidden');
      const shell = document.querySelector('.game-shell.mission-pending');
      if (shell) shell.classList.remove('mission-pending');
      runMission();
    });
  } else {
    runMission();
  }
} else {
  runMission();
}
