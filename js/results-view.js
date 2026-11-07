/**
 * @fileoverview Renders the final results / leaderboard screen.
 */
import { escapeHtml } from "./utils.js";

export default class ResultsView {
  static RANK_CLASSES = ["gold", "silver", "bronze"];

  /**
   * @param {{score:number,total:number,percentage:number,isNewRecord:boolean,highScores:object[]}} result
   * @returns {string} HTML string
   */
  static render(result) {
    const { score, total, percentage, isNewRecord, highScores } = result;
    return `
    <div class="game-card results-card">
      <h2 class="results-title">Quiz Complete!</h2>
      <p class="results-score-display">${score}/${total}</p>
      <p class="results-percentage">${percentage}% Accuracy</p>
      ${
        isNewRecord
          ? `<div class="new-record-badge">
        <i class="fa-solid fa-star"></i> New High Score!
      </div>`
          : ""
      }
      <div class="leaderboard">
        <h4 class="leaderboard-title">
          <i class="fa-solid fa-trophy"></i> Leaderboard
        </h4>
        <ul class="leaderboard-list">
          ${highScores.map((entry, index) => ResultsView.renderRow(entry, index)).join("")}
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

  static renderRow(entry, index) {
    const rankClass = ResultsView.RANK_CLASSES[index] ?? "";
    const name = entry.name ? escapeHtml(entry.name) : `Player ${index + 1}`;
    return `<li class="leaderboard-item ${rankClass}">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${name}</span>
            <span class="leaderboard-score">${escapeHtml(entry.percentage)}%</span>
          </li>`;
  }
}
