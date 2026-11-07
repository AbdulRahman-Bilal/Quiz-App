/**
 * @fileoverview Quiz model: owns the session state (questions, index, score),
 * talks to the Open Trivia DB API and persists the leaderboard.
 */

const API_URL = "https://opentdb.com/api.php";
const STORAGE_KEY = "quizHighScores";
const MAX_HIGH_SCORES = 10;

/** Human friendly messages for Open Trivia DB `response_code` values. */
const API_ERRORS = {
  1: "Not enough questions are available for this category and difficulty. Try fewer questions or another category.",
  2: "The request was invalid. Please check your settings and try again.",
  3: "The quiz session expired. Please try again.",
  4: "No more questions are available. Please try again.",
  5: "Too many requests. Please wait a few seconds and try again.",
};

export default class Quiz {
  constructor(categoryId, difficulty, questionsNumber, playerName) {
    this.category = categoryId;
    this.difficulty = difficulty;
    this.numberOfQuestions = Number(questionsNumber);
    this.playerName = (playerName || "").trim();
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  /**
   * Fetch questions from the API and store them on the instance.
   * Throws an Error whose message is safe to show to the user.
   * @returns {Promise<object[]>}
   */
  async getQuestions() {
    let res;
    try {
      res = await fetch(
        this.buildApiUrl(this.category, this.difficulty, this.numberOfQuestions),
      );
    } catch {
      throw new Error("Network error. Please check your connection.");
    }
    if (res.status === 429) {
      throw new Error(API_ERRORS[5]);
    }
    if (!res.ok) {
      throw new Error(`Failed to load questions (HTTP ${res.status}).`);
    }
    const data = await res.json();
    if (data.response_code !== 0) {
      throw new Error(
        API_ERRORS[data.response_code] || "Failed to load questions.",
      );
    }
    this.questions = data.results;
    // Keep the total in sync with what the API actually returned.
    this.numberOfQuestions = this.questions.length;
    return this.questions;
  }

  buildApiUrl(category, difficulty, numberOfQuestions) {
    const params = new URLSearchParams({
      amount: numberOfQuestions,
      difficulty,
      type: "multiple",
    });
    // "Random category" = no category parameter at all.
    if (category) params.set("category", category);
    return `${API_URL}?${params}`;
  }

  incrementScore() {
    this.score++;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] ?? null;
  }

  /**
   * Move to the next question.
   * @returns {boolean} true if there is another question, false if finished.
   */
  nextQuestion() {
    this.currentQuestionIndex++;
    return this.currentQuestionIndex < this.questions.length;
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    if (!this.numberOfQuestions) return 0;
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  getHighScores() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  /** True if this result would make it onto the leaderboard. */
  qualifiesForLeaderboard(highScores = this.getHighScores()) {
    return (
      highScores.length < MAX_HIGH_SCORES ||
      this.getScorePercentage() > highScores[highScores.length - 1].percentage
    );
  }

  /** True if this result beats every score already on the leaderboard. */
  isNewRecord(highScores = this.getHighScores()) {
    const percentage = this.getScorePercentage();
    if (percentage === 0) return false;
    return highScores.every((entry) => percentage > entry.percentage);
  }

  saveHighScore(highScores = this.getHighScores()) {
    const updated = [
      ...highScores,
      {
        name: this.playerName,
        score: this.score,
        total: this.numberOfQuestions,
        percentage: this.getScorePercentage(),
        difficulty: this.difficulty,
        date: Date.now(),
      },
    ]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, MAX_HIGH_SCORES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage may be full or blocked (private mode): the game still works.
    }
    return updated;
  }

  /**
   * Finish the quiz: decide about the leaderboard BEFORE saving so the
   * "new record" flag is computed against the previous scores.
   * @returns {{score:number,total:number,percentage:number,isNewRecord:boolean,highScores:object[]}}
   */
  endQuiz() {
    const previous = this.getHighScores();
    const isNewRecord = this.isNewRecord(previous);
    const highScores = this.qualifiesForLeaderboard(previous)
      ? this.saveHighScore(previous)
      : previous;
    return {
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      isNewRecord,
      highScores,
    };
  }
}
