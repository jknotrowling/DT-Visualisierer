import { customFunctionState, VARIABLE_NAMES, logicState} from '../state.js';
import {$} from '../utils/utils.js'
import { normalizedExpressionToLatex, parseLogicFunction, normalizeExpression } from '../logic/parser.js';
import {renderAll} from './ui.js';



export function renderCurrentFunctionExpression() {
  const currentFunction = logicState.preset;
  const nVars = logicState.nVars;
  const currentFunctionEl = $("current-function-expression");
  if (!currentFunctionEl) return;

  // Variable names: A, B, C, D ...
  const usedVars = VARIABLE_NAMES.slice(0, nVars);
  

  let latexToRender = `f(${usedVars.join(", ")}) = `;

  switch ((currentFunction || "").toUpperCase()) {
    case "XOR":
        latexToRender += usedVars.join(" \\oplus ");
      break;
    case "AND":
      latexToRender += usedVars.join(" \\land ");
      break;
    case "OR":
      latexToRender += usedVars.join(" \\lor ");
      break;
    case "NAND": {
      latexToRender += `\\overline{${usedVars.join(" \\land ")}}`;
      break;
    }
    case "NOR": {
    latexToRender += `\\overline{${usedVars.join(" \\lor ")}}`;
      break;
    }
    case "XNOR":
    latexToRender += `\\overline{${usedVars.join(" \\oplus ")}}`;
      break;
    case "CUSTOM":
      latexToRender += normalizedExpressionToLatex(
        normalizeExpression(customFunctionState.customFunction)
      );
      break;
      
  }

if(currentFunction.toUpperCase() === "CUSTOM") {
    if(!customFunctionState.isEditing) {
        currentFunctionEl.innerHTML = `
        <div class="flex justify-between items-center gap-4">
            <div id="katex-display-preset">${latexToRender}</div> 
            <button
                class="text-lg border rounded-lg p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold w-10 h-10 flex items-center justify-center"
                id="edit-custom-function-btn"
            >
                ✎
            </button>
        </div>
    `;
    } else {
        currentFunctionEl.innerHTML = `
        <div class="flex justify-between items-center gap-4">
            <input value="${customFunctionState.customFunction}" type="text" id="custom-function" class="flex-1 p-2 border rounded-lg bg-white text-gray-800 font-mono" placeholder="Enter custom function" />
            <button
                class="text-lg border rounded-lg p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold w-10 h-10 flex items-center justify-center"
                id="edit-custom-function-btn"
            >
                ✔
            </button>
        </div>
    `;
    }
} else {
    currentFunctionEl.innerHTML = `<div id="katex-display-preset">${latexToRender}</div>`;
}   
  
  

    if (typeof katex !== 'undefined') {
        const container = currentFunctionEl.querySelector('#katex-display-preset');
        if (container) {
            try {
                katex.render(latexToRender, container, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (error) {
                console.error('KaTeX rendering error:', error);
                container.textContent = latexToRender;
            }
        } else {
            console.error('Container for KaTeX rendering not found');
        }
    }

    // Set up the edit button for custom functions
    const editButton = $("edit-custom-function-btn");
    if (editButton) {
        editButton.onclick = () => {
            if(customFunctionState.isEditing) {
                customFunctionState.isEditing = false;
                editButton.textContent = "✎";
                const customFunctionInput = $("custom-function")
                const inputValue = customFunctionInput.value.trim();

                try {
                    // Validate and parse the custom function
                    const parsedFunction = parseLogicFunction(inputValue, logicState.nVars);
                    customFunctionState.customFunction = inputValue;
                    customFunctionState.isValid = true; // Set to true if parsing is successful
                    
                    // Clear any previous error styling
                    customFunctionInput.style.borderColor = '';
                    customFunctionInput.style.backgroundColor = '';
                    customFunctionInput.title = '';

                } catch(error) {
                    // Show error on input
                    console.error('Custom function parsing error:', error);
                    customFunctionState.isValid = false;
                    
                    // Style the input to show error
                    customFunctionInput.setCustomValidity(error.message);
                    customFunctionInput.reportValidity();
                    
                    // Keep editing mode active
                    customFunctionState.isEditing = true;
                    editButton.textContent = "✔";
                    return; // Don't proceed to renderAll()
                }

            } else {
                customFunctionState.isEditing = true;
                editButton.textContent = "✔"; // Change to check icon
            }
            renderAll();
            
}


}
}
