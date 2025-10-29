import { expansionState } from "../state.js";

function genSpanId() {
    return `expSpan-${expansionState.spanIdCounter++}`;
}
function genGroupId() {
    return `expGroup-${expansionState.groupIdCounter++}`;
}


/**
 * Recursively generates the HTML for the Shannon expansion expression.
 * @param {object} node - The current node in the expansion tree.
 * @param {Array<string>} [ancestorGroupChain=[]] - The chain of group IDs from the ancestors.
 * @returns {string} The generated HTML string.
 */
export function generateExpansionHtmlRecursive(node, ancestorGroupChain = []) {
    let htmlOutput = "";
    const styleType = "color";

    if (node.type === "constant") {
        const id = genSpanId();
        let currentGroupChain = ancestorGroupChain;
        if (ancestorGroupChain.length === 0) {
            currentGroupChain = [genGroupId()];
        }
        expansionState.spanData[id] = {
            minterms: node.minterms,
            textContent: node.value,
            isLeaf: true,
            path: node.path,
            groupChain: currentGroupChain,
            styleType: styleType,
        };
        htmlOutput = `<span id="${id}" data-span-id="${id}">${node.value}</span>`;
    } else if (node.type === "expression") {
        const { variable, positiveBranch, negativeBranch } = node;

        const positiveBranchGroupId = genGroupId();
        const currentPositiveGroupChain = [
            ...ancestorGroupChain,
            positiveBranchGroupId,
        ];

        const varPosId = genSpanId();
        expansionState.spanData[varPosId] = {
            minterms: positiveBranch.minterms,
            textContent: variable,
            isVar: true,
            varName: variable,
            groupChain: currentPositiveGroupChain,
            styleType: styleType,
        };
        htmlOutput += `<span id="${varPosId}" data-span-id="${varPosId}">${variable}</span>`;

        const openParenPosId = genSpanId();
        expansionState.spanData[openParenPosId] = {
            minterms: positiveBranch.minterms,
            textContent: "(",
            isParen: true,
            groupChain: currentPositiveGroupChain,
            styleType: styleType,
        };
        htmlOutput += `<span id="${openParenPosId}" data-span-id="${openParenPosId}">(</span>`;

        htmlOutput += generateExpansionHtmlRecursive(
            positiveBranch,
            currentPositiveGroupChain
        );

        const closeParenPosId = genSpanId();
        expansionState.spanData[closeParenPosId] = {
            minterms: positiveBranch.minterms,
            textContent: ")",
            isParen: true,
            groupChain: currentPositiveGroupChain,
            styleType: styleType,
        };
        htmlOutput += `<span id="${closeParenPosId}" data-span-id="${closeParenPosId}">)</span>`;

        const negativeBranchGroupId = genGroupId();
        const currentNegativeGroupChain = [
            ...ancestorGroupChain,
            negativeBranchGroupId,
        ];

        const varNegId = genSpanId();
        expansionState.spanData[varNegId] = {
            minterms: negativeBranch.minterms,
            textContent: `${variable}'`,
            isVar: true,
            varName: variable,
            isNegated: true,
            groupChain: currentNegativeGroupChain,
            styleType: styleType,
        };
        htmlOutput += `<span id="${varNegId}" data-span-id="${varNegId}" class="ov">${variable}</span>`;

        const openParenNegId = genSpanId();
        expansionState.spanData[openParenNegId] = {
            minterms: negativeBranch.minterms,
            textContent: "(",
            isParen: true,
            groupChain: currentNegativeGroupChain,
            styleType: styleType,
        };
        htmlOutput += `<span id="${openParenNegId}" data-span-id="${openParenNegId}">(</span>`;

        htmlOutput += generateExpansionHtmlRecursive(
            negativeBranch,
            currentNegativeGroupChain
        );

        const closeParenNegId = genSpanId();
        expansionState.spanData[closeParenNegId] = {
            minterms: negativeBranch.minterms,
            textContent: ")",
            isParen: true,
            groupChain: currentNegativeGroupChain,
            styleType: styleType,
        };
        htmlOutput += `<span id="${closeParenNegId}" data-span-id="${closeParenNegId}">)</span>`;
    }
    return htmlOutput;
}
