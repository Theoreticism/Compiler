var currentToken;
var currentCSTNode;
var indentLevel;
var tokenIndex;
var panic;

/**
 * Base parser function. Handles recursion start and CST generation.
 * Recursive path: parseProgram next.
 */
function parser() {
	cst = new Node();
	cst.contents = { name:"CST" };
	currentCSTNode = cst;
	indentLevel = -1;
	tokenIndex = 0;
	panic = false;
	currentToken = getNext();
	branchNode("Program");
	if (!panic) {
		// The <pre> HTML tag defines preformatted text
		printCSTOutput("Concrete Syntax Tree<pre>{0}</pre>".format(printCST(cst)));
		return true;
	} else
		return false;
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
		// Expected token type
		if (cToken != "T_RBrace") {
			printVerbose("Expecting a {0}".format(cToken));
		} else {
			printVerbose("Expecting a {0} or a statement".format(cToken));
		}
		
		// Acquired token type
		if (currentToken.type == cToken) {
			printVerbose("Got a {0}!".format(cToken));
		} else {
			if (cToken != "T_RBrace") {
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format(cToken, currentToken.type, currentToken.lineNumber, currentToken.linePosition));
			} else {
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Print | T_Id | T_Type | T_While | T_If | T_LBrace | T_RBrace", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
			}
			panic = true;
		}
		
		if (currentToken.type != "T_EOF") {
			currentToken = getNext();
		}
	}
}

/**
 * Creates a branch node for the Concrete Syntax Tree.
 *
 * @param {String} n The production for which a branch node is to be created
 */
function branchNode(n) {
	var node = new Node();
	
	if (DEBUG) {
		printOutput("*DEBUG MODE* " + currentToken.type.substr(2) + " | " + n + " BRANCHNODE");
	}
	
	// Fill contents with value n as name
	node.contents = { name: n };
	
	// Assign a parent (current node)
	node.parent = currentCSTNode;
	
	// Go to parent's children
	currentCSTNode.children.push(node);
	
	// Update current node
	currentCSTNode = node;
	
	// parse + n(), example: parse + Block() = parseBlock() function call
	window["parse" + n]();
}

/**
 * Creates a leaf node for the Concrete Syntax Tree.
 *
 * @param {String} n The production for which a leaf node is to be created
 */
function leafNode(n) {
	var node = new Node();
	
	if (DEBUG) {
		printOutput("*DEBUG MODE* " + currentToken.type.substr(2) + " | " + n + " | " + currentToken.value + " LEAFNODE");
	}
	
	// For leaf nodes, store token as well as name
	if (currentToken.type.substr(2) == n) {
		node.contents = { name: n, token: currentToken };
	} else {
		node.contents = { name: n };
	}
	
	// Assign a parent (current node)
	node.parent = currentCSTNode;
	
	// Go to parent's children
	currentCSTNode.children.push(node);
	
	// parse + n(), example: parse + Block() = parseBlock() function call
	window["parse" + n]();
}

/**
 * Returns to parent node in CST after processing.
 */
function returnToParent() {
	currentCSTNode = currentCSTNode.parent;
}

/**
 * Generates the CST in human-readable format.
 *
 * @return Formatted CST
 */
function printCST(cst) {
	var output = "";
	if (indentLevel >= 0) {
		output += printCSTNode(cst.contents);
	}
	indentLevel++;
	for (var i = 0; i < cst.children.length; i++) {
		output += printCST(cst.children[i]);
	}
	indentLevel--;
	return output;
}

/**
 * Helper function that controls the aesthetics of the CST node printing.
 *
 * @return Formatted node
 */
function printCSTNode(n) {
	var t = n.name;
	if (n.token != null && n.token.value != null) {
		t += "({0})".format(n.token.value);
	}
	if (indentLevel > 0) {
		for (var i = 0; i < indentLevel; i++) {
			t = "| " + t;
		}
	}
	return t + "\n";
}

/**
 * Parse program function.
 * Recursive path: parseBlock next.
 */
function parseProgram() {
	if (!panic) {
		branchNode("Block");
		checkToken("T_EOF");
		returnToParent();
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
		branchNode("StatementList");
		checkToken("T_RBrace");
		returnToParent();
	}
}

/**
 * Parse statement list function.
 * Recursive path: parseStatement then parseStatementList next, or epsilon.
 */
