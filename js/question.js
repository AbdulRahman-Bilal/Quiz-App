let audioCtx;

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;
    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;
    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((a) => this.decodeHtml(a));
    this.allAnswers = this.shuffleAnswers();
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;
    this.handleKey = this.handleKey.bind(this);
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  shuffleAnswers() {
    const array = [...this.wrongAnswers, this.correctAnswer];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const icons = { easy: "face-smile", medium: "face-meh", hard: "skull" };
    const difficulty = this.questionData.difficulty;

    const answersHtml = this.allAnswers
      .map(
        (answer, i) => `
        <button class="answer-btn">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text">${this.escapeHtml(answer)}</span>
        </button>`
      )
      .join("");

    this.container.innerHTML = `
      <div class="game-card question-card">
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.escapeHtml(this.category)}</span>
          </div>
          <div class="stat-badge difficulty ${difficulty}">
            <i class="fa-solid fa-${icons[difficulty]}"></i>
            <span>${difficulty}</span>
          </div>
          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
        </div>

        <h2 class="question-text">${this.escapeHtml(this.question)}</h2>

        <div class="answers-grid">${answersHtml}</div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>`;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    this.container.querySelectorAll(".answer-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.checkAnswer(btn));
    });
    document.addEventListener("keydown", this.handleKey);
  }

  handleKey(e) {
    const buttons = this.container.querySelectorAll(".answer-btn");
    const btn = buttons[Number(e.key) - 1];
    if (btn) this.checkAnswer(btn);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.handleKey);
  }

  startTimer() {
    const timerBadge = this.container.querySelector(".stat-badge.timer");
    const timerValue = this.container.querySelector(".timer-value");

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerValue.textContent = this.timeRemaining;

      if (this.timeRemaining <= 5) {
        timerBadge.classList.add("warning");
      }
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();
    this.highlightCorrectAnswer();
    this.container.querySelectorAll(".answer-btn").forEach((btn) => {
      if (!btn.classList.contains("correct-reveal")) btn.classList.add("disabled");
    });
    this.container.querySelector(".question-card").insertAdjacentHTML(
      "beforeend",
      `<div class="time-up-message"><i class="fa-solid fa-clock"></i> TIME'S UP!</div>`
    );
    this.playSound(false);
    this.animateQuestion();
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selected = choiceElement.querySelector(".answer-text").textContent;
    const isCorrect = selected.toLowerCase() === this.correctAnswer.toLowerCase();

    if (isCorrect) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      this.container.querySelector(".score-item-value").textContent = this.quiz.score;
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
    }

    this.container.querySelectorAll(".answer-btn").forEach((btn) => {
      const isChosen = btn === choiceElement;
      const isRevealed = btn.classList.contains("correct-reveal");
      if (!isChosen && !isRevealed) btn.classList.add("disabled");
    });

    this.playSound(isCorrect);
    this.animateQuestion();
  }

  highlightCorrectAnswer() {
    this.container.querySelectorAll(".answer-btn").forEach((btn) => {
      const text = btn.querySelector(".answer-text").textContent;
      if (text === this.correctAnswer) btn.classList.add("correct-reveal");
    });
  }

  playSound(isCorrect) {
    audioCtx = audioCtx || new AudioContext();
    const osc = audioCtx.createOscillator();
    osc.connect(audioCtx.destination);
    osc.type = isCorrect ? "sine" : "sawtooth";
    osc.frequency.value = isCorrect ? 800 : 200;
    osc.start();
    osc.stop(audioCtx.currentTime + (isCorrect ? 0.2 : 0.4));
  }

  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      const next = new Question(this.quiz, this.container, this.onQuizEnd);
      next.displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();
      this.container.querySelector(".btn-restart").addEventListener("click", this.onQuizEnd);
    }
  }

  animateQuestion(duration = 500) {
    setTimeout(() => {
      this.container.querySelector(".question-card").classList.add("exit");
      setTimeout(() => this.getNextQuestion(), duration);
    }, 1500);
  }
}
