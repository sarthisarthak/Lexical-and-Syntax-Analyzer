class ASTNode {
  constructor(nodeType, value = null, children = []) {
    this.nodeType = nodeType;
    this.value = value;
    this.children = children;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
    this.maxIterations = 10000;
  }

  peek() {
    return this.current < this.tokens.length ? this.tokens[this.current] : null;
  }

  advance() {
    if (this.current < this.tokens.length) {
      return this.tokens[this.current++];
    }
    return null;
  }

  match(expectedType) {
    const token = this.peek();
    if (token && token.name === expectedType) {
      return this.advance();
    }
    return null;
  }

  parseProgram() {
    const statements = [];
    let iterationCount = 0;
    while (this.peek() && this.peek().name !== "EOF") {
      if (iterationCount++ > this.maxIterations) {
        throw new Error(
          "Parser exceeded maximum iterations, possible infinite loop"
        );
      }
      try {
        const stmt = this.parseTopLevel();
        if (stmt) statements.push(stmt);
      } catch (e) {
        this.errors.push(
          `Parse error at line ${this.peek()?.line || "unknown"}: ${e.message}`
        );
        // Skip to next semicolon or brace
        this.skipToRecoveryPoint();
      }
    }
    return statements.length > 0
      ? new ASTNode("program", null, statements)
      : null;
  }

  skipToRecoveryPoint() {
    while (
      this.peek() &&
      this.peek().name !== "SEMICOLON" &&
      this.peek().name !== "RBRACE" &&
      this.peek().name !== "EOF"
    ) {
      this.advance();
    }
    if (this.peek() && this.peek().name === "SEMICOLON") {
      this.advance();
    }
  }

  parseTopLevel() {
    const token = this.peek();
    if (!token || token.name === "EOF") return null;

    if (token.name === "INCLUDE" || token.name === "DEFINE") {
      return this.parsePreprocessor();
    } else if (this.isTypeSpecifier(token)) {
      return this.parseDeclarationOrFunction();
    } else {
      return this.parseStatement();
    }
  }

  parsePreprocessor() {
    const token = this.peek();
    if (token.name === "INCLUDE") {
      this.advance(); // consume #include
      const header = this.match("HEADER_FILE") || this.match("STRING");
      if (!header) {
        throw new Error("Expected header file after #include");
      }
      return new ASTNode("include", header.value);
    } else if (token.name === "DEFINE") {
      this.advance(); // consume #define
      const id = this.match("ID");
      const value =
        this.peek() && this.peek().name !== "EOF" && !this.isNewStatement()
          ? this.parseExpression()
          : null;
      return new ASTNode("define", id ? id.value : null, value ? [value] : []);
    }
    throw new Error(`Unexpected preprocessor directive: ${token.name}`);
  }

  isNewStatement() {
    const token = this.peek();
    return (
      !token ||
      token.name === "EOF" ||
      this.isTypeSpecifier(token) ||
      ["IF", "WHILE", "FOR", "RETURN", "LBRACE"].includes(token.name)
    );
  }

  isTypeSpecifier(token) {
    return [
      "INT",
      "CHAR",
      "FLOAT_TYPE",
      "DOUBLE",
      "VOID",
      "LONG",
      "SHORT",
      "SIGNED",
      "UNSIGNED",
    ].includes(token.name);
  }

  parseDeclarationOrFunction() {
    const typeSpecifiers = [];
    while (this.peek() && this.isTypeSpecifier(this.peek())) {
      typeSpecifiers.push(this.advance().value);
    }
    const type = typeSpecifiers.join(" ");

    const id = this.match("ID");
    if (!id) {
      throw new Error("Expected identifier after type specifier");
    }

    // Check if it's a function definition
    if (this.peek() && this.peek().name === "LPAREN") {
      return this.parseFunctionDefinition(type, id.value);
    } else {
      // It's a variable declaration
      return this.parseVariableDeclaration(type, id);
    }
  }

  parseVariableDeclaration(type, firstId) {
    const declarations = [];

    // Handle the first declaration
    let expr = null;
    if (this.peek() && this.peek().name === "ASSIGN") {
      this.advance(); // consume =
      expr = this.parseExpression();
    }
    declarations.push(
      new ASTNode(
        "declaration",
        firstId.value,
        [new ASTNode("type", type), expr].filter(Boolean)
      )
    );

    // Handle comma-separated declarations
    while (this.peek() && this.peek().name === "COMMA") {
      this.advance(); // consume comma
      const id = this.match("ID");
      if (!id) {
        throw new Error("Expected identifier after comma in declaration");
      }

      let expr = null;
      if (this.peek() && this.peek().name === "ASSIGN") {
        this.advance(); // consume =
        expr = this.parseExpression();
      }

      declarations.push(
        new ASTNode(
          "declaration",
          id.value,
          [new ASTNode("type", type), expr].filter(Boolean)
        )
      );
    }

    if (!this.match("SEMICOLON")) {
      throw new Error("Expected ';' after variable declaration");
    }

    return declarations.length === 1
      ? declarations[0]
      : new ASTNode("declaration_list", null, declarations);
  }

  parseFunctionDefinition(type, name) {
    this.match("LPAREN");
    const params = this.parseParameters();
    if (!this.match("RPAREN")) {
      throw new Error("Expected ')' after function parameters");
    }
    const body = this.parseBlock();
    return new ASTNode("function_def", name, [
      new ASTNode("type", type),
      new ASTNode("params", null, params),
      body,
    ]);
  }

  parseParameters() {
    const params = [];
    while (this.peek() && this.peek().name !== "RPAREN") {
      const typeSpecifiers = [];
      while (this.peek() && this.isTypeSpecifier(this.peek())) {
        typeSpecifiers.push(this.advance().value);
      }
      const type = typeSpecifiers.join(" ");
      const id = this.match("ID");

      if (type || id) {
        params.push(
          new ASTNode(
            "param",
            id ? id.value : null,
            type ? [new ASTNode("type", type)] : []
          )
        );
      }

      if (this.peek() && this.peek().name === "COMMA") {
        this.advance();
      } else if (this.peek() && this.peek().name !== "RPAREN") {
        break;
      }
    }
    return params;
  }

  parseStatement() {
    const token = this.peek();
    if (!token || token.name === "EOF") return null;

    if (token.name === "IF") {
      return this.parseIfStatement();
    } else if (token.name === "WHILE") {
      return this.parseWhileStatement();
    } else if (token.name === "FOR") {
      return this.parseForStatement();
    } else if (token.name === "RETURN") {
      return this.parseReturnStatement();
    } else if (token.name === "LBRACE") {
      return this.parseBlock();
    } else if (this.isTypeSpecifier(token)) {
      return this.parseDeclarationOrFunction();
    } else {
      return this.parseExpressionStatement();
    }
  }

  parseIfStatement() {
    this.match("IF");
    if (!this.match("LPAREN")) {
      throw new Error('Expected "(" after if');
    }
    const condition = this.parseExpression();
    if (!this.match("RPAREN")) {
      throw new Error('Expected ")" after if condition');
    }
    const thenStmt = this.parseStatement();
    let elseStmt = null;
    if (this.peek() && this.peek().name === "ELSE") {
      this.advance();
      elseStmt = this.parseStatement();
    }
    return new ASTNode(
      "if_stmt",
      null,
      [condition, thenStmt, elseStmt].filter(Boolean)
    );
  }

  parseWhileStatement() {
    this.match("WHILE");
    if (!this.match("LPAREN")) {
      throw new Error('Expected "(" after while');
    }
    const condition = this.parseExpression();
    if (!this.match("RPAREN")) {
      throw new Error('Expected ")" after while condition');
    }
    const body = this.parseStatement();
    return new ASTNode("while_stmt", null, [condition, body]);
  }

  parseForStatement() {
    this.match("FOR");
    if (!this.match("LPAREN")) {
      throw new Error('Expected "(" after for');
    }

    let init = null;
    if (this.peek() && this.peek().name !== "SEMICOLON") {
      if (this.isTypeSpecifier(this.peek())) {
        // For variable declarations in for loop, we need special handling
        const typeSpecifiers = [];
        while (this.peek() && this.isTypeSpecifier(this.peek())) {
          typeSpecifiers.push(this.advance().value);
        }
        const type = typeSpecifiers.join(" ");

        const id = this.match("ID");
        if (!id) {
          throw new Error(
            "Expected identifier after type specifier in for loop"
          );
        }

        let expr = null;
        if (this.peek() && this.peek().name === "ASSIGN") {
          this.advance(); // consume =
          expr = this.parseExpression();
        }

        init = new ASTNode(
          "declaration",
          id.value,
          [new ASTNode("type", type), expr].filter(Boolean)
        );

        // Don't consume semicolon here - it will be consumed below
      } else {
        init = this.parseExpression();
      }
    }

    if (!this.match("SEMICOLON")) {
      throw new Error('Expected ";" after for initialization');
    }

    const condition =
      this.peek() && this.peek().name !== "SEMICOLON"
        ? this.parseExpression()
        : null;
    if (!this.match("SEMICOLON")) {
      throw new Error('Expected ";" after for condition');
    }

    const update =
      this.peek() && this.peek().name !== "RPAREN"
        ? this.parseExpression()
        : null;
    if (!this.match("RPAREN")) {
      throw new Error('Expected ")" after for update');
    }

    const body = this.parseStatement();
    return new ASTNode(
      "for_stmt",
      null,
      [init, condition, update, body].filter(Boolean)
    );
  }

  parseReturnStatement() {
    this.match("RETURN");
    const expr =
      this.peek() && this.peek().name !== "SEMICOLON"
        ? this.parseExpression()
        : null;
    if (!this.match("SEMICOLON")) {
      throw new Error('Expected ";" after return statement');
    }
    return new ASTNode("return_stmt", null, expr ? [expr] : []);
  }

  parseBlock() {
    if (!this.match("LBRACE")) {
      throw new Error('Expected "{"');
    }
    const statements = [];
    let iterationCount = 0;
    while (
      this.peek() &&
      this.peek().name !== "RBRACE" &&
      this.peek().name !== "EOF"
    ) {
      if (iterationCount++ > this.maxIterations) {
        throw new Error(
          "Parser exceeded maximum iterations in block, possible infinite loop"
        );
      }
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    if (!this.match("RBRACE")) {
      throw new Error('Expected "}" to close block');
    }
    return new ASTNode("block", null, statements);
  }

  parseExpressionStatement() {
    if (!this.peek() || this.peek().name === "EOF") return null;
    const expr = this.parseExpression();
    if (!this.match("SEMICOLON")) {
      throw new Error('Expected ";" after expression statement');
    }
    return new ASTNode("expr_stmt", null, [expr]);
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let left = this.parseLogicalOr();

    if (this.peek() && this.peek().name === "ASSIGN") {
      const op = this.advance();
      const right = this.parseAssignment(); // Right associative
      return new ASTNode("assign", null, [left, right]);
    }

    return left;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.peek() && this.peek().name === "OR") {
      const op = this.advance();
      const right = this.parseLogicalAnd();
      left = new ASTNode("logical_or", null, [left, right]);
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.peek() && this.peek().name === "AND") {
      const op = this.advance();
      const right = this.parseEquality();
      left = new ASTNode("logical_and", null, [left, right]);
    }
    return left;
  }

  parseEquality() {
    let left = this.parseRelational();
    while (this.peek() && ["EQ", "NEQ"].includes(this.peek().name)) {
      const op = this.advance();
      const right = this.parseRelational();
      left = new ASTNode(op.name === "EQ" ? "equal" : "not_equal", null, [
        left,
        right,
      ]);
    }
    return left;
  }

  parseRelational() {
    let left = this.parseAdditive();
    while (
      this.peek() &&
      ["LT", "GT", "LEQ", "GEQ"].includes(this.peek().name)
    ) {
      const op = this.advance();
      const right = this.parseAdditive();
      const nodeType = {
        LT: "less_than",
        GT: "greater_than",
        LEQ: "less_equal",
        GEQ: "greater_equal",
      }[op.name];
      left = new ASTNode(nodeType, null, [left, right]);
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    let iterationCount = 0;
    while (this.peek() && ["PLUS", "MINUS"].includes(this.peek().name)) {
      if (iterationCount++ > this.maxIterations) {
        throw new Error(
          "Parser exceeded maximum iterations in additive, possible infinite loop"
        );
      }
      const op = this.advance();
      const right = this.parseMultiplicative();
      left = new ASTNode(op.name === "PLUS" ? "add" : "sub", null, [
        left,
        right,
      ]);
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    let iterationCount = 0;
    while (this.peek() && ["MULT", "DIV", "MOD"].includes(this.peek().name)) {
      if (iterationCount++ > this.maxIterations) {
        throw new Error(
          "Parser exceeded maximum iterations in multiplicative, possible infinite loop"
        );
      }
      const op = this.advance();
      const right = this.parseUnary();
      const nodeType = {
        MULT: "mul",
        DIV: "div",
        MOD: "mod",
      }[op.name];
      left = new ASTNode(nodeType, null, [left, right]);
    }
    return left;
  }

  parseUnary() {
    const token = this.peek();

    if (token && ["PLUS", "MINUS", "NOT", "BITWISE_NOT"].includes(token.name)) {
      this.advance();
      const operand = this.parseUnary();
      const nodeType = {
        PLUS: "unary_plus",
        MINUS: "unary_minus",
        NOT: "logical_not",
        BITWISE_NOT: "bitwise_not",
      }[token.name];
      return new ASTNode(nodeType, null, [operand]);
    }

    if (token && ["INCREMENT", "DECREMENT"].includes(token.name)) {
      this.advance();
      const operand = this.parsePostfix();
      return new ASTNode(
        token.name === "INCREMENT" ? "pre_inc" : "pre_dec",
        null,
        [operand]
      );
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let left = this.parsePrimary();

    while (this.peek()) {
      const token = this.peek();

      if (token.name === "INCREMENT" || token.name === "DECREMENT") {
        this.advance();
        left = new ASTNode(
          token.name === "INCREMENT" ? "post_inc" : "post_dec",
          null,
          [left]
        );
      } else if (token.name === "LBRACKET") {
        this.advance();
        const index = this.parseExpression();
        if (!this.match("RBRACKET")) {
          throw new Error('Expected "]" after array index');
        }
        left = new ASTNode("array_access", null, [left, index]);
      } else if (token.name === "ARROW") {
        this.advance();
        const member = this.match("ID");
        if (!member) {
          throw new Error("Expected member name after '->'");
        }
        left = new ASTNode("arrow_access", null, [
          left,
          new ASTNode("id", member.value),
        ]);
      } else if (token.name === "DOT") {
        this.advance();
        const member = this.match("ID");
        if (!member) {
          throw new Error("Expected member name after '.'");
        }
        left = new ASTNode("dot_access", null, [
          left,
          new ASTNode("id", member.value),
        ]);
      } else {
        break;
      }
    }

    return left;
  }

  parsePrimary() {
    const token = this.peek();
    if (!token || token.name === "EOF") {
      throw new Error("Unexpected end of input");
    }

    if (token.name === "NUMBER") {
      this.advance();
      return new ASTNode("number", token.value);
    } else if (token.name === "FLOAT") {
      this.advance();
      return new ASTNode("float", token.value);
    } else if (token.name === "STRING") {
      this.advance();
      return new ASTNode("string", token.value);
    } else if (token.name === "CHAR_LITERAL") {
      this.advance();
      return new ASTNode("char", token.value);
    } else if (token.name === "ID" || token.name === "PRINTF") {
      this.advance();
      if (this.peek() && this.peek().name === "LPAREN") {
        return this.parseFunctionCall(token.value);
      }
      return new ASTNode("id", token.value);
    } else if (token.name === "LPAREN") {
      this.advance();
      const expr = this.parseExpression();
      if (!this.match("RPAREN")) {
        throw new Error('Expected ")" after expression');
      }
      return expr;
    } else {
      throw new Error(`Unexpected token: ${token.name} at line ${token.line}`);
    }
  }

  parseFunctionCall(name) {
    this.match("LPAREN");
    const args = [];
    let iterationCount = 0;
    while (
      this.peek() &&
      this.peek().name !== "RPAREN" &&
      this.peek().name !== "EOF"
    ) {
      if (iterationCount++ > this.maxIterations) {
        throw new Error(
          "Parser exceeded maximum iterations in function call, possible infinite loop"
        );
      }
      args.push(this.parseExpression());
      if (this.peek() && this.peek().name === "COMMA") {
        this.advance();
      } else if (this.peek() && this.peek().name !== "RPAREN") {
        break;
      }
    }
    if (!this.match("RPAREN")) {
      throw new Error('Expected ")" after function arguments');
    }
    return new ASTNode("call", name, args);
  }
}
