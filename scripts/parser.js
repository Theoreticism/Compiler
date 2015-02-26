var currentToken;
var tokenIndex;

function getNextToken() {
	if (tokenIndex < tokens.length) {
		return tokens[tokenIndex++];
	}
}

function checkToken(cToken) {
	if (cToken != "T_RBrace") {
		printOutput("Expecting a {0}".format(cToken));
	} else {
		printOutput("Expecting a {0} or a statement".format(cToken));
	}
}

function parseProgram() {

}

function parseBlock() {

}

function parseStatementList() {

}

function parseStatement() {
	if () {
		parsePrintStatement();
	} else if () {
		parseAssignmentStatement();
	} else if () {
		parseVarDecl();
	} else if () {
		parseWhileStatement();
	} else if () {
		parseIfStatement();
	} else if () {
		parseBlock();
	}
}

function parsePrintStatement() {

}

function parseAssignmentStatement() {

}

function parseVarDecl() {

}

function parseWhileStatement() {

}

function parseIfStatement() {

}

function parseExpr() {
	if () {
		parseIntExpr();
	} else if () {
		parseStringExpr();
	} else if () {
		parseBooleanExpr();
	}
}

function parseIntExpr() {

}

function parseStringExpr() {

}

function parseBooleanExpr() {

}

function parseId() {

}

function parseCharList() {

}

function parseType() {

}

function parseChar() {

}

function parseSpace() {

}

function parseDigit() {

}

function parseBoolop() {

}

function parseBoolval() {

}

function parsePlus() {

}