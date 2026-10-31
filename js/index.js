import Quiz from "./quiz.js";
import Question from "./question.js";

// ===== DOM =====
const quizForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyInput = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.getElementById("questionsContainer");

let currentQuiz = null;

// ===== Loading & Error =====
function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>`;
}

function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>`;
  questionsContainer.querySelector(".retry-btn").addEventListener("click", resetToStart);
}

// ===== Validation =====
function validateForm() {
  const value = questionsNumber.value;
  if (value === "") return "Please enter the number of questions.";
  if (Number(value) < 1) return "Minimum is 1 question.";
  if (Number(value) > 50) return "Maximum is 50 questions.";
  return null;
}

function showFormError(message) {
  const old = quizForm.querySelector(".form-error");
  if (old) old.remove();

  const div = document.createElement("div");
  div.className = "form-error";
  div.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
  startQuizBtn.before(div);

  setTimeout(() => div.remove(), 3000);
}

// ===== Reset =====
function resetToStart() {
  questionsContainer.innerHTML = "";
  quizForm.style.display = "";
  currentQuiz = null;
}

// ===== Start =====
async function startQuiz() {
  const error = validateForm();
  if (error) {
    showFormError(error);
    return;
  }

  currentQuiz = new Quiz(
    playerNameInput.value.trim() || "Player",
    categoryInput.value,
    difficultyInput.value,
    Number(questionsNumber.value)
  );

  quizForm.style.display = "none";
  showLoading();

  try {
    await currentQuiz.getQuestions();
    const firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (err) {
    showError(err.message);
  }
}

// ===== Events =====
quizForm.addEventListener("submit", (e) => e.preventDefault());
startQuizBtn.addEventListener("click", startQuiz);
questionsNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startQuiz();
});
