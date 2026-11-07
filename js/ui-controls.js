/**
 * @fileoverview UIController - custom select dropdowns and number-input
 * stepper buttons. Owns the DOM wiring for the setup form controls.
 */
export default class UIController {
  /**
   * @param {Document|HTMLElement} [root=document]
   */
  constructor(root = document) {
    this.root = root;
    this.selects = [...root.querySelectorAll(".custom-select")];
    this.numberButtons = [...root.querySelectorAll(".number-btn")];
    this.init();
  }

  init() {
    this.initCustomSelects();
    this.initNumberInputs();
    this.initClickOutside();
  }

  /* ---------- custom selects ---------- */

  initCustomSelects() {
    this.selects.forEach((select) => {
      // Remember the initial value so reset() can restore it.
      select.dataset.default = select.dataset.value ?? "";

      const trigger = select.querySelector(".custom-select-trigger");
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeAllSelects(select);
        select.classList.toggle("open");
      });

      select.querySelectorAll(".custom-select-option").forEach((option) => {
        option.addEventListener("click", () =>
          this.selectOption(select, option),
        );
      });
    });
  }

  /** Apply an option to its select: value, label, icon and highlight. */
  selectOption(select, option) {
    const hiddenInput = select.parentElement.querySelector(
      'input[type="hidden"]',
    );
    const textSpan = select.querySelector(".custom-select-text");
    const iconSpan = select.querySelector(".custom-select-icon");
    const icon = option.querySelector("i");

    select.dataset.value = option.dataset.value;
    if (hiddenInput) hiddenInput.value = option.dataset.value;
    textSpan.textContent = option.textContent.trim();
    if (icon) iconSpan.innerHTML = icon.outerHTML;

    select
      .querySelectorAll(".custom-select-option")
      .forEach((o) => o.classList.toggle("selected", o === option));
    select.classList.remove("open");
  }

  closeAllSelects(except = null) {
    this.root.querySelectorAll(".custom-select.open").forEach((s) => {
      if (s !== except) s.classList.remove("open");
    });
  }

  initClickOutside() {
    document.addEventListener("click", () => this.closeAllSelects());
  }

  /** @returns {string} the current value of a custom select */
  getSelectValue(select) {
    return select.dataset.value ?? "";
  }

  /** Restore every custom select to the value it had on page load. */
  resetSelects() {
    this.selects.forEach((select) => {
      const option = [...select.querySelectorAll(".custom-select-option")].find(
        (o) => o.dataset.value === select.dataset.default,
      );
      if (option) this.selectOption(select, option);
    });
  }

  /* ---------- number input ---------- */

  initNumberInputs() {
    this.numberButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.stepNumber(btn));
    });
  }

  stepNumber(btn) {
    const input = btn
      .closest(".number-input-wrapper")
      .querySelector('input[type="number"]');
    const min = parseInt(input.min, 10) || 1;
    const max = parseInt(input.max, 10) || 50;
    const value = parseInt(input.value, 10) || min;

    if (btn.dataset.action === "increment" && value < max) {
      input.value = value + 1;
    } else if (btn.dataset.action === "decrement" && value > min) {
      input.value = value - 1;
    } else if (btn.dataset.action === "increment") {
      input.value = max;
    } else if (btn.dataset.action === "decrement") {
      input.value = min;
    }
  }
}
