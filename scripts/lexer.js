var lineNumber;
var charPosition;
var currentToken;

function lexer() {

}

function nextToken() {
	
}

function idToken(s) {
	s = s.trim(); //Remove excess whitespace
	if (s.length === 0) return true;
	
	switch (s) {
		case '{':
			//T_LBRACE
		case '}':
			//T_RBRACE
		case '(':
			//T_LPAREN
		case ')':
			//T_RPAREN
		case '=':
			//T_ASSIGN
		case '==':
		case '!=':
			//T_BOOLOP
		case '$':
			//T_EOF
		case '+':
			//T_OPERATOR
		case '"':
			//T_QUOTE
		case 'false':
		case 'true':
			//T_BOOLEAN
		case 'print':
		case 'while':
		case 'if':
			//T_KEYWORD
		case 'int':
		case 'string':
		case 'boolean':
			//T_TYPE
		default:
			break;
	}
	
}