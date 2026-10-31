export default class Quiz {
  constructor(playerName, category, difficulty, numberOfQuestions) {
    this.playerName = playerName;
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
  }

  async getQuestions() {
    let url = `https://opentdb.com/api.php?amount=${this.numberOfQuestions}&difficulty=${this.difficulty}`;
    if (this.category) {
      url += `&category=${this.category}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.response_code === 5) {
      throw new Error("Too many requests. Wait 5 seconds and try again.");
    }
    if (data.response_code !== 0) {
      throw new Error("Not enough questions for these options. Try fewer questions.");
    }

    this.questions = data.results;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  incrementScore() {
    this.score++;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    return this.currentQuestionIndex < this.questions.length;
  }

  endQuiz() {
    const percentage = Math.round((this.score / this.numberOfQuestions) * 100);

    const oldScores = JSON.parse(localStorage.getItem("leaderboard")) || [];
    const isRecord = percentage > 0 && oldScores.every((p) => percentage > p.percentage);

    oldScores.push({ name: this.playerName, percentage });
    oldScores.sort((a, b) => b.percentage - a.percentage);
    const top3 = oldScores.slice(0, 3);
    localStorage.setItem("leaderboard", JSON.stringify(top3));

    const medals = ["gold", "silver", "bronze"];
    const rows = top3
      .map(
        (p, i) => `
        <li class="leaderboard-item ${medals[i]}">
          <span class="leaderboard-rank">#${i + 1}</span>
          <span class="leaderboard-name">${p.name}</span>
          <span class="leaderboard-score">${p.percentage}%</span>
        </li>`
      )
      .join("");

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>
        ${isRecord ? `<div class="new-record-badge"><i class="fa-solid fa-star"></i> New High Score!</div>` : ""}
        <div class="leaderboard">
          <h4 class="leaderboard-title"><i class="fa-solid fa-trophy"></i> Leaderboard</h4>
          <ul class="leaderboard-list">${rows}</ul>
        </div>
        <div class="action-buttons">
          <button class="btn-restart"><i class="fa-solid fa-rotate-right"></i> Play Again</button>
        </div>
      </div>`;
  }
}
