var currentToken;
var tokenIndex;

function parser() {
	tokenIndex = 0;
	currentToken = getNextToken();
	parseProgram();
	//TODO: CST stuff
}

function getNext() {
	if (tokenIndex < tokenlist.length) {
		return tokenlist[tokenIndex++];
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
	if (currentToken.type == cToken) {
		printOutput("Got a {0}".format(cToken));
	} else {
		//Output parse error
	}
	
	if (currentToken.type != "T_EOF") {
		currentToken = getNext();
	}
}

function parseProgram() {
	parseBlock();
	checkToken("T_EOF");
}

function parseBlock() {
	checkToken("T_LBrace");
	parseStatementList();
	checkToken("T_RBrace");
}

function parseStatementList() {
	if (currentToken.type == "T_Print" | currentToken.type == "T_While" | currentToken.type == "T_If" | currentToken.type == "T_Type" | currentToken.type == "T_ID" | currentToken.type == "T_LBrace") {
		parseStatement();
		parseStatementList();	
	} else {
		// Allow no action to be taken as a result; epsilon production	
	}
}

function parseStatement() {
	switch (currentToken.type) {
		case 'T_Print':
			parsePrintStatement();
		case 'T_While':
			parseWhileStatement();
		case 'T_If':
			parseIfStatement();
		case 'T_Type':
			parseVarDecl();
		case 'T_ID':
			parseAssignmentStatement();
		case 'T_LBrace':
			parseBlock();
		default:
			break;
	}
}

function parsePrintStatement() {
	checkToken("T_Print");
	checkToken("T_LParen");
	parseExpr();
	checkToken("T_RParen");
}

function parseWhileStatement() {
	checkToken("T_While");
	parseBooleanExpr();
	parseBlock();
}

function parseIfStatement() {
	checkToken("T_If");
	parseBooleanExpr();
	parseBlock();
}

function parseAssignmentStatement() {
	parseId();
	checkToken("T_Assign");
	parseExpr();
}

function parseVarDecl() {
	parseType();
	parseId();
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
	parseDigit();
	if (currentToken == "T_Intop") {
		parseIntop();
		parseExpr();
	}
}

function parseStringExpr() {
	checkToken("T_Quote");
	parseCharList();
	checkToken("T_Quote");
}

function parseBooleanExpr() {
	if (currentToken.type == "T_LParen");
		checkToken("T_LParen");
		parseExpr();
		parseBoolop();
		parseExpr();
		checkToken("T_RParen");
	else if (currentToken.type == "T_Boolval") {
		parseBoolval();
	}
}

function parseId() {
	checkToken("T_ID");
}

function parseCharList() {
	if (currentToken.type == "T_Char") {
		parseChar();
		parseCharList();
	} else if (currentToken.type == "T_Space") {
		parseSpace();
		parseCharList();	
	} else {
		// Allow no action as a result; epsilon production	
	}
}

function parseType() {
	checkToken("T_Type");
}

function parseChar() {
	checkToken("T_Char");
}

function parseSpace() {
	checkToken("T_Space");
}

function parseDigit() {
	checkToken("T_Digit");
}

function parseBoolop() {
	checkToken("T_Boolop");
}

function parseBoolval() {
	checkToken("T_Boolval");
}

function parseIntop() {
	checkToken("T_Intop");
}