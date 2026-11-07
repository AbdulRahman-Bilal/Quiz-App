/**
 * @fileoverview Question controller: renders one question card, runs its
 * timer, validates the chosen answer and moves on to the next question.
 */
import { decodeHtml, escapeHtml, shuffle } from "./utils.js";

export default class Question {
  static TIME_LIMIT = 15;
  static WARNING_AT = 5;
  static FEEDBACK_DELAY = 1500;
  static EXIT_ANIMATION = 400;

  /**
   * @param {import("./quiz.js").default} quiz
   * @param {HTMLElement} container
   * @param {() => void} onQuizEnd called after the last question is answered
   * @param {(question: Question) => void} [onShow] called whenever a question
   *   is displayed, so the owner can always reach the active one
   */
  constructor(quiz, container, onQuizEnd, onShow) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;
    this.onShow = onShow;

    const data = this.quiz.getCurrentQuestion();
    this.index = this.quiz.currentQuestionIndex;
    this.question = decodeHtml(data.question);
    this.correctAnswer = decodeHtml(data.correct_answer);
    this.category = decodeHtml(data.category);
    this.wrongAnswers = data.incorrect_answers.map(decodeHtml);

    this.answered = false;
    this.destroyed = false;
    this.timerInterval = null;
    this.nextTimeout = null;
    this.timeRemaining = Question.TIME_LIMIT;
    this.keyBoardHandler = null;
  }

  shuffleAnswers() {
    return shuffle([this.correctAnswer, ...this.wrongAnswers]);
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const total = this.quiz.numberOfQuestions;
    const answersHtml = this.shuffleAnswers()
      .map(
        (ans, i) => `
        <button class="answer-btn" data-answer="${escapeHtml(ans)}">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text">${escapeHtml(ans)}</span>
        </button>`,
      )
      .join("");

    this.container.innerHTML = `
    <div class="game-card question-card">

      <div class="xp-bar-container">
        <div class="xp-bar-header">
          <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
          <span class="xp-value">Question ${this.index + 1}/${total}</span>
        </div>
        <div class="xp-bar">
          <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-badge category">
          <i class="fa-solid fa-bookmark"></i>
          <span>${escapeHtml(this.category)}</span>
        </div>
        <div class="stat-badge difficulty ${escapeHtml(this.quiz.difficulty)}">
          <i class="fa-solid fa-face-smile"></i>
          <span>${escapeHtml(this.quiz.difficulty)}</span>
        </div>
        <div class="stat-badge timer">
          <i class="fa-solid fa-stopwatch"></i>
          <span class="timer-value">${Question.TIME_LIMIT}</span>s
        </div>
        <div class="stat-badge counter">
          <i class="fa-solid fa-gamepad"></i>
          <span>${this.index + 1}/${total}</span>
        </div>
      </div>

      <h2 class="question-text">${escapeHtml(this.question)}</h2>
      <div class="answers-grid">${answersHtml}
      </div>
      <p class="keyboard-hint">
        <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
      </p>
      <div class="time-up-message hidden">
        <i class="fa-solid fa-clock"></i> TIME'S UP!
      </div>

      <div class="score-panel">
        <div class="score-item">
          <div class="score-item-label">Score</div>
          <div class="score-item-value">${this.quiz.score}</div>
        </div>
      </div>
    </div>
  `;
    this.card = this.container.querySelector(".question-card");
    this.answerBtns = [...this.card.querySelectorAll(".answer-btn")];
    this.addEventListeners();
    this.startTimer();
    if (this.onShow) this.onShow(this);
  }

  addEventListeners() {
    this.answerBtns.forEach((btn) =>
      btn.addEventListener("click", (e) => this.checkAnswer(e.currentTarget)),
    );
    this.keyBoardHandler = (e) => {
      if (!/^[1-4]$/.test(e.key)) return;
      const btn = this.answerBtns[Number(e.key) - 1];
      if (btn) this.checkAnswer(btn);
    };
    document.addEventListener("keydown", this.keyBoardHandler);
  }

  removeEventListeners() {
    if (this.keyBoardHandler) {
      document.removeEventListener("keydown", this.keyBoardHandler);
      this.keyBoardHandler = null;
    }
  }

  startTimer() {
    const timerEl = this.card.querySelector(".stat-badge.timer");
    const timerSpan = this.card.querySelector(".timer-value");
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      timerSpan.textContent = this.timeRemaining;
      if (this.timeRemaining <= Question.WARNING_AT) {
        timerEl.classList.add("warning");
      }
      if (this.timeRemaining <= 0) {
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  /** Lock the question: no more answers, no timer, no key handler. */
  lock() {
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();
  }

  handleTimeUp() {
    if (this.answered) return;
    this.lock();
    this.highlightCorrectAnswer();
    this.answerBtns.forEach((btn) => btn.classList.add("disabled"));
    this.card.querySelector(".time-up-message").classList.remove("hidden");
    this.scheduleNext();
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;
    this.lock();

    const selected = choiceElement.getAttribute("data-answer");
    if (selected === this.correctAnswer) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      this.card.querySelector(".score-item-value").textContent =
        this.quiz.score;
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
    }
    this.answerBtns.forEach((btn) => {
      if (
        btn !== choiceElement &&
        btn.getAttribute("data-answer") !== this.correctAnswer
      ) {
        btn.classList.add("disabled");
      }
    });
    this.scheduleNext();
  }

  highlightCorrectAnswer() {
    this.answerBtns.forEach((btn) => {
      if (btn.getAttribute("data-answer") === this.correctAnswer) {
        btn.classList.add("correct-reveal");
      }
    });
  }

  /** Show feedback for a moment, play the exit animation, then continue. */
  scheduleNext() {
    this.nextTimeout = setTimeout(() => {
      if (this.destroyed) return;
      this.card.classList.add("exit");
      this.nextTimeout = setTimeout(
        () => this.getNextQuestion(),
        Question.EXIT_ANIMATION,
      );
    }, Question.FEEDBACK_DELAY);
  }

  getNextQuestion() {
    if (this.destroyed) return;
    if (this.quiz.nextQuestion()) {
      new Question(
        this.quiz,
        this.container,
        this.onQuizEnd,
        this.onShow,
      ).displayQuestion();
    } else {
      this.onQuizEnd();
    }
  }

  /** Stop everything this question started (timer, timeouts, listeners). */
  destroy() {
    this.destroyed = true;
    this.stopTimer();
    clearTimeout(this.nextTimeout);
    this.removeEventListeners();
  }
}
