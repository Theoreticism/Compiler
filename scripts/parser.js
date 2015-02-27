var currentToken;
var tokenIndex;
var alarm;

/**
 * Base parser function. Handles recursion start and CST generation.
 * Recursive path: parseProgram next.
 */
function parser() {
	tokenIndex = 0;
	alarm = false;
	currentToken = getNext();
	parseProgram();
	//TODO: CST stuff
}

/**
 * Gets the next token in the token list.
 *
 * @return {Token} the next token in the token list
 */
function getNext() {
	if (tokenIndex < tokenlist.length) {
		return tokenlist[tokenIndex++];
	}
}

/**
 * Processes each token for the purposes of printing parsing process to the output box.
 */
function checkToken(cToken) {
	if (!alarm) {
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
			if (cToken != "T_RBrace") {
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format(cToken, currentToken.type, currentToken.lineNumber, currentToken.linePosition));
			} else {
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Print | T_ID | T_Type | T_While | T_If | T_LBrace | T_RBrace", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
			}
			alarm = true;
		}
		
		if (currentToken.type != "T_EOF") {
			currentToken = getNext();
		}
	}
}

/**
 * Parse program function.
 * Recursive path: parseBlock next.
 */
function parseProgram() {
	if (!alarm) {
		parseBlock();
		checkToken("T_EOF");
	}
}

/**
 *
 */
function parseBlock() {
	if (!alarm) {
		checkToken("T_LBrace");
		parseStatementList();
		checkToken("T_RBrace");
	}
}

function parseStatementList() {
	if (!alarm) {
		if (currentToken.type == "T_Print" | currentToken.type == "T_While" | currentToken.type == "T_If" | currentToken.type == "T_Type" | currentToken.type == "T_ID" | currentToken.type == "T_LBrace") {
			parseStatement();
			parseStatementList();	
		} else {
			// Allow no action to be taken as a result; epsilon production	
		}
	}
}

function parseStatement() {
	if (!alarm) {
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
}

function parsePrintStatement() {
	if (!alarm) {
		checkToken("T_Print");
		checkToken("T_LParen");
		parseExpr();
		checkToken("T_RParen");
	}
}

function parseWhileStatement() {
	if (!alarm) {
		checkToken("T_While");
		parseBooleanExpr();
		parseBlock();
	}
}

function parseIfStatement() {
	if (!alarm) {
		checkToken("T_If");
		parseBooleanExpr();
		parseBlock();
	}
}

function parseAssignmentStatement() {
	if (!alarm) {
		parseId();
		checkToken("T_Assign");
		parseExpr();
	}
}

function parseVarDecl() {
	if (!alarm) {
		parseType();
		parseId();
	}
}

function parseExpr() {
	if (!alarm) {
		switch (currentToken.type) {
			case 'T_Digit':
				parseIntExpr();
			case 'T_Quote':
				parseStringExpr();
			case 'T_LParen':
				parseBooleanExpr();
			case 'T_Boolval':
				parseBooleanExpr();
			case 'T_ID':
				parseId();
			default:
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Digit | T_Quote | T_LParen | T_Boolval | T_ID", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
				alarm = true;
				break;
		}
	}
}

function parseIntExpr() {
	if (!alarm) {
		parseDigit();
		if (currentToken == "T_Intop") {
			parseIntop();
			parseExpr();
		}
	}
}

function parseStringExpr() {
	if (!alarm) {
		checkToken("T_Quote");
		parseCharList();
		checkToken("T_Quote");
	}
}

function parseBooleanExpr() {
	if (!alarm) {
		if (currentToken.type == "T_LParen") {
			checkToken("T_LParen");
			parseExpr();
			parseBoolop();
			parseExpr();
			checkToken("T_RParen");
		} else if (currentToken.type == "T_Boolval") {
			parseBoolval();
		}
	}
}

function parseId() {
	if (!alarm)
		checkToken("T_ID");
}

function parseCharList() {
	if (!alarm) {
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
}

function parseType() {
	if (!alarm)
		checkToken("T_Type");
}

function parseChar() {
	if (!alarm)
		checkToken("T_Char");
}

function parseSpace() {
	if (!alarm)
		checkToken("T_Space");
}

function parseDigit() {
	if (!alarm)
		checkToken("T_Digit");
}

function parseBoolop() {
	if (!alarm)
		checkToken("T_Boolop");
}

function parseBoolval() {
	if (!alarm)
		checkToken("T_Boolval");
}

function parseIntop() {
	if (!alarm)
		checkToken("T_Intop");
}