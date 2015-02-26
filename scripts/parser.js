var currentToken;
var tokenIndex;

function parser() {
	tokenIndex = 0;
	currentToken = getNextToken();
	parseProgram();
	//TODO: CST stuff
}

function getNext() {
	if (tokenIndex < tokens.length) {
		return tokens[tokenIndex++];
	}
}

function checkToken(cToken) {

	//Expected token type
	if (cToken != "T_RBrace") {
		printOutput("Expecting a {0}".format(cToken));
	} else {
		printOutput("Expecting a {0} or a statement".format(cToken));
	}
	
	//Acquired token type
	if (currentToken.type == cToken) { //CHECK THIS
		printOutput("Got a {0}".format(cToken));
	} else {
		//Output parse error
	}
	
	if (currentToken.type != "T_EOF") {
		currentToken = getNext();
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