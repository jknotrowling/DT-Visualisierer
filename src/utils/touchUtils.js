
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}


const touchState = new Map();


export function addTouchFriendlyInteraction(element, hoverHandler, clickHandler) {
  if (!element) return;

  const elementId = element.dataset.bits || element.id || Math.random().toString(36);
  
  if (isTouchDevice()) {
    
    let touchStartTime = 0;
    let touchTimeout = null;
    let isHovering = false;
    
    element.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartTime = Date.now();
      
     
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      
  
      touchTimeout = setTimeout(() => {
        if (!isHovering) {
          isHovering = true;
          hoverHandler(element, true);
        }
      }, 50); 
    });
    
    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touchDuration = Date.now() - touchStartTime;
      
    
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      
     
      if (touchDuration < 300) { 
        const lastTouchState = touchState.get(elementId);
        const now = Date.now();
        
        if (lastTouchState && (now - lastTouchState.time) < 500) {
          
          if (isHovering) {
            hoverHandler(element, false);
            isHovering = false;
          }
          clickHandler(e);
          touchState.delete(elementId);
        } else {
         
          touchState.set(elementId, { time: now });
          if (!isHovering) {
            hoverHandler(element, true);
            isHovering = true;
          }
          
         
          setTimeout(() => {
            const currentState = touchState.get(elementId);
            if (currentState && (Date.now() - currentState.time) >= 400) {
              if (isHovering) {
                hoverHandler(element, false);
                isHovering = false;
              }
              touchState.delete(elementId);
            }
          }, 500);
        }
      } else {
        
        if (isHovering) {
          hoverHandler(element, false);
          isHovering = false;
        }
      }
    });
    
    element.addEventListener('touchcancel', (e) => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      if (isHovering) {
        hoverHandler(element, false);
        isHovering = false;
      }
    });
    
  } else {
   
    element.addEventListener('mouseenter', () => hoverHandler(element, true));
    element.addEventListener('mouseleave', () => hoverHandler(element, false));
    element.addEventListener('click', clickHandler);
  }
}


export function setupTouchFriendlyTruthTable(hoverHandler, clickHandler) {
  // Clean up existing event listeners first
  document.querySelectorAll("#truthTableCard .outCell").forEach((el) => {
    // Clone the element to remove all event listeners
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
  });

  // Add new event listeners to cleaned elements
  document.querySelectorAll("#truthTableCard .outCell").forEach((el) => {
    addTouchFriendlyInteraction(el, hoverHandler, clickHandler);
  });
}


export function setupTouchFriendlySymmetryDiagram(hoverHandler, clickHandler) {
  // Clean up existing event listeners first
  document.querySelectorAll("#symmetry-diagram div[data-bits]").forEach((el) => {
    // Clone the element to remove all event listeners
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
  });

  setTimeout(() => {
    document.querySelectorAll("#symmetry-diagram div[data-bits]").forEach((el) => {
      addTouchFriendlyInteraction(el, hoverHandler, clickHandler);
    });
  }, 0);
}


export function setupTouchFriendlyExpressionTerms(hoverHandler) {
  // Clean up existing event listeners first
  document.querySelectorAll("#expressionsCard .term").forEach((el) => {
    // Clone the element to remove all event listeners
    const newEl = el.cloneNode(true);
    el.parentNode.replaceChild(newEl, el);
  });

  // Add new event listeners to cleaned elements
  document.querySelectorAll("#expressionsCard .term").forEach((el) => {
    if (isTouchDevice()) {
      addTouchFriendlyInteraction(el, hoverHandler, () => {}); 
    } else {
      el.addEventListener('mouseenter', () => hoverHandler(el, true));
      el.addEventListener('mouseleave', () => hoverHandler(el, false));
    }
  });
}
