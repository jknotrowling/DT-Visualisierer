import { customFunctionState, VARIABLE_NAMES, logicState} from '../state.js';
import {$, truthArrayToTruthTable} from '../utils/utils.js'
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
      latexToRender += usedVars.join(" \\;\\&\\;");
      break;
    case "OR":
      latexToRender += usedVars.join(" \\lor ");
      break;
    case "NAND": {
      latexToRender += `\\overline{${usedVars.join(" \\;\\&\\; ")}}`;
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
                <i class="fas fa-edit"></i>
            </button>
        </div>
    `;
    } else {
        currentFunctionEl.innerHTML = `
        <div class="flex justify-between items-center gap-4">
            <input value="${customFunctionState.customFunction}" type="text" id="custom-function" class="w-full flex-1 p-2 border rounded-lg bg-white text-gray-800 font-mono"/>
            <button
                class="text-lg border rounded-lg p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold w-10 h-10 flex items-center justify-center"
                id="edit-custom-function-btn"
            >
                <i class="fas fa-check"></i>
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
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                const customFunctionInput = $("custom-function")
                const inputValue = customFunctionInput.value.trim();

                try {
                    // Validate and parse the custom function
                    const truthArray = parseLogicFunction(inputValue, logicState.nVars);
                    customFunctionState.customFunction = inputValue;
                    customFunctionState.isValid = true; // Set to true if parsing is successful
                    
                    customFunctionInput.setCustomValidity(""); // Clear any previous error
                    customFunctionInput.reportValidity(); // Report validity to update UI
                    
                    const truthTable = truthArrayToTruthTable(truthArray, logicState.nVars);

                    logicState.truth = truthTable; // Update the logic state with the new truth table
                    logicState.preset = "custom"; // Set preset to custom
                    // Update the logic state with the new truth table

                } catch(error) {
                    // Show error on input
                    console.error('Custom function parsing error:', error);
                    customFunctionState.isValid = false;
                    
                    // Style the input to show error
                    customFunctionInput.setCustomValidity(error.message);
                    customFunctionInput.reportValidity();
                    
                    // Keep editing mode active
                    customFunctionState.isEditing = true;
                    editButton.innerHTML = '<i class="fas fa-check"></i>';
                    return; // Don't proceed to renderAll()
                }

            } else {
                customFunctionState.isEditing = true;
                editButton.innerHTML = '<i class="fas fa-check"></i>'; // Change to check icon
            }
            renderAll();
            
}


}
}
