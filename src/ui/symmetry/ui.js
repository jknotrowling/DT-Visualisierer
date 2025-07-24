import { truthTableToSymmetryDiagram, decimalToOctal, getNumberOfRowsAndCols} from '../../logic/symmetry.js';


import { VARIABLE_NAMES } from '../../index.js';


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
    leftCell.classList.add("symmetry-diagram-frame-cell", "symmetry-diagram-left-frame-cell");
    

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

    symmetryDiagramBox.innerHTML = ""; // Clear previous content

    

  
    const symmetryDiagram = truthTableToSymmetryDiagram( numberOfVariables, truthTable.map((el, i) =>( {val: el, index: i})));

    const wrapper = document.createElement("div");
    wrapper.classList.add("symmetry-diagram-table");
    
    renderTopFrameRow(wrapper, numberOfVariables);


    for (let r = 0; r < symmetryDiagram.length; r++) {
        const diagrammRow = symmetryDiagram[r];
        const row = document.createElement("div");
        row.classList.add("symmetry-diagram-row")

        renderLeftFrameCell(row, r, numberOfVariables);

        for (let c = 0; c < diagrammRow.length; c++) {
            const cell = document.createElement("div");
            cell.classList.add(diagrammRow[c].val ? "on" : (diagrammRow[c].val === null ? "dc": "off"))
            cell.classList.add("symmetry-diagram-cell", "outCell")
            const decimalIndex = diagrammRow[c].index;
            const binaryMSB = decimalIndex.toString(2).padStart(numberOfVariables, '0');
            const binaryLSB = binaryMSB.split('').reverse().join('');
            cell.setAttribute("data-bits", binaryLSB);
            const octalIndexValue = decimalToOctal(diagrammRow[c].index);

            const octalIndex = document.createElement("span");
            octalIndex.textContent = octalIndexValue;
            octalIndex.classList.add("octal-index")

            cell.appendChild(octalIndex);
            const content = document.createElement("span");
            content.textContent = diagrammRow[c].val ?? "-"

            cell.appendChild(content);

            row.appendChild(cell);
        }

        renderRightFrameCell(row, r, numberOfVariables);

        wrapper.appendChild(row);
    }

    renderBottomFrameRow(wrapper, numberOfVariables);

    symmetryDiagramBox.appendChild(wrapper);
}




