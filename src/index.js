
import { init } from "./ui/ui.js";

import { applyPreset } from "./utils/utils.js";

import { logicState, customFunctionState } from "./state.js";


applyPreset(logicState);







// --- Initial Setup ---
// DOMContentLoaded to ensure all elements are available, especially for querySelector.

document.addEventListener("DOMContentLoaded", () => {
  init();
  // Preset button logic
  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove 'active' class from all buttons
      presetBtns.forEach(b => {
        b.classList.remove('active', 'bg-gray-700', 'border-gray-700', 'shadow-md', 'text-white', 'font-bold');
        b.classList.add('bg-white', 'border-gray-300', 'shadow-sm', 'text-gray-700', 'font-semibold');
      });
      // Add 'active' class to clicked button
      btn.classList.add('active', 'bg-gray-700', 'border-gray-700', 'shadow-md', 'text-white', 'font-bold');
      btn.classList.remove('bg-white', 'border-gray-300', 'shadow-sm', 'text-gray-700', 'font-semibold');
      // Get selected value
      const value = btn.getAttribute('data-value');
      // Update logicState and trigger UI update
      logicState.preset = value;
      
      // Enable editing mode when custom is selected
      if (value === 'custom') {
        customFunctionState.isEditing = true;
      }
      
      if (typeof updateLogicFunction === 'function') {
        updateLogicFunction(value);
      } else if (typeof init === 'function') {
        init(); // fallback: re-init UI
      }
    });
  });
});




