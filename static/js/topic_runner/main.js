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
const MISSION_STORAGE_KEY = `olympiad_mission_${topic.id}`;

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
  awaitingDismiss: false,
  missionActive: false,
  progressDetails: null,
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
  persistMissionState();
}

function clearMissionState() {
  try {
    sessionStorage.removeItem(MISSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function persistMissionState() {
  if (!state.missionActive || state.completed || state.saved) return;
  try {
    sessionStorage.setItem(
      MISSION_STORAGE_KEY,
      JSON.stringify({
        active: true,
        score: state.score,
        step: state.step,
        progress: state.progressDetails,
        topicType: topic.type,
      })
    );
  } catch {
    /* ignore */
  }
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
  if (!state.completed && !state.awaitingDismiss && remaining <= 0) {
    if (topicTimeoutHandler) {
      topicTimeoutHandler();
      return;
    }
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

function buildMissionDetails(extra = {}) {
  return {
    mode: topic.type,
    elapsedSeconds: state.elapsedSeconds,
    timeLimitSeconds: topic.time_limit_seconds,
    bestCombo: state.bestCombo,
    progress: state.progressDetails,
    ...extra,
  };
}

function trackMissionProgress(progress) {
  if (state.completed || state.saved) return;
  state.missionActive = true;
  state.progressDetails = { ...(state.progressDetails || {}), ...progress };
  persistMissionState();
}

function missionInProgress() {
  if (!state.missionActive || state.saved || state.saving) return false;
  if (!state.completed) return true;
  return state.awaitingDismiss && topic.type === 'zombie_script';
}

async function persistPartialResult(redirectHref) {
  if (!missionInProgress()) {
    if (redirectHref) window.location.href = redirectHref;
    return;
  }
  state.saving = true;
  state.completed = true;
  state.details = buildMissionDetails({ partial: true, abandoned: true, reason: 'module_switch' });
  stopTimer();
  stopMissionMusic();
  setMessage('Фиксируем набранный результат и закрываем модуль…', 'info');
  try {
    const response = await fetch(window.SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: state.score, details: state.details }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка сохранения.');
    state.saved = true;
    clearMissionState();
    if (redirectHref) window.location.href = redirectHref;
    else window.location.reload();
  } catch (error) {
    state.saving = false;
    state.completed = false;
    setMessage(error.message || 'Не удалось сохранить результат.', 'error');
    if (redirectHref && window.confirm('Не удалось сохранить результат. Перейти в другой раздел?')) {
      window.location.href = redirectHref;
    }
  }
}

let abandonGuardBound = false;

function bindAbandonGuard() {
  if (abandonGuardBound) return;
  abandonGuardBound = true;
  document.querySelectorAll('.sidebar a.nav-link[href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!missionInProgress()) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      event.preventDefault();
      event.stopPropagation();
      persistPartialResult(href);
    });
  });

  window.addEventListener('beforeunload', () => {
    persistMissionState();
  });
}

async function postMissionResult({ reload = true } = {}) {
  const response = await fetch(window.SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score: state.score, details: state.details }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка сохранения.');
  state.saved = true;
  clearMissionState();
  if (reload) {
    const reloadDelay = topic.type === 'zombie_script' ? 500 : 1100;
    window.setTimeout(() => window.location.reload(), reloadDelay);
  }
  return data;
}

async function commitMissionResult(extra = {}) {
  if (state.saved || state.saving) return false;
  state.saving = true;
  state.completed = true;
  state.missionActive = false;
  state.details = buildMissionDetails(extra);
  stopTimer();
  stopMissionMusic();
  try {
    await postMissionResult({ reload: false });
    return true;
  } catch (error) {
    state.saving = false;
    state.completed = false;
    state.missionActive = true;
    setMessage(error.message || 'Не удалось сохранить результат.', 'error');
    return false;
  } finally {
    state.saving = false;
  }
}

async function saveResult({ reload = true } = {}) {
  if (!state.completed || state.saved || state.saving) return;
  state.saving = true;
  const savingText = state.details?.abandoned
    ? 'Фиксируем частичный результат модуля…'
    : 'Система фиксирует прохождение и сохраняет результат в базе…';
  setMessage(savingText, 'info');
  try {
    await postMissionResult({ reload });
    const tail = isTester
      ? 'Можно снова открыть тему и прогнать сценарий.'
      : 'Попытка уже запечатана и не может быть изменена.';
    setMessage(
      `Миссия закрыта. Результат: <strong>${state.score}/${topic.max_score}</strong>. ${tail}`,
      'success'
    );
  } catch (error) {
    state.saving = false;
    state.completed = false;
    state.awaitingDismiss = true;
    const dismissBtn = document.getElementById('zombie-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.disabled = false;
      dismissBtn.textContent = 'Завершить';
    }
    setMessage(error.message || 'Не удалось сохранить результат.', 'error');
  }
}

async function recoverMissionAfterReload() {
  if (isTester) {
    clearMissionState();
    return false;
  }

  let stored;
  try {
    const raw = sessionStorage.getItem(MISSION_STORAGE_KEY);
    if (!raw) return false;
    stored = JSON.parse(raw);
    if (!stored?.active) {
      clearMissionState();
      return false;
    }
  } catch {
    clearMissionState();
    return false;
  }

  setMessage('Обнаружено прерванное выполнение. Фиксируем результат…', 'info');
  try {
    const response = await fetch(window.SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: typeof stored.score === 'number' ? stored.score : 0,
        details: {
          mode: stored.topicType || topic.type,
          partial: true,
          abandoned: true,
          reason: 'page_reload',
          progress: stored.progress || null,
        },
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || 'Ошибка сохранения.');
    clearMissionState();
    window.location.reload();
    return true;
  } catch (error) {
    clearMissionState();
    setMessage(error.message || 'Не удалось зафиксировать прерванную попытку.', 'error');
    return false;
  }
}

function finish(details) {
  if (state.completed) return;
  if (topic.type === 'zombie_script') return;
  state.completed = true;
  state.missionActive = false;
  state.details = buildMissionDetails(details || {});
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

let topicTimeoutHandler = null;

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
  setTopicTimeoutHandler(fn) {
    topicTimeoutHandler = typeof fn === 'function' ? fn : null;
  },
  lockForVerdict() {
    state.awaitingDismiss = true;
    stopTimer();
    stopMissionMusic();
  },
  submitMissionEnd(details) {
    finish(details);
  },
  commitMissionResult,
  trackMissionProgress,
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
  state.awaitingDismiss = false;
  state.missionActive = false;
  state.progressDetails = null;
  topicTimeoutHandler = null;
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
  state.missionActive = true;
  bindAbandonGuard();
}

async function startTopicRunner() {
  const recovered = await recoverMissionAfterReload();
  if (recovered) return;

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
}

startTopicRunner();
