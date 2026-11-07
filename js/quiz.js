export default class Quiz {
  constructor(categoryId, diffecultyId, questionsNumber, playerName) {
    this.category = categoryId;
    this.difficulty = diffecultyId;
    this.numberOfQuestions = Number(questionsNumber);
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }
  async getQuestions() {
    const res = await fetch(
      this.buildApiUrl(this.category, this.difficulty, this.numberOfQuestions),
    );
    if (!res.ok) {
      throw Error("error in fetching api");
      return;
    }
    const data = await res.json();
    if (!(data.response_code === 0)) {
      throw Error("error in return from api");
    }
    this.questions = data.results;
    return this.questions;
  }
  buildApiUrl(category, difficulty, numberOfQuestions) {
    return `https://opentdb.com/api.php?amount=${numberOfQuestions}&category=${category}&difficulty=${difficulty}&type=multiple`;
  }
  incrementScore() {
    this.score++;
  }
  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    } else return this.questions[this.currentQuestionIndex];
  }
  nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex == this.questions.length) {
      return false;
    } else {
      return true;
    }
  }
  isComplete() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return true;
    } else return false;
  }
  getScorePercentage() {
    const per = (this.score / this.numberOfQuestions) * 100;
    return Math.round(per);
  }
  saveHighScore() {
    let highScores = this.getHighScores();
    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: Date.now(),
    };
    highScores.push(newScore);
    highScores.sort((a, b) => b.percentage - a.percentage);
    if (highScores.length > 10) highScores.splice(10, 1);
    localStorage.setItem("quizHighScores", JSON.stringify(highScores));
  }
  getHighScores() {
    try {
      return localStorage.getItem("quizHighScores")
        ? JSON.parse(localStorage.getItem("quizHighScores"))
        : [];
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  isHighScore() {
    const highScores = this.getHighScores();
    if (
      highScores.length < 10 ||
      this.getScorePercentage() > highScores[highScores.length - 1].percentage
    )
      return true;
    else return false;
  }
  endQuiz() {
    const currentScorePercentage = this.getScorePercentage();
    if (this.isHighScore()) {
      this.saveHighScore();
    }
    const highScores = this.getHighScores();
    return `
    <div class="game-card results-card">
      <h2 class="results-title">Quiz Complete!</h2>
      <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
      <p class="results-percentage">${this.getScorePercentage()}% Accuracy</p>
      ${this.isHighScore()? `<div class="new-record-badge">
        <i class="fa-solid fa-star"></i> New High Score!
      </div>`:""
      }
      <div class="leaderboard">
        <h4 class="leaderboard-title">
          <i class="fa-solid fa-trophy"></i> Leaderboard
        </h4>
        <ul class="leaderboard-list">
        ${highScores.map((score, index) => {
          let rankClass = "";
          if (index === 0) rankClass = "gold";
          else if (index === 1) rankClass = "silver";
          else if (index === 2) rankClass = "bronze";
          return `<li class="leaderboard-item ${rankClass}">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${score.name?score.name:"Player "+(index+1)}</span>
            <span class="leaderboard-score">${score.percentage}%</span>
          </li>`;
        }).join("")}
        </ul>
      </div>
      
      <div class="action-buttons">
        <button id="restartQuiz" class="btn-restart">
          <i class="fa-solid fa-rotate-right"></i> Play Again
        </button>
      </div>
    </div>
    `;
  }
}
