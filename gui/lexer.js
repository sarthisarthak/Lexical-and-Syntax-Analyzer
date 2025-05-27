const tokenPatterns = [
  // Preprocessor directives
  { name: "INCLUDE", pattern: /#include/, type: "preprocessor" },
  { name: "DEFINE", pattern: /#define/, type: "preprocessor" },
  { name: "IFDEF", pattern: /#ifdef/, type: "preprocessor" },
  { name: "IFNDEF", pattern: /#ifndef/, type: "preprocessor" },
  { name: "ENDIF", pattern: /#endif/, type: "preprocessor" },

  // Literals (before operators to prioritize HEADER_FILE and STRING)
  { name: "HEX_NUMBER", pattern: /0[xX][0-9a-fA-F]+[uUlL]*/, type: "literal" },
  { name: "OCTAL_NUMBER", pattern: /0[0-7]+[uUlL]*/, type: "literal" },
  { name: "FLOAT", pattern: /\d+\.\d+([eE][+-]?\d+)?[fF]?/, type: "literal" },
  { name: "NUMBER", pattern: /\d+[uUlL]*/, type: "literal" },
  { name: "STRING", pattern: /"([^"\\]*(?:\\.[^"\\]*)*)"/, type: "literal" },
  {
    name: "CHAR_LITERAL",
    pattern: /'([^'\\]*(?:\\.[^'\\]*)*)'/,
    type: "literal",
  },
  { name: "HEADER_FILE", pattern: /<[^>\s]+>/, type: "literal" },

  // Operators
  { name: "ARROW", pattern: /->/, type: "operator" },
  { name: "INCREMENT", pattern: /\+\+/, type: "operator" },
  { name: "DECREMENT", pattern: /--/, type: "operator" },
  { name: "EQ", pattern: /==/, type: "operator" },
  { name: "NEQ", pattern: /!=/, type: "operator" },
  { name: "LEQ", pattern: /<=/, type: "operator" },
  { name: "GEQ", pattern: />=/, type: "operator" },
  { name: "AND", pattern: /&&/, type: "operator" },
  { name: "OR", pattern: /\|\|/, type: "operator" },
  { name: "LSHIFT", pattern: /<</, type: "operator" },
  { name: "RSHIFT", pattern: />>/, type: "operator" },
  { name: "PLUS_ASSIGN", pattern: /\+=/, type: "operator" },
  { name: "MINUS_ASSIGN", pattern: /-=/, type: "operator" },
  { name: "MULT_ASSIGN", pattern: /\*=/, type: "operator" },
  { name: "DIV_ASSIGN", pattern: /\/=/, type: "operator" },
  { name: "MOD_ASSIGN", pattern: /%=/, type: "operator" },
  { name: "GT", pattern: />/, type: "operator" },
  { name: "LT", pattern: /</, type: "operator" },
  { name: "ASSIGN", pattern: /=/, type: "operator" },
  { name: "PLUS", pattern: /\+/, type: "operator" },
  { name: "MINUS", pattern: /-/, type: "operator" },
  { name: "MULT", pattern: /\*/, type: "operator" },
  { name: "DIV", pattern: /\//, type: "operator" },
  { name: "MOD", pattern: /%/, type: "operator" },
  { name: "NOT", pattern: /!/, type: "operator" },
  { name: "BITWISE_AND", pattern: /&/, type: "operator" },
  { name: "BITWISE_OR", pattern: /\|/, type: "operator" },
  { name: "BITWISE_XOR", pattern: /\^/, type: "operator" },
  { name: "BITWISE_NOT", pattern: /~/, type: "operator" },

  // Delimiters
  { name: "LPAREN", pattern: /\(/, type: "delimiter" },
  { name: "RPAREN", pattern: /\)/, type: "delimiter" },
  { name: "LBRACE", pattern: /\{/, type: "delimiter" },
  { name: "RBRACE", pattern: /\}/, type: "delimiter" },
  { name: "LBRACKET", pattern: /\[/, type: "delimiter" },
  { name: "RBRACKET", pattern: /\]/, type: "delimiter" },
  { name: "SEMICOLON", pattern: /;/, type: "delimiter" },
  { name: "COMMA", pattern: /,/, type: "delimiter" },
  { name: "DOT", pattern: /\./, type: "delimiter" },
  { name: "COLON", pattern: /:/, type: "delimiter" },
  { name: "QUESTION", pattern: /\?/, type: "delimiter" },

  // C Keywords
  { name: "AUTO", pattern: /auto/, type: "keyword" },
  { name: "BREAK", pattern: /break/, type: "keyword" },
  { name: "CASE", pattern: /case/, type: "keyword" },
  { name: "CHAR", pattern: /char/, type: "keyword" },
  { name: "CONST", pattern: /const/, type: "keyword" },
  { name: "CONTINUE", pattern: /continue/, type: "keyword" },
  { name: "DEFAULT", pattern: /default/, type: "keyword" },
  { name: "DO", pattern: /do/, type: "keyword" },
  { name: "DOUBLE", pattern: /double/, type: "keyword" },
  { name: "ELSE", pattern: /else/, type: "keyword" },
  { name: "ENUM", pattern: /enum/, type: "keyword" },
  { name: "EXTERN", pattern: /extern/, type: "keyword" },
  { name: "FLOAT_TYPE", pattern: /float/, type: "keyword" },
  { name: "FOR", pattern: /for/, type: "keyword" },
  { name: "GOTO", pattern: /goto/, type: "keyword" },
  { name: "IF", pattern: /if/, type: "keyword" },
  { name: "INT", pattern: /int/, type: "keyword" },
  { name: "LONG", pattern: /long/, type: "keyword" },
  { name: "REGISTER", pattern: /register/, type: "keyword" },
  { name: "RETURN", pattern: /return/, type: "keyword" },
  { name: "SHORT", pattern: /short/, type: "keyword" },
  { name: "SIGNED", pattern: /signed/, type: "keyword" },
  { name: "SIZEOF", pattern: /sizeof/, type: "keyword" },
  { name: "STATIC", pattern: /static/, type: "keyword" },
  { name: "STRUCT", pattern: /struct/, type: "keyword" },
  { name: "SWITCH", pattern: /switch/, type: "keyword" },
  { name: "TYPEDEF", pattern: /typedef/, type: "keyword" },
  { name: "UNION", pattern: /union/, type: "keyword" },
  { name: "UNSIGNED", pattern: /unsigned/, type: "keyword" },
  { name: "VOID", pattern: /void/, type: "keyword" },
  { name: "VOLATILE", pattern: /volatile/, type: "keyword" },
  { name: "WHILE", pattern: /while/, type: "keyword" },

  // Standard library functions
  { name: "PRINTF", pattern: /printf/, type: "function" },
  { name: "SCANF", pattern: /scanf/, type: "function" },
  { name: "MALLOC", pattern: /malloc/, type: "function" },
  { name: "FREE", pattern: /free/, type: "function" },
  { name: "STRLEN", pattern: /strlen/, type: "function" },
  { name: "STRCPY", pattern: /strcpy/, type: "function" },
  { name: "STRCMP", pattern: /strcmp/, type: "function" },

  // Identifiers (must come last)
  { name: "ID", pattern: /[a-zA-Z_][a-zA-Z0-9_]*/, type: "identifier" },
];

function tokenize(input) {
  const tokens = [];
  let line = 1;
  let column = 1;
  let i = 0;

  while (i < input.length) {
    const startColumn = column;

    // Skip whitespace
    if (/\s/.test(input[i])) {
      if (input[i] === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      i++;
      continue;
    }

    // Handle single-line comments
    if (input.slice(i, i + 2) === "//") {
      while (i < input.length && input[i] !== "\n") {
        i++;
        column++;
      }
      continue;
    }

    // Handle multi-line comments
    if (input.slice(i, i + 2) === "/*") {
      i += 2;
      column += 2;
      while (i < input.length - 1) {
        if (input.slice(i, i + 2) === "*/") {
          i += 2;
          column += 2;
          break;
        }
        if (input[i] === "\n") {
          line++;
          column = 1;
        } else {
          column++;
        }
        i++;
      }
      continue;
    }

    let matched = false;

    // Try to match each token pattern
    for (const { name, pattern, type } of tokenPatterns) {
      const match = input.slice(i).match(new RegExp("^" + pattern.source));
      if (match) {
        tokens.push({
          name,
          type,
          value: match[0],
          line,
          column: startColumn,
        });
        i += match[0].length;
        column += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new Error(
        `Unknown character '${input[i]}' at line ${line}, column ${column}`
      );
    }
  }

  tokens.push({ name: "EOF", type: "eof", value: "", line, column });
  return tokens;
}