function parseStatementList() {
	if (!panic) {
		if (currentToken.type == "T_Print" | currentToken.type == "T_While" | currentToken.type == "T_If" | currentToken.type == "T_Type" | currentToken.type == "T_Id" | currentToken.type == "T_LBrace") {
			branchNode("Statement");
			branchNode("StatementList");
			returnToParent();
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
				branchNode("PrintStatement");
				returnToParent();
				break;
			case 'T_While':
				branchNode("WhileStatement");
				returnToParent();
				break;
			case 'T_If':
				branchNode("IfStatement");
				returnToParent();
				break;
			case 'T_Type':
				branchNode("VarDecl");
				returnToParent();
				break;
			case 'T_Id':
				branchNode("AssignmentStatement");
				returnToParent();
				break;
			case 'T_LBrace':
				branchNode("Block");
				returnToParent();
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
		branchNode("Expr");
		checkToken("T_RParen");
		returnToParent();
	}
}

/**
 * Parse while statement function.
 * Recursive path: parseBooleanExpr then parseBlock next.
 */
function parseWhileStatement() {
	if (!panic) {
		checkToken("T_While");
		branchNode("BooleanExpr");
		branchNode("Block");
		returnToParent();
	}
}

/**
 * Parse if statement function.
 * Recursive path: parseBooleanExpr then parseBlock next.
 */
function parseIfStatement() {
	if (!panic) {
		checkToken("T_If");
		branchNode("BooleanExpr");
		branchNode("Block");
		returnToParent();
	}
}

/**
 * Parse assignment statement function.
 * Recursive path: parseId then parseExpr next.
 */
function parseAssignmentStatement() {
	if (!panic) {
		leafNode("Id");
		checkToken("T_Assign");
		branchNode("Expr");
		returnToParent();
	}
}

/**
 * Parse variable declaration statement function.
 * Recursive path: parseType then parseId next.
 */
function parseVarDecl() {
	if (!panic) {
		leafNode("Type");
		leafNode("Id");
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
				branchNode("IntExpr");
				returnToParent();
				break;
			case 'T_Quote':
				branchNode("StringExpr");
				returnToParent();
				break;
			case 'T_LParen':
				branchNode("BooleanExpr");
				returnToParent();
				break;
			case 'T_Boolval':
				branchNode("BooleanExpr");
				returnToParent();
				break;
			case 'T_Id':
				leafNode("Id");
				break;
			default:
				printOutput("Parse Error: Expected {0}, got {1} at line {2} character {3}".format("T_Digit | T_Quote | T_LParen | T_Boolval | T_Id", currentToken.type, currentToken.lineNumber, currentToken.linePosition));
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
		leafNode("Digit");
		if (currentToken.type == "T_Intop") {
			leafNode("Intop");
			branchNode("Expr");
			returnToParent();
		}
	}
}

/**
 * Parse string statement function.
 * Recursive path: parseCharList next.
 */
function parseStringExpr() {
	if (!panic) {
		var node = new Node();
		checkToken("T_Quote");
		// Special case: String of length 0
		if (currentToken.type == "T_Quote") {
			branchNode("CharList");
			node.contents = { name: "String" };
			node.parent = currentCSTNode;
			currentCSTNode.children.push(node);
			currentCSTNode = node;
			checkToken("T_Quote");
			returnToParent();
		} else {
			branchNode("CharList");
			node.contents = { name: "String", token: currentToken };
			node.parent = currentCSTNode;
			currentCSTNode.children.push(node);
			currentCSTNode = node;
			checkToken("T_String");
			checkToken("T_Quote");
			returnToParent();
			returnToParent();
		}
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
			branchNode("Expr");
			leafNode("Boolop");
			branchNode("Expr");
			checkToken("T_RParen");
			returnToParent();
		} else if (currentToken.type == "T_Boolval") {
			leafNode("Boolval");
		}
	}
}

/**
 * Parse id statement function.
 * Recursive path: Path end, check ID token.
 */
function parseId() {
	if (!panic)
		checkToken("T_Id");
}

/**
 * Parse charlist statement function.
 * Recursive path: If char token detected, parseChar then parseCharList next. If space token detected, parseSpace then parseCharList next, or epsilon.
 */
function parseCharList() {
	if (!panic) {
		if (currentToken.type == "T_Char") {
			leafNode("Char");
			branchNode("CharList");
			returnToParent();
		} else if (currentToken.type == "T_Space") {
			leafNode("Space");
			branchNode("CharList");
			returnToParent();
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