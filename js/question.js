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
    this.wrongAnswers = this.questionData.incorrect_answers.map(answer => this.decodeHtml(answer));
    this.allAnswers = this.shuffleAnswers();
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;

    this.handleKeydown = this.handleKeydown.bind(this);
  }

  decodeHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
  }

  shuffleAnswers() {
    const allAnswers = [...this.wrongAnswers, this.correctAnswer];
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
    }
    return allAnswers;
  }

  getProgress() {
    return Math.round((this.index / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    let allAnswersStracture = '<div class="answers-grid">';
    for (let i = 0; i < this.allAnswers.length; i++) {
      allAnswersStracture += `
        <button class="answer-btn" data-answer="${this.allAnswers[i]}">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text">${this.allAnswers[i]}</span>
        </button>`;
    }
    allAnswersStracture += '</div>';

    const questionCard = `
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
          <span>${this.category}</span>
        </div>
        <div class="stat-badge difficulty ${this.quiz.difficulty}">
          <i class="fa-solid fa-face-smile"></i>
          <span>${this.quiz.difficulty}</span>
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

      <h2 class="question-text">${this.question}</h2>
      ${allAnswersStracture}
      <p class="keyboard-hint">
        <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
      </p>
      <div id="time-up-warning"></div>
      <div class="score-panel">
        <div class="score-item">
          <div class="score-item-label">Score</div>
          <div class="score-item-value">${this.quiz.score}</div>
        </div>
      </div>
    `;
    this.container.innerHTML = questionCard;
    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(button => {
      button.addEventListener("click", () => this.checkAnswer(button));
    });
    document.addEventListener("keydown", this.handleKeydown);
  }

  handleKeydown(e) {
    const validKeys = ["1", "2", "3", "4"];
    if (validKeys.includes(e.key)) {
      const index = parseInt(e.key) - 1;
      const buttons = document.querySelectorAll(".answer-btn");
      if (buttons[index]) {
        this.checkAnswer(buttons[index]);
      }
    }
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.handleKeydown);
  }

  startTimer() {
    const timerDisplay = document.querySelector(".timer-value");
    const timeBadge = document.querySelector(".stat-badge.timer");

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (timerDisplay) {
        timerDisplay.textContent = this.timeRemaining;
      }

      if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
        this.playTone(1000, 0.1);
      }

      if (this.timeRemaining <= 10 && timeBadge) {
        timeBadge.classList.add("warning");
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
    const buttons = document.querySelectorAll(".answer-btn");
    buttons.forEach(button => {
      if (button.dataset.answer.toLowerCase() === this.correctAnswer.toLowerCase()) {
        button.classList.add('correct');
      }
    });
    this.playTone(500, 0.1);
    setTimeout(() => this.playTone(650, 0.1), 100);
    setTimeout(() => this.playTone(750, 0.1), 200);

    const timeUp = `
      <div class="time-up-message">
        <i class="fa-solid fa-clock"></i> TIME'S UP!
      </div>`;
    document.getElementById("time-up-warning").innerHTML = timeUp;

    this.animateQuestion(500);
  }

  checkAnswer(choiceElement) {
    if (this.answered) {
      return;
    }
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    const selectedAnswer = choiceElement.dataset.answer;
    const buttons = document.querySelectorAll(".answer-btn");

    if (selectedAnswer.toLowerCase() === this.correctAnswer.toLowerCase()) {
      choiceElement.classList.add('correct');
      this.quiz.incrementScore();
      this.playTone(500, 0.1);
      setTimeout(() => this.playTone(650, 0.1), 100);
      setTimeout(() => this.playTone(750, 0.1), 200);
    } else {
      choiceElement.classList.add('wrong');
      this.highlightCorrectAnswer();
      this.playTone(300, 0.3);
    }

    buttons.forEach(button => button.classList.add("disabled"));
    this.animateQuestion(500);
  }

  highlightCorrectAnswer() {
    const buttons = document.querySelectorAll(".answer-btn");
    buttons.forEach(button => {
      if (button.dataset.answer.toLowerCase() === this.correctAnswer.toLowerCase()) {
        button.classList.add("correct-reveal");
      }
    });
  }

  getNextQuestion() {
    const nextQue = this.quiz.nextQuestion();
    if (nextQue) {
      const newQuestion = new Question(this.quiz, this.container, this.onQuizEnd);
      newQuestion.displayQuestion();
    } else {
      const resultDiv = this.quiz.endQuiz();
      this.container.innerHTML = resultDiv;
      const notes = [550, 650, 800, 1020];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 0.2), i * 150);
      });
      const playAgainBtn = document.querySelector(".btn-restart");
      if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
          if (this.onQuizEnd) {
            this.onQuizEnd();
          }
        });
      }
    }
  }

  animateQuestion(duration) {
    const questionCard = document.querySelector(".question-card");
    setTimeout(() => {
      if (questionCard) {
        questionCard.classList.add("exit");
      }
      setTimeout(() => {
        this.getNextQuestion();
      }, duration);
    }, 1500);
  }

  playTone(frequency, duration) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
}