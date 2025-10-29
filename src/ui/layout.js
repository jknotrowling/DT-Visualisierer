import { layoutState } from "../state.js";
import { $ } from "../utils/utils.js";




/**
 * Resets the grid column classes of the main card grid to their default state.
 * This function removes any dynamically added grid and span classes from the card
 * grid and its children, preparing it for a new layout configuration.
 */
function resetGridColsToDefault() {
  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;


  cardGrid.classList.remove(
    "lg:grid-cols-1",
    "lg:grid-cols-2",
    "lg:grid-cols-3",
    "lg:grid-cols-4",
    "lg:grid-cols-5",
    "lg:grid-cols-6",
    "lg:grid-cols-7",
    "lg:grid-cols-8",
    "lg:grid-cols-9",
  );

  const viewToggleMappings = layoutState.viewToggleMappings;
  const classesToRemove = [
    "lg:row-span-2",
    "lg:row-span-1",
    "lg:col-span-1",
    "lg:col-span-2",
    "lg:col-span-3",
    "lg:col-span-4",
    
  ];
  Object.values(viewToggleMappings).forEach((mapping) => {
    const el = $(mapping.id);
    if (el) {
      classesToRemove.forEach((cls) => el.classList.remove(cls));
    }
  });


  

} 

/**
 * Retrieves all active cards except for the ones specified.
 *
 * @param {string|string[]} notThisIds An ID or an array of IDs to exclude from the result.
 * @returns {HTMLElement[]} An array of active card elements.
 */
function getOtherActiveCards(notThisIds) {
  const viewToggleMappings = layoutState.viewToggleMappings;
    const excludeIds = Array.isArray(notThisIds) ? notThisIds : [notThisIds];
    return Object.values(viewToggleMappings)
      .filter(v => !excludeIds.includes(v.id) && v.active)
      .map(v => $(v.id));
}
  

export function updateGridCols() {
  const {
    viewToggleMappings,
    isLandscape
  } = layoutState;

  const cardGrid = document.querySelector("#card-grid");
  if (!cardGrid) return;

  const {
    toggleTruthTable,
    toggleExpressions,
    toggleMux,
    toggleKmap,
    toggleBooleanDev
  } = viewToggleMappings;

  resetGridColsToDefault();

  const isVisible = id => $(id)?.style.display !== "none";

  const activeCards = Object.values(viewToggleMappings)
    .map(val => val.id)
    .filter(id => isVisible(id));

  const activeCount = activeCards.length;

  const isTruthActive = isVisible(toggleTruthTable.id);
  const isExprActive = isVisible(toggleExpressions.id);
  const isMuxActive = isVisible(toggleMux.id);
  const isKmapActive = isVisible(toggleKmap.id);
  const isDevActive = isVisible(toggleBooleanDev.id);

  const truthEl = $(toggleTruthTable.id);
  const exprEl = $(toggleExpressions.id);
  const muxEl = $(toggleMux.id);
  const kmapEl = $(toggleKmap.id);
  const devEl = $(toggleBooleanDev.id);

  const GRID1 = "lg: grid-cols-1"
  const GRID2 = "lg:grid-cols-2";
  const GRID3 = "lg:grid-cols-3";
  const GRID4 = "lg:grid-cols-4";
  const GRID5 = "lg:grid-cols-5";
  const GRID6 = "lg:grid-cols-6";
  const GRID7 = "lg:grid-cols-7";
  const GRID8 = "lg:grid-cols-8";

  const COLS1= "lg:col-span-1";
  const COLS2 = "lg:col-span-2";
  const COLS3 = "lg:col-span-3";
  const COLS4 = "lg:col-span-4";

  const ROWS1 = "lg:row-span-1";
  const ROWS2 = "lg:row-span-2";  
  const ROWS3 = "lg:row-span-3";
  const ROWS4 = "lg:row-span-4";



  switch (activeCount) {
    case 1: {
      cardGrid.classList.add(GRID1);
      break;
    }
    case 2: {
      cardGrid.classList.add(GRID2);
      break;
    }
    case 3: {
      cardGrid.classList.add(GRID3);
      if(!isLandscape) {
        const firstActiveEl = $(activeCards[0]);
        firstActiveEl.classList.add(ROWS2);
        getOtherActiveCards(activeCards[0]).forEach((el) => {
          if (el) el.classList.add(COLS2, ROWS1);
        });
      }
      break;
    }
    case 4: {
      if(!isTruthActive) {
        cardGrid.classList.add(GRID2)
        break;
      }
      if(!isMuxActive)  {
        cardGrid.classList.add(GRID3)
         truthEl.classList.add(ROWS2);
          exprEl.classList.add(ROWS2); 
        break;
      }
      if(!isDevActive) {
        if(isLandscape) {
          cardGrid.classList.add(GRID3)
          truthEl.classList.add(ROWS2);
          exprEl.classList.add(ROWS2); 
          break;
        }

        cardGrid.classList.add(GRID3)
        muxEl.classList.add(COLS3);
        break;
      }
      if(!isExprActive) {
        cardGrid.classList.add(GRID3)
        truthEl.classList.add(ROWS2);
        muxEl.classList.add(COLS2);
        break;
      }
      if(!isKmapActive) {

        if(isLandscape) {
          cardGrid.classList.add(GRID4)
          truthEl.classList.add(ROWS2);
          exprEl.classList.add(ROWS2); 
          muxEl.classList.add(COLS2);
          devEl.classList.add(COLS2);
          break;
        }

        cardGrid.classList.add(GRID2)
        truthEl.classList.add(ROWS2);
        muxEl.classList.add(COLS2);
        break;
      }
    }

    case 5: {
      if(isLandscape) {
        cardGrid.classList.add(GRID8);
        truthEl.classList.add(ROWS2, COLS2);
       getOtherActiveCards(toggleTruthTable.id).forEach(el => el.classList.add(COLS3))
       break;
      }

      cardGrid.classList.add(GRID3);
      
      muxEl.classList.add(COLS2);


      break;
    }
    case 6: {
      if (isLandscape) {
        cardGrid.classList.add(GRID3);
      } else {
        cardGrid.classList.add(GRID2);
      }
      break;
    }
    
  }
}


