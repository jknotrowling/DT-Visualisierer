import { normalizeExpression } from '../src/logic/parser.js';

console.log('Debugging !(!(!(!(B))))');

// Let's manually trace what should happen:
let expr = '!(!(!(!(B))))';
console.log('Start:', expr);

// Remove extra parentheses around single variables: (B) -> B
console.log('Should become: !(!(!(!(B))))'); // no change expected

// Multiple negations: !{2,} -> ! or ''
console.log('No consecutive negations to simplify yet');

// Negations before parentheses: !(content)
// Starting from innermost: !(B) -> !B, then !((!B)) -> !!B -> B, then !(B) -> !B, then !(!B) -> !!B -> B

console.log('Let me trace step by step what the regex should match:');

// Let's test the actual function
const normalized = normalizeExpression(expr);
console.log('Actual result:', normalized);

// Let's test with a debug version
function debugSimplifyNegations(expr) {
  let simplified = expr;
  let changed = true;
  let step = 0;
  
  console.log(`\nStep ${step}: ${simplified}`);
  
  while (changed && step < 10) { // limit steps to avoid infinite loop
    let oldExpr = simplified;
    step++;
    
    // Step 1: Remove unnecessary parentheses around single variables
    simplified = simplified.replace(/\(([A-Za-z])\)/g, '$1');
    if (simplified !== oldExpr) console.log(`Step ${step}a (remove parens): ${simplified}`);
    
    // Step 2: Handle consecutive negations
    simplified = simplified.replace(/!{2,}/g, match => {
      const result = match.length % 2 === 0 ? '' : '!';
      console.log(`Found ${match.length} consecutive negations, replacing with: "${result}"`);
      return result;
    });
    if (simplified !== oldExpr) console.log(`Step ${step}b (consecutive negations): ${simplified}`);
    
    // Step 3: Handle negations before parentheses
    const beforeParens = simplified;
    simplified = simplified.replace(/!+\(([^()]+)\)/g, (match, content) => {
      const negationCount = match.match(/!/g).length;
      console.log(`Found negation before parens: "${match}", content: "${content}", negations: ${negationCount}`);
      
      if (/^[A-Za-z]$/.test(content)) {
        const result = negationCount % 2 === 0 ? content : `!${content}`;
        console.log(`Simple variable case: ${result}`);
        return result;
      }
      
      if (/^!+[A-Za-z]$/.test(content)) {
        const innerNegations = content.match(/^!+/)[0].length;
        const variable = content.replace(/^!+/, '');
        const totalNegations = negationCount + innerNegations;
        const result = totalNegations % 2 === 0 ? variable : `!${variable}`;
        console.log(`Negated variable case: inner=${innerNegations}, outer=${negationCount}, total=${totalNegations}, result=${result}`);
        return result;
      }
      
      const result = negationCount % 2 === 0 ? `(${content})` : `!(${content})`;
      console.log(`Complex content case: ${result}`);
      return result;
    });
    if (simplified !== beforeParens) console.log(`Step ${step}c (negations before parens): ${simplified}`);
    
    // Step 4: Remove parentheses around negated variables
    simplified = simplified.replace(/\((!*[A-Za-z])\)/g, '$1');
    if (simplified !== oldExpr) console.log(`Step ${step}d (remove parens around negated vars): ${simplified}`);
    
    changed = (oldExpr !== simplified);
    console.log(`Step ${step} final: ${simplified}`);
  }
  
  return simplified;
}

console.log('\nDebug run:');
const debugResult = debugSimplifyNegations('!(!(!(!(B))))');
console.log('Final debug result:', debugResult);
