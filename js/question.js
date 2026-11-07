export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;
    this.questionData = this.quiz.getCurrentQuestion();
    this.index = this.quiz.currentQuestionIndex;
    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((ans) =>
      this.decodeHtml(ans),
    );
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaning = 15;
  }
  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }
  shuffleAnswers() {
    let array = [this.correctAnswer, ...this.wrongAnswers];
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
          <span>${this.category}</span>
        </div>
        <div class="stat-badge difficulty ${this.quiz.difficulty}">
          <i class="fa-solid fa-face-smile"></i>
          <span>${this.quiz.difficulty}</span>
        </div>
        <div class="stat-badge timer">
          <i class="fa-solid fa-stopwatch"></i>
          <span class="timer-value">15</span>s
        </div>
        <div class="stat-badge counter">
          <i class="fa-solid fa-gamepad"></i>
          <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
        </div>
      </div>

      <h2 class="question-text">${this.question}</h2>
        <div class="answers-grid">
${this.shuffleAnswers()
  .map(
    (ans, index) =>
      `
<button class="answer-btn" data-answer="${ans}">
          <span class="answer-key">${index + 1}</span>
          <span class="answer-text">${ans}</span>
</button>
`,
  )
  .join("")}
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
    this.addEventListeners();
    this.startTimer();
  }
  addEventListeners() {
    const answerBtns = document.querySelectorAll(".answer-btn");
    for (let i = 0; i < answerBtns.length; i++) {
      answerBtns[i].addEventListener("click", (e) => {
        this.checkAnswer(e.currentTarget);
      });
    }
    this.keyBoardHandler = (e) => {
      const index = Number(e.key);
      if (index > 0 && index < 5) this.checkAnswer(answerBtns[index - 1]);
    };
    document.addEventListener("keydown", this.keyBoardHandler);
  }
  removeEventListeners() {
    document.removeEventListener("keydown", this.keyBoardHandler);
  }
  startTimer() {
    let timerElemnt = document.querySelector(".stat-badge.timer");
    let timerSpan = document.querySelector(".timer-value");
    this.timerInterval = setInterval(() => {
      this.timeRemaning--;
      timerSpan.innerHTML = this.timeRemaning;
      if (this.timeRemaning <= 5) {
        timerElemnt.classList.add("warning");
      }
      if (this.timeRemaning <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }
  stopTimer() {
    clearInterval(this.timerInterval);
  }
  handleTimeUp() {
    const timeUpBadge = document.querySelector(".time-up-message");
    this.answered = true;
    this.removeEventListeners();
    this.highlightCorrectAnswer();
    timeUpBadge.classList.remove("hidden");
    this.animateQuestion(1500);
  }
  checkAnswer(choiceElement) {
    if (this.answered) return;
    const answerBtns = document.querySelectorAll(".answer-btn");

    this.answered = true;
    this.stopTimer();
    const selectedAnswer = choiceElement.getAttribute("data-answer");
    if (selectedAnswer.toLowerCase() === this.correctAnswer.toLowerCase()) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer();
    }
    for (let i = 0; i < answerBtns.length; i++) {
      if (
        answerBtns[i] !== choiceElement &&
        answerBtns[i].getAttribute("data-answer") !== this.correctAnswer
      )
        answerBtns[i].classList.add("disabled");
    }
    this.animateQuestion(1500);
  }
  highlightCorrectAnswer() {
    const answerBtns = document.querySelectorAll(".answer-btn");
    for (let i = 0; i < answerBtns.length; i++) {
      if (answerBtns[i].getAttribute("data-answer") === this.correctAnswer)
        answerBtns[i].classList.add("correct-reveal");
    }
  }
  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      new Question(this.quiz, this.container, this.onQuizEnd).displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();
      document.getElementById("restartQuiz").addEventListener("click", () => {
        this.onQuizEnd();
      });
    }
  }
  animateQuestion(duration) {
    const card = document.querySelector(".game-card.question-card");
    setTimeout(() => {
      card.classList.add("exit");
      this.getNextQuestion();
    }, duration);
  }
}
