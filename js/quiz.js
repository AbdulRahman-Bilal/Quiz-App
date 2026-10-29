export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }
  
  //ana lazm 2abl al variables asta5dm let/const wa 2abl ay function a3mlha 2aktb This
  async getQuestions() {
    const apiUrl = this.buildApiUrl();
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const dataFromApi = await res.json();

    if (dataFromApi.response_code === 0) {
      this.questions = dataFromApi.results;
    } else {
      throw new Error(`API returned response_code ${dataFromApi.response_code}`);
    }

    return this.questions;
  }

  buildApiUrl() {
    const params = new URLSearchParams({
      amount: this.numberOfQuestions,
      category: this.category,
      difficulty: this.difficulty,
    });
    return `https://opentdb.com/api.php?${params.toString()}`;
  }

  incrementScore() {
    this.score++;
  }
  // ana bakarn  this.currentQuestionIndex b this.questions.length m4 b numberOfQuestions 34an ana bakarn b 3dd questions aly wesltlha
  getCurrentQuestion() {
    if (this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.questions.length) {
      return this.questions[this.currentQuestionIndex];
    }
    return null;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    return !this.isComplete(); // lazm this
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  saveHighScore() {
    const highScores = this.getHighScores();

    const newScoreObject = {
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString(),
    };

    highScores.push(newScoreObject);

    const updatedHighScores = highScores
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    localStorage.setItem("quizHighScores", JSON.stringify(updatedHighScores));
    return updatedHighScores;
  }

  getHighScores() {
    try {
      const highScores = JSON.parse(localStorage.getItem("quizHighScores"));
      return Array.isArray(highScores) ? highScores : [];
    } catch {
      console.log("An error has occurred while reading high scores.");
      return [];
    }
  }

  isHighScore() {
    const highScores = this.getHighScores();
    if (highScores.length < 10) return true;

    const lowestScore = highScores[highScores.length - 1];
    return this.getScorePercentage() > lowestScore.percentage;
  }

  endQuiz() {
    const percentage = this.getScorePercentage();
    const qualifies = this.isHighScore();
    const highScores = qualifies ? this.saveHighScore() : this.getHighScores();

    const medalClasses = ["gold", "silver", "bronze"];
    const leaderboardItems = highScores
      .map((entry, index) => {
        const medalClass = medalClasses[index] || "";
        return `
          <li class="leaderboard-item ${medalClass}">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-score">${entry.percentage}%</span>
          </li>`;
      })
      .join("");

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>

        ${qualifies ? `
        <div class="new-record-badge">
          <i class="fa-solid fa-star"></i> New High Score!
        </div>` : ""}

        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">
            ${leaderboardItems}
          </ul>
        </div>

        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}
