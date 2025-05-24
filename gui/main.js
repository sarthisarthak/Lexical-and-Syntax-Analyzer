let currentTokens = [];
let currentAST = null;

function runLexicalAnalysis() {
  const input = document.getElementById("codeInput").value;
  const tokenOutput = document.getElementById("tokenOutput");
  const statusMessage = document.getElementById("statusMessage");

  if (!input.trim()) {
    statusMessage.innerHTML =
      '<div class="error">Please enter some code to analyze!</div>';
    return;
  }

  try {
    currentTokens = tokenize(input);
    let output = "";
    let tokenCount = 0;

    currentTokens.forEach((token) => {
      if (token.name !== "EOF") {
        output += `<span class="token">${token.name}: "${token.value}" (Line ${token.line})</span>\n`;
        tokenCount++;
      }
    });

    tokenOutput.innerHTML = output || "No tokens found";
    document.getElementById("tokenCount").textContent = tokenCount;
    document.getElementById("lineCount").textContent = input.split("\n").length;
    document.getElementById("analysisStats").style.display = "flex";
    statusMessage.innerHTML =
      '<div class="success">✅ Lexical analysis completed successfully!</div>';
  } catch (error) {
    tokenOutput.innerHTML = `<div class="error">Lexical Analysis Error: ${error.message}</div>`;
    statusMessage.innerHTML =
      '<div class="error">❌ Lexical analysis failed!</div>';
  }
}

function runSyntaxAnalysis() {
  const parseOutput = document.getElementById("parseOutput");
  const astVisualization = document.getElementById("astVisualization");
  const statusMessage = document.getElementById("statusMessage");

  if (currentTokens.length === 0) {
    statusMessage.innerHTML =
      '<div class="error">Please run lexical analysis first!</div>';
    return;
  }

  try {
    const parser = new Parser(currentTokens);
    currentAST = parser.parseProgram();
    let output = "Parse successful!\n\n";

    if (parser.errors.length > 0) {
      output += "Warnings/Errors:\n";
      parser.errors.forEach((error) => {
        output += `⚠️ ${error}\n`;
      });
      output += "\n";
    }

    if (currentAST) {
      output += "AST generated successfully.";
      const nodeCount = countASTNodes(currentAST);
      document.getElementById("nodeCount").textContent = nodeCount;
      displayAST(currentAST);
    } else {
      output += "No AST generated (empty input or parse errors).";
    }

    parseOutput.innerHTML = output;
    statusMessage.innerHTML =
      '<div class="success">✅ Syntax analysis completed successfully!</div>';
  } catch (error) {
    parseOutput.innerHTML = `<div class="error">Syntax Analysis Error: ${error.message}</div>`;
    astVisualization.innerHTML = `<div class="error">Failed to generate AST: ${error.message}</div>`;
    statusMessage.innerHTML =
      '<div class="error">❌ Syntax analysis failed!</div>';
  }
}

function displayAST(node, level = 0) {
  const astVisualization = document.getElementById("astVisualization");
  if (level === 0) {
    astVisualization.innerHTML = "";
  }

  if (!node) return;

  const indent = "  ".repeat(level);
  const nodeDiv = document.createElement("div");
  nodeDiv.className = `ast-node level-${Math.min(level, 4)}`;
  let nodeText = `${indent}${node.nodeType}`;
  if (node.value) {
    nodeText += ` (${node.value})`;
  }
  nodeDiv.textContent = nodeText;
  astVisualization.appendChild(nodeDiv);

  node.children.forEach((child) => displayAST(child, level + 1));
}

function countASTNodes(node) {
  if (!node) return 0;
  return (
    1 + node.children.reduce((sum, child) => sum + countASTNodes(child), 0)
  );
}

function clearResults() {
  document.getElementById("tokenOutput").innerHTML =
    "Run lexical analysis to see tokens...";
  document.getElementById("parseOutput").innerHTML =
    "Run syntax analysis to see parse results...";
  document.getElementById("astVisualization").innerHTML =
    "Run syntax analysis to generate AST...";
  document.getElementById("statusMessage").innerHTML = "";
  document.getElementById("analysisStats").style.display = "none";
  currentTokens = [];
  currentAST = null;
}

function loadExample(type) {
  const codeInput = document.getElementById("codeInput");
  const examples = {
    simple: `x = 10;\ny = 20;`,
    ifelse: `x = 10;\ny = 20;\nif (x > y) {\n    z = x + y;\n} else {\n    z = x - y;\n}`,
    while: `i = 0;\nwhile (i <= 10) {\n    sum = sum + i;\n    i = i + 1;\n}`,
    cfunction: `int square(int n) {\n    return n * n;\n}`,
    cprogram: `#include <stdio.h>\nint square(int n) {\n    return n * n;\n}\nint main() {\n    int i;\n    printf("Squares of numbers from 1 to 5:\\n");\n    for(i = 1; i <= 5; i++) {\n        printf("%d squared is %d\\n", i, square(i));\n    }\n    return 0;\n}`,
  };

  codeInput.value = examples[type] || examples.simple;
  clearResults();
}

window.onload = function () {
  loadExample("simple");
};
