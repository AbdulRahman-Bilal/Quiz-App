/**
 * @fileoverview QuizApp - application controller. Wires the setup form,
 * the quiz session and the results / error screens together.
 */
import Quiz from "./quiz.js";
import Question from "./question.js";
import ResultsView from "./results-view.js";
import UIController from "./ui-controls.js";
import { escapeHtml } from "./utils.js";
import { sounds } from "./sound-manager.js";

class QuizApp {
  static MIN_QUESTIONS = 1;
  static MAX_QUESTIONS = 50;
  static DEFAULT_QUESTIONS = 10;

  constructor() {
    this.optionsContainer = document.getElementById("quizOptions");
    this.questionsContainer = document.getElementById("questionsContainer");
    this.questionsNumberInput = document.getElementById("questionsNumber");
    this.playerNameInput = document.getElementById("playerName");
    this.categorySelect = document.getElementById("categorySelect");
    this.difficultySelect = document.getElementById("difficultySelect");
    this.startQuizBtn = document.getElementById("startQuiz");

    this.ui = new UIController();
    this.quiz = null;
    this.question = null;
    this.isLoading = false;
    this.formErrorTimeout = null;

    this.bindEvents();
  }

  bindEvents() {
    this.questionsContainer.addEventListener("click", (e) => {
      if (e.target.closest(".retry-btn")) this.showSetup({ keepSettings: true });
      else if (e.target.closest(".btn-restart")) this.showSetup();
    });
    this.startQuizBtn.addEventListener("click", () => this.startQuiz());
    this.questionsNumberInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.startQuiz();
      }
    });
  }

  /* ---------- validation ---------- */

  /** @returns {{isValid:boolean,error:string|null}} */
  validateForm() {
    const raw = this.questionsNumberInput.value.trim();
    if (raw === "") {
      return { isValid: false, error: "Please enter the number of questions." };
    }
    const value = Number(raw);
    if (!Number.isInteger(value)) {
      return { isValid: false, error: "Please enter a whole number." };
    }
    if (value < QuizApp.MIN_QUESTIONS) {
      return {
        isValid: false,
        error: `Minimum ${QuizApp.MIN_QUESTIONS} question required.`,
      };
    }
    if (value > QuizApp.MAX_QUESTIONS) {
      return {
        isValid: false,
        error: `Maximum ${QuizApp.MAX_QUESTIONS} questions allowed.`,
      };
    }
    return { isValid: true, error: null };
  }

  /* ---------- screens ---------- */

  showLoading() {
    this.questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
`;
  }

  showError(message) {
    this.questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${escapeHtml(message)}</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
`;
  }

  showFormError(message) {
    document.querySelector(".form-error")?.remove();
    clearTimeout(this.formErrorTimeout);
    const errorDiv = document.createElement("div");
    errorDiv.className = "form-error";
    errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${escapeHtml(message)}`;
    this.startQuizBtn.before(errorDiv);
    this.formErrorTimeout = setTimeout(() => errorDiv.remove(), 3000);
  }

  showResults() {
    const result = this.quiz.endQuiz();
    this.questionsContainer.innerHTML = ResultsView.render(result);
  }

  /**
   * Go back to the setup form.
   * @param {{keepSettings?: boolean}} [options] keep the user's choices
   *   (used after an error) instead of resetting everything.
   */
  showSetup({ keepSettings = false } = {}) {
    this.stopCurrentQuestion();
    this.questionsContainer.innerHTML = "";
    if (!keepSettings) {
      this.questionsNumberInput.value = QuizApp.DEFAULT_QUESTIONS;
      this.playerNameInput.value = "";
      this.ui.resetSelects();
      this.quiz = null;
    }
    this.optionsContainer.classList.remove("hidden");
  }

  stopCurrentQuestion() {
    this.question?.destroy();
    this.question = null;
  }

  /* ---------- game flow ---------- */

  async startQuiz() {
    if (this.isLoading) return;
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.showFormError(validation.error);
      return;
    }

    this.quiz = new Quiz(
      this.ui.getSelectValue(this.categorySelect),
      this.ui.getSelectValue(this.difficultySelect),
      this.questionsNumberInput.value,
      this.playerNameInput.value,
    );

    sounds.unlock(); // the click on Start allows audio to play later
    this.isLoading = true;
    this.optionsContainer.classList.add("hidden");
    this.showLoading();
    try {
      await this.quiz.getQuestions();
      this.questionsContainer.innerHTML = "";
      new Question(
        this.quiz,
        this.questionsContainer,
        () => this.showResults(),
        (question) => {
          this.question = question;
        },
      ).displayQuestion();
    } catch (error) {
      this.showError(error.message || "Failed to load questions.");
    } finally {
      this.isLoading = false;
    }
  }
}

new QuizApp();
