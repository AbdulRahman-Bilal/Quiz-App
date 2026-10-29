import Quiz from './quiz.js';
import Question from './question.js';

const quizOptionsForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.querySelector(".questions-container");
let currentQuiz = null;

function showLoading() {
  const loadingHtml = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
  questionsContainer.innerHTML = loadingHtml;
}

function hideLoading() {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
}

function showError(message) {
  const errorHtml = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}. Please try again.</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;
  questionsContainer.innerHTML = errorHtml;
  const retryBtn = document.querySelector(".retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", resetToStart);
  }
}

function validateForm() {
  if (
    questionsNumber.value != null &&
    questionsNumber.value !== '' &&
    questionsNumber.value >= 1 &&
    questionsNumber.value <= 50
  ) {
    return { isValid: true, error: null };
  }
  return { isValid: false, error: 'Please enter a number between 1 and 50.' };
}

function showFormError() {
  const errorDiv = `
    <div class="form-error">
      <i class="fa-solid fa-circle-exclamation"></i> Please enter the number of questions.
    </div>
  `;
  document.getElementById("errorDiv").innerHTML = errorDiv;
  setTimeout(() => {
    const errorDivHtml = document.getElementById("errorDiv");
    errorDivHtml.style.transition = 'opacity 1s ease';
    errorDivHtml.style.opacity = '0';
    errorDivHtml.classList.add("hidden");
  }, 3000);
}

function resetCustomSelect(selectId, defaultValue, defaultText, defaultIconClass) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const hiddenInput = select.parentElement.querySelector('input[type="hidden"]');
  const textSpan = select.querySelector('.custom-select-text');
  const iconSpan = select.querySelector('.custom-select-icon');
  const options = select.querySelectorAll('.custom-select-option');

  select.dataset.value = defaultValue;
  if (hiddenInput) hiddenInput.value = defaultValue;
  if (textSpan) textSpan.textContent = defaultText;
  if (iconSpan) iconSpan.innerHTML = `<i class="${defaultIconClass}"></i>`;

  options.forEach(o => o.classList.remove('selected'));
  const defaultOption = select.querySelector(`.custom-select-option[data-value="${defaultValue}"]`);
  if (defaultOption) defaultOption.classList.add('selected');
}

function resetToStart() {
  questionsContainer.innerHTML = '';
  playerNameInput.value = '';
  categoryInput.value = '';
  difficultyOptions.value = 'easy';
  questionsNumber.value = 10;

  resetCustomSelect('categorySelect', '', 'Random Category', 'fa-solid fa-shuffle');
  resetCustomSelect('difficultySelect', 'easy', 'Easy Mode', 'fa-solid fa-face-smile');

  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}

async function startQuiz() {
  const userText = questionsNumber.value;
  const questionNumberRegex = /^(?:[1-9]|[1-4][0-9]|50)$/;
  if (!questionNumberRegex.test(userText)) {
    showFormError();
    return;
  }

  let playerName;
  if (!playerNameInput.value) {
    playerName = 'Player';
  } else {
    playerName = playerNameInput.value;
  }

  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = questionsNumber.value;

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);
  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();
    if (currentQuiz.questions.length === 0) {
      showError("No questions found. Please try different options.");
      return;
    }
    const firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError("Something went wrong while fetching questions. Please try again.");
  }
}

startQuizBtn.addEventListener("click", startQuiz);

questionsNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    startQuiz();
  }
});