var currentToken;
var tokenIndex;
var alarm;
var success = false;

/**
 * Base parser function. Handles recursion start and CST generation.
 * Recursive path: parseProgram next.
 */
function parser() {
	tokenIndex = 0;
	alarm = false;
	currentToken = getNext();
	success = parseProgram();
	//TODO: CST stuff
	return success;
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
			printOutput("Got a {0}!".format(cToken));
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
		return true;
	}
}

/**
 * Parse block function.
 * Recursive path: parseStatementList next.
 */
function parseBlock() {
	if (!alarm) {
		checkToken("T_LBrace");
		parseStatementList();
		checkToken("T_RBrace");
	}
}

/**
 * Parse statement list function.
 * Recursive path: parseStatement then parseStatementList next, or epsilon.
 */
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

/**
 * Parse statement function.
 * Recursive path: parsePrint, parseWhile, parseIf, parseType, parseVarDecl, parseAssignment, or parseBlock next.
 */
function parseStatement() {
	if (!alarm) {
		switch (currentToken.type) {
			case 'T_Print':
				parsePrintStatement();
				break;
			case 'T_While':
				parseWhileStatement();
				break;
			case 'T_If':
				parseIfStatement();
				break;
			case 'T_Type':
				parseVarDecl();
				break;
			case 'T_ID':
				parseAssignmentStatement();
				break;
			case 'T_LBrace':
				parseBlock();
				break;
			default:
				break;
		}
	}
}

/**
 * Parse print statement function.
 * Recursive path: parseExpr next.
 */
function parsePrintStatement() {
	if (!alarm) {
		checkToken("T_Print");
		checkToken("T_LParen");
		parseExpr();
		checkToken("T_RParen");
	}
}

/**
 * Parse while statement function.
 * Recursive path: parseBooleanExpr then parseBlock next.
 */
function parseWhileStatement() {
	if (!alarm) {
		checkToken("T_While");
		parseBooleanExpr();
		parseBlock();
	}
}

/**
 * Parse if statement function.
 * Recursive path: parseBooleanExpr then parseBlock next.
 */
function parseIfStatement() {
	if (!alarm) {
		checkToken("T_If");
		parseBooleanExpr();
		parseBlock();
	}
}

/**
 * Parse assignment statement function.
 * Recursive path: parseId then parseExpr next.
 */
function parseAssignmentStatement() {
	if (!alarm) {
		parseId();
		checkToken("T_Assign");
		parseExpr();
	}
}

/**
 * Parse variable declaration statement function.
 * Recursive path: parseType then parseId next.
 */
function parseVarDecl() {
	if (!alarm) {
		parseType();
		parseId();
	}
}

/**
 * Parse expr statement function.
 * Recursive path: parseInt, parseString, parseBoolean, or parseId next. If none, throw parse error.
 */
function parseExpr() {
	if (!alarm) {
		switch (currentToken.type) {
			case 'T_Digit':
				parseIntExpr();
				break;
			case 'T_Quote':
				parseStringExpr();
				break;
			case 'T_LParen':
				parseBooleanExpr();
				break;
			case 'T_Boolval':
				parseBooleanExpr();
				break;
			case 'T_ID':
				parseId();
				break;
			default:
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Digit | T_Quote | T_LParen | T_Boolval | T_ID", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
				alarm = true;
				break;
		}
	}
}

/**
 * Parse int statement function.
 * Recursive path: parseDigit next. If intop token detected, parseIntop then parseExpr next.
 */
function parseIntExpr() {
	if (!alarm) {
		parseDigit();
		if (currentToken == "T_Intop") {
			parseIntop();
			parseExpr();
		}
	}
}

/**
 * Parse string statement function.
 * Recursive path: parseCharList next.
 */
function parseStringExpr() {
	if (!alarm) {
		checkToken("T_Quote");
		parseCharList();
		checkToken("T_Quote");
	}
}

/**
 * Parse boolean expr statement function.
 * Recursive path: If lparen token detected, parseExpr, parseBoolop then parseExpr next. If boolval token detected, parseBoolval next.
 */
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

/**
 * Parse id statement function.
 * Recursive path: Path end, check ID token.
 */
function parseId() {
	if (!alarm)
		checkToken("T_ID");
}

/**
 * Parse charlist statement function.
 * Recursive path: If char token detected, parseChar then parseCharList next. If space token detected, parseSpace then parseCharList next, or epsilon.
 */
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

/**
 * Parse type statement function.
 * Recursive path: Path end, check type token.
 */
function parseType() {
	if (!alarm)
		checkToken("T_Type");
}

/**
 * Parse char statement function.
 * Recursive path: Path end, check char token.
 */
function parseChar() {
	if (!alarm)
		checkToken("T_Char");
}

/**
 * Parse space statement function.
 * Recursive path: Path end, check space token.
 */
function parseSpace() {
	if (!alarm)
		checkToken("T_Space");
}

/**
 * Parse digit statement function.
 * Recursive path: Path end, check digit token.
 */
function parseDigit() {
	if (!alarm)
		checkToken("T_Digit");
}

/**
 * Parse boolop statement function.
 * Recursive path: Path end, check boolop token.
 */
function parseBoolop() {
	if (!alarm)
		checkToken("T_Boolop");
}

/**
 * Parse boolval statement function.
 * Recursive path: Path end, check boolval token.
 */
function parseBoolval() {
	if (!alarm)
		checkToken("T_Boolval");
}

/**
 * Parse intop statement function.
 * Recursive path: Path end, check intop token.
 */
function parseIntop() {
	if (!alarm)
		checkToken("T_Intop");
}