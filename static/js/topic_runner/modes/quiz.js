export function initQuiz(ctx) {
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
    createAmbientLayer,
    createHud,
    trackMissionProgress,
  } = ctx;

  const questions = topic.questions;
  const results = [];
  let index = 0;

  app.innerHTML = '';
  app.appendChild(createAmbientLayer('Реактор процессов', 'quiz'));
  app.appendChild(createHud('<div class="hud-pill">Серия <strong id="streak-value">0</strong></div>'));
  app.insertAdjacentHTML(
    'beforeend',
    `
      <div class="arcade-quiz-shell">
        <div class="reactor-column">
          <div class="reactor-core">
            <div class="reactor-core-ring"></div>
            <div class="reactor-core-center"></div>
          </div>
          <div class="reactor-text">Режим аварийных решений</div>
        </div>
        <div class="quiz-mission-panel" id="quiz-mission-panel"></div>
      </div>
    `
  );

  const panel = document.getElementById('quiz-mission-panel');
  const streakEl = document.getElementById('streak-value');

  function renderQuestion() {
    const question = questions[index];
    stepEl.textContent = `${index + 1}/${questions.length}`;
    panel.innerHTML = `
        <div class="question-header">
          <div class="question-kicker">Ситуация ${index + 1}</div>
          <div class="question-tip">Выбери лучшее действие до перегрева узла</div>
        </div>
        <h3>${escapeHtml(question.question)}</h3>
        <div class="arcade-options">
          ${question.options
            .map(
              (option, optionIndex) => `
            <button class="arcade-answer" type="button" data-index="${optionIndex}">
              <span class="answer-key">${String.fromCharCode(65 + optionIndex)}</span>
              <span>${escapeHtml(option)}</span>
            </button>
          `
            )
            .join('')}
        </div>
      `;

    panel.querySelectorAll('.arcade-answer').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.completed) return;
        const pickedIndex = Number(button.dataset.index);
        const isCorrect = pickedIndex === question.answer;
        state.step = index + 1;
        if (isCorrect) state.score += 1;
        addCombo(isCorrect);
        streakEl.textContent = String(state.combo);
        updateMeta();
        pulseFeedback(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });
        burst(isCorrect ? 'ok' : 'bad', isCorrect ? { strong: true } : { intense: true });

        results.push({
          question: question.question,
          picked: question.options[pickedIndex],
          correct: question.options[question.answer],
          ok: isCorrect,
        });
        trackMissionProgress({ mode: 'quiz', results: results.slice(), step: state.step });

        panel.querySelectorAll('.arcade-answer').forEach((btn) => {
          btn.disabled = true;
          if (Number(btn.dataset.index) === question.answer) btn.classList.add('correct-outline');
        });
        button.classList.add(isCorrect ? 'correct' : 'incorrect');

        const note = document.createElement('div');
        note.className = `answer-note ${isCorrect ? 'ok' : 'bad'}`;
        note.innerHTML = isCorrect
          ? `Контур стабилизирован. ${escapeHtml(question.explanation)}`
          : 'Ответ не засчитан. Переходим к следующей ситуации.';
        panel.appendChild(note);
        setMessage(
          isCorrect
            ? 'Решение принято: реактор в норме, цепочка команд продолжается.'
            : 'Ошибка диспетчеризации: узел дал просадку, зафиксировано в логе.',
          isCorrect ? 'success' : 'error'
        );

        window.setTimeout(() => {
          index += 1;
          if (index >= questions.length) finish({ mode: 'reactor-quiz', results });
          else renderQuestion();
        }, 850);
      });
    });
  }

  renderQuestion();
}
