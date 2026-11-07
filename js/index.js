import Quiz from "./quiz.js";
import Question from "./question.js";
const optionsContainer = document.getElementById("quizOptions");
const questionsContainer = document.getElementById("questionsContainer");
const questionsNumberInput = document.getElementById("questionsNumber");
const playerNameInput = document.getElementById("playerName");
const category = document.getElementById("categorySelect");
const diffeculty = document.getElementById("difficultySelect");
const startQuizBtn = document.getElementById("startQuiz");
questionsContainer.addEventListener("click", function (e) {
  if (e.target.closest(".retry-btn")) resetToStart();
});
let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
`;
}
function hideLoading() {
  questionsContainer.innerHTML = "";
}
function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>

`;
}
function validateForm() {
  let obj = { isValid: false, error: null };
  if (questionsNumberInput.value < 1)
    obj.error = "Minimum 1 question required.";
  else if (questionsNumberInput.value > 50)
    obj.error = "Maximum 50 questions allowed.";
  else if (!questionsNumberInput.value)
    obj.error = "Please enter the number of questions";
  else {
    obj.isValid = true;
  }
  return obj;
}

function showFormError(message) {
  const existing = document.querySelector(".form-error");
  if (existing) existing.remove();
  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
  startQuizBtn.before(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}
function resetToStart() {
  questionsContainer.innerHTML = "";
  questionsNumberInput.value = 10;
  playerNameInput.value = "";
  category.setAttribute("data-value", "");
  category.querySelector(".custom-select-text").textContent = "Random Category";
  diffeculty.setAttribute("data-value", "easy");
  diffeculty.querySelector(".custom-select-text").textContent = "Easy Mode";
  optionsContainer.classList.remove("hidden");
  currentQuiz = null;
}
async function startQuiz() {
  const valid = validateForm();
  if (!valid.isValid) {
    showFormError(valid.error);
    return;
  }
  let categoryId = category.getAttribute("data-value");
  let diffecultyId = diffeculty.getAttribute("data-value");
  const questionsNumber = questionsNumberInput.value;
  const playerName = playerNameInput.value;

  currentQuiz = new Quiz(categoryId, diffecultyId, questionsNumber, playerName);
  optionsContainer.classList.add("hidden");
  showLoading();
  try {
    await currentQuiz.getQuestions();
    hideLoading();
    let question = new Question(currentQuiz, questionsContainer, resetToStart);
    question.displayQuestion();
  } catch (error) {
    hideLoading();
  }
}
startQuizBtn.addEventListener("click", async function () {
  await startQuiz();
});
questionsNumberInput.addEventListener("keydown", async function (e) {
  if (e.key === "Enter") {
    await startQuiz();
  }
});
