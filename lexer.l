%{
#include "ast.h"        // Include ast.h first to define AST
#include "parser.tab.h" // Include syntax.tab.h after ast.h
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

void yyerror(const char* s); // Declare yyerror for lexer errors
%}

%option yylineno

digit   [0-9]
id      [a-zA-Z_][a-zA-Z0-9_]*
float   {digit}+\.{digit}+

%%

"if"            { printf("TOKEN: IF\n"); return IF; }
"else"          { printf("TOKEN: ELSE\n"); return ELSE; }
"while"         { printf("TOKEN: WHILE\n"); return WHILE; }
"=="            { printf("TOKEN: EQ\n"); return EQ; }
">"             { printf("TOKEN: >\n"); return '>'; }
"!="            { printf("TOKEN: NEQ\n"); return NEQ; }
"<="            { printf("TOKEN: LEQ\n"); return LEQ; }
">="            { printf("TOKEN: GEQ\n"); return GEQ; }
"+"             { printf("TOKEN: +\n"); return '+'; }
"-"             { printf("TOKEN: -\n"); return '-'; }
"*"             { printf("TOKEN: *\n"); return '*'; }
"/"             { printf("TOKEN: /\n"); return '/'; }
"("             { printf("TOKEN: (\n"); return '('; }
")"             { printf("TOKEN: )\n"); return ')'; }
"{"             { printf("TOKEN: {\n"); return '{'; }
"}"             { printf("TOKEN: }\n"); return '}'; }
";"             { printf("TOKEN: ;\n"); return ';'; }
"="             { printf("TOKEN: =\n"); return '='; }

{digit}+        {
                    yylval.num = atoi(yytext);
                    printf("TOKEN: NUMBER(%d)\n", yylval.num);
                    return NUMBER;
                }

{float}         {
                    yylval.fnum = atof(yytext);
                    printf("TOKEN: FLOAT(%f)\n", yylval.fnum);
                    return FLOAT;
                }

{id}            {
                    yylval.id = strdup(yytext);
                    if (!yylval.id) {
                        yyerror("Memory allocation failed for identifier");
                        exit(1);
                    }
                    printf("TOKEN: ID(%s)\n", yylval.id);
                    return ID;
                }

[ \t\r]+        ; /* Skip spaces, tabs, and carriage returns */
\n              ; /* Skip newlines, yylineno tracks line numbers */

"//"[^\n]*      { printf("COMMENT: Skipping line comment\n"); } /* Single-line comments */
"/*"([^*]|\*[^/])*"\*/" { printf("COMMENT: Skipping multi-line comment\n"); } /* Multi-line comments */

.               {
                    printf("ERROR: Unknown character: '%s'\n", yytext);
                    char msg[256];
                    snprintf(msg, sizeof(msg), "Unknown character: %s", yytext);
                    yyerror(msg);
                }

%%

int yywrap() {
    return 1;
}