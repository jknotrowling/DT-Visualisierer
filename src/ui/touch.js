/**
 * Checks if the current device is a touch-enabled device.
 * @returns {boolean} True if it's a touch device, false otherwise.
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

let selectedElement = null;

/**
 * Adds touch-friendly interaction to an element, with fallback for desktop.
 * On touch devices: single tap to select/deselect, double tap to click.
 * On desktop: hover to highlight, click to execute.
 *
 * @param {HTMLElement} element The element to make touch-friendly.
 * @param {function(HTMLElement, boolean): void} hoverHandler The function to call on hover/selection.
 * @param {function(Event): void} clickHandler The function to call on click/double-tap.
 */
export function addTouchFriendlyInteraction(element, hoverHandler, clickHandler) {
  if (!element) return;

  if (isTouchDevice()) {
    let lastTap = 0;

    element.addEventListener('touchstart', (e) => {
      e.preventDefault(); 
    });

    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      const now = Date.now();
      const timeSinceLastTap = now - lastTap;

      if (timeSinceLastTap < 300) {
        // Double tap
        clickHandler(e);
        lastTap = 0; 
      } else {
        // Single tap
        if (selectedElement === element) {
          // Deselect if the same element is tapped again
          hoverHandler(element, false);
          selectedElement = null;
        } else {
          // Deselect the old element
          if (selectedElement) {
            hoverHandler(selectedElement, false);
          }
          // Select the new element
          hoverHandler(element, true);
          selectedElement = element;
        }
        lastTap = now;
      }
    });

  } else {
    // Desktop interaction
    element.addEventListener('mouseenter', () => hoverHandler(element, true));
    element.addEventListener('mouseleave', () => {
      if (selectedElement !== element) {
        hoverHandler(element, false);
      }
    });
    element.addEventListener('click', clickHandler);
  }
}

/**
 * Sets up touch-friendly interactions for the truth table cells.
 *
 * @param {function(HTMLElement, boolean): void} hoverHandler The hover/selection handler.
 * @param {function(Event): void} clickHandler The click/double-tap handler.
 */
export function setupTouchFriendlyTruthTable(hoverHandler, clickHandler) {
  document.querySelectorAll("#truthTableCard .outCell, #truthTableCard .dontCareCell").forEach((el) => {
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
    addTouchFriendlyInteraction(newEl, hoverHandler, clickHandler);
  });
}

/**
 * Sets up touch-friendly interactions for the symmetry diagram cells.
 *
 * @param {function(HTMLElement, boolean): void} hoverHandler The hover/selection handler.
 * @param {function(Event): void} clickHandler The click/double-tap handler.
 */
export function setupTouchFriendlySymmetryDiagram(hoverHandler, clickHandler) {
  document.querySelectorAll("#symmetry-diagram div[data-bits]").forEach((el) => {
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
  });

  setTimeout(() => {
    document.querySelectorAll("#symmetry-diagram div[data-bits]").forEach((el) => {
      addTouchFriendlyInteraction(el, hoverHandler, clickHandler);
    });
  }, 0);
}

/**
 * Sets up touch-friendly interactions for the expression term elements.
 *
 * @param {function(HTMLElement, boolean): void} hoverHandler The hover/selection handler.
 */
export function setupTouchFriendlyExpressionTerms(hoverHandler) {
  document.querySelectorAll("#expressionsCard .term").forEach((el) => {
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
    if (isTouchDevice()) {
      addTouchFriendlyInteraction(newEl, hoverHandler, () => {});
    } else {
      newEl.addEventListener('mouseenter', () => hoverHandler(newEl, true));
      newEl.addEventListener('mouseleave', () => hoverHandler(newEl, false));
    }
  });
}

document.addEventListener('touchstart', (e) => {
  if (selectedElement && !selectedElement.contains(e.target)) {
    let isInteractive = false;
    let target = e.target;
    while (target && target !== document.body) {
      if (target.classList.contains('interactive-cell')) {
        isInteractive = true;
        break;
      }
      target = target.parentElement;
    }

    if (!isInteractive) {
      // Tapped on a non-interactive area, deselect
      hoverHandler(selectedElement, false);
      selectedElement = null;
    }
  }
}, true);