var currentToken;
var currentNode;
var indentLevel;
var tokenIndex;
var panic;

/**
 * Base parser function. Handles recursion start and CST generation.
 * Recursive path: parseProgram next.
 */
function parser() {
	var cst = new Node();
	cst.contents = "cst";
	currentNode = cst;
	indentLevel = -1;
	tokenIndex = 0;
	panic = false;
	currentToken = getNext();
	parseProgram();
	if (!panic) {
//		printCSTOutput(printCST(cst));
		return true;
	} else {
		return false;
	}
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
	if (!panic) {
		//Expected token type
		if (cToken != "T_RBrace") {
			printVerbose("Expecting a {0}".format(cToken));
		} else {
			printVerbose("Expecting a {0} or a statement".format(cToken));
		}
		
		//Acquired token type
		if (currentToken.type == cToken) {
			printVerbose("Got a {0}!".format(cToken));
		} else {
			if (cToken != "T_RBrace") {
				printVerbose("Parse Error: Expected {0}, got {1} at line {2} character {3}".format(cToken, currentToken.type, currentToken.lineNumber, currentToken.linePosition));
			} else {
				printVerbose("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Print | T_ID | T_Type | T_While | T_If | T_LBrace | T_RBrace", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
			}
			panic = true;
		}
		
		if (currentToken.type != "T_EOF") {
			currentToken = getNext();
		}
	}
}

function branchNode(n) {
	var node = new Node();
	if (currentToken.type.substr(2) == n.toLowerCase()) {
		node.contents = { name: n, token: currentToken };
	} else {
		node.contents = { name: n };
	}
	node.parent = currentNode;
	currentNode.children.push(node);
	currentNode = node;
	window["parser" + n]();
	currentNode = currentNode.parent;
}
/*
function leafNode(n) {
	var node = new Node();
}
*/
function printCST(cst) {
	var output = "";
	if (indentLevel >= 0) {
		output += printNode(cst.contents);
	}
	indentLevel++;
	for (var i = 0; i < cst.children.length; i++) {
		output += printCST(cst.children[i]);
	}
	indentLevel--;
	return output;
}

function printNode(n) {
	var temp = n.name;
	if (n.token != null && n.token.value != null) {
		n += "({0})".format(n.token.value);
	}
	if (indentLevel > 0) {
		for (var i = 0; i < indentLevel; i++) {
			n = "| " + n;
		}
	}
	return n + "\n";
}

/**
 * Parse program function.
 * Recursive path: parseBlock next.
 */
function parseProgram() {
	if (!panic) {
		parseBlock();
		checkToken("T_EOF");
		success = true;
	}
}

/**
 * Parse block function.
 * Recursive path: parseStatementList next.
 */
function parseBlock() {
	if (!panic) {
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
	if (!panic) {
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
	if (!panic) {
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
	if (!panic) {
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
	if (!panic) {
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
	if (!panic) {
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
	if (!panic) {
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
	if (!panic) {
		parseType();
		parseId();
	}
}

/**
 * Parse expr statement function.
 * Recursive path: parseInt, parseString, parseBoolean, or parseId next. If none, throw parse error.
 */
function parseExpr() {
	if (!panic) {
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
				printVerbose("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Digit | T_Quote | T_LParen | T_Boolval | T_ID", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
				panic = true;
				break;
		}
	}
}

/**
 * Parse int statement function.
 * Recursive path: parseDigit next. If intop token detected, parseIntop then parseExpr next.
 */
function parseIntExpr() {
	if (!panic) {
		parseDigit();
		if (currentToken.type == "T_Intop") {
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
	if (!panic) {
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
	if (!panic) {
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
	if (!panic)
		checkToken("T_ID");
}

/**
 * Parse charlist statement function.
 * Recursive path: If char token detected, parseChar then parseCharList next. If space token detected, parseSpace then parseCharList next, or epsilon.
 */
function parseCharList() {
	if (!panic) {
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
	if (!panic)
		checkToken("T_Type");
}

/**
 * Parse char statement function.
 * Recursive path: Path end, check char token.
 */
function parseChar() {
	if (!panic)
		checkToken("T_Char");
}

/**
 * Parse space statement function.
 * Recursive path: Path end, check space token.
 */
function parseSpace() {
	if (!panic)
		checkToken("T_Space");
}

/**
 * Parse digit statement function.
 * Recursive path: Path end, check digit token.
 */
function parseDigit() {
	if (!panic)
		checkToken("T_Digit");
}

/**
 * Parse boolop statement function.
 * Recursive path: Path end, check boolop token.
 */
function parseBoolop() {
	if (!panic)
		checkToken("T_Boolop");
}

/**
 * Parse boolval statement function.
 * Recursive path: Path end, check boolval token.
 */
function parseBoolval() {
	if (!panic)
		checkToken("T_Boolval");
}

/**
 * Parse intop statement function.
 * Recursive path: Path end, check intop token.
 */
function parseIntop() {
	if (!panic)
		checkToken("T_Intop");
}