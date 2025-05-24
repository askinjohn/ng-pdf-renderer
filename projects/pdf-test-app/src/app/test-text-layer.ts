// Test file to explore PDF.js text layer API
import * as pdfjsLib from 'pdfjs-dist';

// Log all available properties and methods
//console.log('PDF.js library exports:', Object.keys(pdfjsLib));

// Check if renderTextLayer exists
if ('renderTextLayer' in pdfjsLib) {
  //console.log('renderTextLayer is directly available');
} else {
  //console.log('renderTextLayer is NOT directly available');
}

// Try to find text layer related functionality
const textLayerProperties = Object.keys(pdfjsLib).filter(key => 
  key.toLowerCase().includes('text') || key.toLowerCase().includes('layer')
);
//console.log('Possible text layer related properties:', textLayerProperties);

// Log structure of pdfjsLib
function inspectObject(obj: any, name: string, depth: number = 0, maxDepth: number = 2) {
  if (depth > maxDepth) return;
  
  //console.log(`${' '.repeat(depth * 2)}${name}:`);
  
  if (obj === null || obj === undefined) {
    //console.log(`${' '.repeat((depth + 1) * 2)}${obj}`);
    return;
  }
  
  if (typeof obj !== 'object') {
    //console.log(`${' '.repeat((depth + 1) * 2)}${typeof obj}: ${obj}`);
    return;
  }
  
  Object.keys(obj).forEach(key => {
    try {
      const value = obj[key];
      if (typeof value === 'function') {
        //console.log(`${' '.repeat((depth + 1) * 2)}${key}: [Function]`);
      } else if (typeof value === 'object' && value !== null) {
        inspectObject(value, key, depth + 1, maxDepth);
      } else {
        //console.log(`${' '.repeat((depth + 1) * 2)}${key}: ${value}`);
      }
    } catch (e) {
      //console.log(`${' '.repeat((depth + 1) * 2)}${key}: [Error: ${e.message}]`);
    }
  });
}

inspectObject(pdfjsLib, 'pdfjsLib');

// Try to check actual module exports and structure
try {
  // @ts-ignore: Exploring module structure
  const pdfModule = pdfjsLib.__moduleExports || pdfjsLib.__esModule || pdfjsLib;
  //console.log('Module structure:', Object.keys(pdfModule));
} catch (e) {
  //console.log('Error exploring module structure:', e);
}

// Check for web (display) layer components
try {
  // @ts-ignore: Exploring PDF.js structure
  const webComponents = pdfjsLib.web || pdfjsLib.pdfjsViewer || pdfjsLib.display;
  if (webComponents) {
    //console.log('Web components found:', Object.keys(webComponents));
  } else {
    //console.log('Web components not found directly');
  }
} catch (e) {
  //console.log('Error checking web components:', e);
}
