import { customFunctionState, VARIABLE_NAMES, logicState} from '../state.js';
import {$, truthArrayToTruthTable} from '../utils/utils.js'
import { expressionToLatex, parseLogicFunction, normalizeExpression } from '../logic/parser.js';
import {renderAll} from './ui.js';



export function renderCurrentFunctionExpression() {
  const currentFunction = logicState.preset;
  const nVars = logicState.nVars;
  const currentFunctionEl = $("current-function-expression");
  if (!currentFunctionEl) return;

  // Variable names: A, B, C, D ...
  const usedVars = VARIABLE_NAMES.slice(0, nVars);
  

  let latexToRender = `f(${usedVars.reverse().join(", ")}) = `;

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
    
      latexToRender += expressionToLatex(
        customFunctionState.customFunction
      );
      break;
      
  }

if(currentFunction.toUpperCase() === "CUSTOM") {
    if(!customFunctionState.isEditing) {
        currentFunctionEl.innerHTML = `
        <div class="flex justify-between items-center gap-4">
            <div id="katex-display-preset"></div> 
            <button
            class="flex items-center gap-2 border rounded-lg px-4 font-semibold shadow transition-all duration-150"
            id="edit-custom-function-btn"
            title="Edit custom function"
            >
            <i class="fas fa-edit"></i>
            <span>Edit</span>
            </button>
        </div>`;
    } else {
        console.log("Editing custom function");
        currentFunctionEl.innerHTML = `
        <div class="flex justify-between items-center gap-4">
            <div id="katex-display-preset-edit"></div> 
            <form id="custom-function-form" class="flex-1">
            <input autofocus value="${customFunctionState.customFunction}" type="text" id="custom-function" class="outline-none py-1 px-2 w-full border rounded-lg bg-white text-gray-800 font-mono transition-transform"/>
            </form>
            <button
            class="flex items-center gap-2 border rounded-lg px-4 font-semibold shadow transition-all duration-150"
            id="edit-custom-function-btn"
            title="Save custom function"
            >
            <i class="fas fa-check"></i>
            <span>Save</span>
            </button>
        </div>
        `;
    }
} else {
    currentFunctionEl.innerHTML = `<div id="katex-display-preset">${latexToRender}</div>`;
}   
  

    if (typeof katex !== 'undefined') {
        const container = currentFunctionEl.querySelector('#katex-display-preset');
        const container2 = currentFunctionEl.querySelector("#katex-display-preset-edit")
        if (container) {
                katex.render(latexToRender, container, {throwOnError: false,displayMode: true});
        } 
        if(container2) {
            katex.render(`f(${usedVars.reverse().join(", ")}) = `, container2, {throwOnError: false,displayMode: true});
        }
    }

    // Set up the edit button for custom functions
    const editButton = $("edit-custom-function-btn");
    if (editButton) {
        editButton.onclick = () => {
            if(submitEditCustomFunction(editButton)) {
            renderAll();  
            }
        };
    }
    
    // Set cursor position at the end of the input text when editing
    const customFunctionInput = $("custom-function");
    if (customFunctionInput && customFunctionState.isEditing) {
        setTimeout(() => {
            customFunctionInput.focus();
            customFunctionInput.setSelectionRange(customFunctionInput.value.length, customFunctionInput.value.length);
        }, 0);
        
        // Clear custom validity when user starts typing
        customFunctionInput.addEventListener('input', () => {
            customFunctionInput.setCustomValidity('');
        });
    }
    
    const customFunctionForm = $("custom-function-form");
    if (customFunctionForm) {
        customFunctionForm.onsubmit = (e) => {
            e.preventDefault(); // Prevent form submission
            if(submitEditCustomFunction(editButton)) {
                renderAll(); // Re-render the UI after editing
            }
            
        };
    }
}


function submitEditCustomFunction(editButton) {
    if(customFunctionState.isEditing) {
               
                const customFunctionInput = $("custom-function")
                if(!customFunctionInput) return;
                
                const inputValue = customFunctionInput.value.trim();

                // Clear any previous custom validity error first
                customFunctionInput.setCustomValidity('');

                try {
                    
                    // Validate and parse the custom function
                    const truthArray = parseLogicFunction(inputValue, logicState.nVars);
                    customFunctionState.customFunction = inputValue;
                    
                    
                     // Clear any previous error
                     // Report validity to update UI
                    
                    const truthTable = truthArrayToTruthTable(truthArray, logicState.nVars);

                    logicState.truth = truthTable; // Update the logic state with the new truth table
                    logicState.preset = "custom"; // Set preset to custom
                    // Update the logic state with the new truth table
                    customFunctionState.isEditing = false;
                    editButton.innerHTML = '<i class="fas fa-edit"></i>';
                    return true; // Indicate success

                } catch(error) {
                    // Show error on input
                    console.error('Custom function parsing error:', error);
                    
                    
                    // Style the input to show error
                    customFunctionInput.setCustomValidity(error)
                    customFunctionInput.reportValidity();
                    
                    // Keep editing mode active
                    
                    return false; // Don't proceed to renderAll()
                }

            } else {
                customFunctionState.isEditing = true;
                editButton.innerHTML = '<i class="fas fa-check"></i>'; // Change to check icon
                return true;
            }
}



