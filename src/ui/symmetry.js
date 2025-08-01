import { truthTableToSymmetryDiagram, decimalToOctal, getNumberOfRowsAndCols} from '../logic/symmetry.js';


import { VARIABLE_NAMES } from '../state.js';


function renderTopFrameRow(wrapper, numberOfVariables) {
    const topRow = document.createElement("div");
    topRow.classList.add("symmetry-diagram-row", "symmetry-diagram-top-frame-row");
    const {cols} = getNumberOfRowsAndCols(numberOfVariables)
    for (let i = 0; i < cols+2; i++) {
        const cell = document.createElement("div");
        cell.classList.add("symmetry-diagram-frame-cell", "symmetry-diagram-top-frame-cell");
        if(i=== 0) {
            cell.classList.add("symmetry-diagram-left-frame-cell");
        }
        cell.textContent = i === 2 ? VARIABLE_NAMES[0] : " "
        if(i === 2) {
            cell.classList.add("symmetry-diagram-frame-top-label-cell");
        } 
        if(numberOfVariables > 2 && i === 3) {
            cell.classList.add("symmetry-diagram-frame-top-label-cell");
        }
        topRow.appendChild(cell);
    }
    wrapper.appendChild(topRow);
}

function renderBottomFrameRow(wrapper, numberOfVariables) {
    const bottomRow = document.createElement("div");
    bottomRow.classList.add("symmetry-diagram-row", "symmetry-diagram-bottom-frame-cell");
    const {cols} = getNumberOfRowsAndCols(numberOfVariables);
    if(numberOfVariables < 3) return;
    for (let i = 0; i < cols+2; i++) {
        const cell = document.createElement("div");
        cell.classList.add("symmetry-diagram-frame-cell");
        cell.textContent = i === 3 ? VARIABLE_NAMES[2] : " ";
        if(i === 0) {
            cell.classList.add("symmetry-diagram-left-frame-cell");
        }
        if(i === 3) {
            cell.classList.add("symmetry-diagram-frame-bottom-label-cell");
        }
        if(numberOfVariables > 2 && i === 4) {
            cell.classList.add("symmetry-diagram-frame-bottom-label-cell");
        }
        bottomRow.appendChild(cell);
    }
    wrapper.appendChild(bottomRow);
}

function renderLeftFrameCell(row, index, numberOfVariables) {
    const leftCell = document.createElement("div");
    leftCell.classList.add("symmetry-diagram-frame-cell", "symmetry-diagram-left-frame-cell",);
    leftCell.textContent = index === 1 ? VARIABLE_NAMES[1] : " ";
    if(index === 1) {
        leftCell.classList.add("symmetry-diagram-frame-left-label-cell");
    } else if (numberOfVariables > 2 && index === 2) {
        leftCell.classList.add("symmetry-diagram-frame-left-label-cell");
    }
    row.appendChild(leftCell);

}

function renderRightFrameCell(row, index, numberOfVariables) {
    const rightCell = document.createElement("div");
    rightCell.classList.add("symmetry-diagram-frame-cell", "symmetry-diagram-right-frame-cell");
    if(numberOfVariables < 4) return;
    rightCell.textContent = index === 2 ? VARIABLE_NAMES[3] : " ";
    if(index === 2) {
        rightCell.classList.add("symmetry-diagram-frame-right-label-cell");
    } else if (numberOfVariables > 2 && index === 3) {
        rightCell.classList.add("symmetry-diagram-frame-right-label-cell");
    }
    row.appendChild(rightCell);
}




export function renderSymmetryDiagram(numberOfVariables, truthTable) {

    if(numberOfVariables < 2 || numberOfVariables > 4) {
        throw new Error("'numberOfVariables' must be an integer ∈ [2, 4]");

    }

    const symmetryDiagramBox = document.getElementById("symmetry-diagram");
    symmetryDiagramBox.innerHTML = "";
    const symmetryDiagram = truthTableToSymmetryDiagram(numberOfVariables, truthTable.map((el, i) => ({ val: el, index: i })));

    // Outer flex wrapper
    const outerFlex = document.createElement("div");
    outerFlex.className = "flex-1 flex justify-center items-start";
    const centerFlex = document.createElement("div");
    centerFlex.className = "w-full flex justify-center";
    const selectNone = document.createElement("div");
    selectNone.className = "select-none";
    const relativeDiv = document.createElement("div");
    relativeDiv.className = "relative";

    // Top frame row
    renderTopFrameRow(relativeDiv, numberOfVariables);

    // Main diagram rows
    for (let r = 0; r < symmetryDiagram.length; r++) {
        const diagrammRow = symmetryDiagram[r];
        const row = document.createElement("div");
        row.className = "flex items-center gap-[2px] mb-[2px]";

        renderLeftFrameCell(row, r, numberOfVariables);

        for (let c = 0; c < diagrammRow.length; c++) {
            const cellData = diagrammRow[c];
            const decimalIndex = cellData.index;
            const octalIndexValue = decimalToOctal(cellData.index);
            // Tailwind cell color
            let colorClass = "";
            if (cellData.val === null) {
                colorClass = "bg-yellow-100 border-yellow-500 text-yellow-700";
            } else if (cellData.val) {
                colorClass = "bg-green-100 border-green-600 text-green-700";
            } else {
                colorClass = "bg-white border-gray-300 text-gray-800";
            }
            const cell = document.createElement("div");
            cell.className = `w-[54px] h-[54px] text-center flex justify-center items-center border-2 aspect-square relative box-border select-none font-semibold transition-all duration-200 border-gray-300 rounded-lg ${colorClass}`;
            cell.setAttribute("data-bits", decimalIndex.toString(2).padStart(numberOfVariables, '0').split('').reverse().join(''));

            // Octal index
            const octalIndex = document.createElement("span");
            octalIndex.textContent = octalIndexValue;
            octalIndex.className = "absolute bottom-0 right-0 text-[12px] text-blue-600 pr-[2px] pb-[1px] font-mono";
            cell.appendChild(octalIndex);

            // Value
            const content = document.createElement("span");
            content.textContent = cellData.val ?? "-";
            content.className = "text-xl";
            cell.appendChild(content);

            row.appendChild(cell);
        }

        renderRightFrameCell(row, r, numberOfVariables);
        relativeDiv.appendChild(row);
    }

    // Bottom frame row
    renderBottomFrameRow(relativeDiv, numberOfVariables);

    selectNone.appendChild(relativeDiv);
    centerFlex.appendChild(selectNone);
    outerFlex.appendChild(centerFlex);
    symmetryDiagramBox.appendChild(outerFlex);
}



