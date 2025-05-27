%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"

extern int yylex();
extern int yylineno;
extern FILE* yyin;
extern char* yytext;

AST* root = NULL;

void yyerror(const char* s) {
    fprintf(stderr, "Error at line %d: %s\n", yylineno, s);
    fprintf(stderr, "Last token read: '%s'\n", yytext);
}

void free_ast(AST* node);
%}

%union {
    int num;
    double fnum;
    char* id;
    AST* node;
}

%token <num> NUMBER
%token <fnum> FLOAT
%token <id> ID
%token IF ELSE WHILE
%token EQ NEQ LEQ GEQ

%type <node> program stmt_list stmt matched_stmt unmatched_stmt expr block

%left EQ NEQ LEQ GEQ
%left '+' '-'
%left '*' '/'

%start program

%%

program:
    stmt_list { printf("DEBUG: Reduced program -> stmt_list\n"); root = $1; $$ = $1; }
    ;

stmt_list:
    stmt_list stmt { printf("DEBUG: Reduced stmt_list -> stmt_list stmt\n"); $$ = create_node("stmt_list", NULL, $1, $2); }
    | stmt { printf("DEBUG: Reduced stmt_list -> stmt\n"); $$ = $1; }
    ;

stmt:
    matched_stmt { printf("DEBUG: Reduced stmt -> matched_stmt\n"); $$ = $1; }
    | unmatched_stmt { printf("DEBUG: Reduced stmt -> unmatched_stmt\n"); $$ = $1; }
    ;

matched_stmt:
    IF '(' expr ')' matched_stmt ELSE matched_stmt
        { printf("DEBUG: Reduced matched_stmt -> IF ( expr ) matched_stmt ELSE matched_stmt\n"); $$ = create_node("if_else_stmt", NULL, $3, create_node("branch", NULL, $5, $7)); }
    | WHILE '(' expr ')' matched_stmt
        { printf("DEBUG: Reduced matched_stmt -> WHILE ( expr ) matched_stmt\n"); $$ = create_node("while_stmt", NULL, $3, $5); }
    | ID '=' expr ';'
        { printf("DEBUG: Reduced matched_stmt -> ID = expr ;\n"); $$ = create_node("assign_stmt", $1, $3, NULL); free($1); }
    | expr ';'
        { printf("DEBUG: Reduced matched_stmt -> expr ;\n"); $$ = create_node("expr_stmt", NULL, $1, NULL); }
    | block
        { printf("DEBUG: Reduced matched_stmt -> block\n"); $$ = $1; }
    ;

unmatched_stmt:
    IF '(' expr ')' stmt
        { printf("DEBUG: Reduced unmatched_stmt -> IF ( expr ) stmt\n"); $$ = create_node("if_stmt", NULL, $3, $5); }
    | IF '(' expr ')' matched_stmt ELSE unmatched_stmt
        { printf("DEBUG: Reduced unmatched_stmt -> IF ( expr ) matched_stmt ELSE unmatched_stmt\n"); $$ = create_node("if_else_stmt", NULL, $3, create_node("branch", NULL, $5, $7)); }
    | WHILE '(' expr ')' unmatched_stmt
        { printf("DEBUG: Reduced unmatched_stmt -> WHILE ( expr ) unmatched_stmt\n"); $$ = create_node("while_stmt", NULL, $3, $5); }
    ;

block:
    '{' stmt_list '}'
        { printf("DEBUG: Reduced block -> { stmt_list }\n"); $$ = create_node("block", NULL, $2, NULL); }
    | '{' '}'
        { printf("DEBUG: Reduced block -> { }\n"); $$ = create_node("block", NULL, NULL, NULL); }
    ;

expr:
    expr '+' expr
        { printf("DEBUG: Reduced expr -> expr + expr\n"); $$ = create_node("add", NULL, $1, $3); }
    | expr '-' expr
        { printf("DEBUG: Reduced expr -> expr - expr\n"); $$ = create_node("sub", NULL, $1, $3); }
    | expr '*' expr
        { printf("DEBUG: Reduced expr -> expr * expr\n"); $$ = create_node("mul", NULL, $1, $3); }
    | expr '/' expr
        { printf("DEBUG: Reduced expr -> expr / expr\n"); $$ = create_node("div", NULL, $1, $3); }
    | expr EQ expr
        { printf("DEBUG: Reduced expr -> expr EQ expr\n"); $$ = create_node("eq", NULL, $1, $3); }
    | expr NEQ expr
        { printf("DEBUG: Reduced expr -> expr NEQ expr\n"); $$ = create_node("neq", NULL, $1, $3); }
    | expr LEQ expr
        { printf("DEBUG: Reduced expr -> expr LEQ expr\n"); $$ = create_node("leq", NULL, $1, $3); }
    | expr GEQ expr
        { printf("DEBUG: Reduced expr -> expr GEQ expr\n"); $$ = create_node("geq", NULL, $1, $3); }
    | '(' expr ')'
        { printf("DEBUG: Reduced expr -> ( expr )\n"); $$ = $2; }
    | NUMBER
        {
            printf("DEBUG: Reduced expr -> NUMBER\n");
            char buf[32];
            snprintf(buf, sizeof(buf), "%d", $1);
            $$ = create_node("number", buf, NULL, NULL);
        }
    | FLOAT
        {
            printf("DEBUG: Reduced expr -> FLOAT\n");
            char buf[32];
            snprintf(buf, sizeof(buf), "%.2f", $1);
            $$ = create_node("float", buf, NULL, NULL);
        }
    | ID
        {
            printf("DEBUG: Reduced expr -> ID\n");
            $$ = create_node("id", $1, NULL, NULL);
            free($1);
        }
    ;

%%

int main(int argc, char **argv) {
    FILE* input_file = NULL;
    if (argc > 1) {
        input_file = fopen(argv[1], "r");
        if (!input_file) {
            perror("File open failed");
            return 1;
        }
        yyin = input_file;
    } else {
        yyin = stdin;
    }

    if (yyparse() == 0) {
        printf("Parsing finished successfully.\n");
        if (root) {
            printf("AST:\n");
            print_ast(root, 0);
            free_ast(root);
        }
    } else {
        printf("Parsing failed.\n");
    }

    if (input_file) fclose(input_file);
    return 0;
}