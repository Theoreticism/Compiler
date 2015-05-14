var currentEnvNode;
var currentASTNode;
var indentLevel;
var symbolTable;
var success;

/**
 * Base semantics analyzer function. Handles creation of environment and AS trees.
 *
 * @return {boolean} True if semantic analysis was successful, false otherwise.
 */
function analyzer() {
	environ = new Node();
	environ.contents = "Environment";
	currentEnvNode = environ;
	printOutput("Starting scope and type check...");
	success = analyzeNode(cst);
	if (success) {
		printOutput("Scope and type check successful!<hr />");
		printOutput("Symbol Table:");
		symbolTable = "";
		buildSymbolTable(environ);
		if (symbolTable != "") {
			printOutput(symbolTable);
		}
		printOutput("<hr />");
		ast = new Node();
		ast.contents = { name:"AST" };
		currentASTNode = ast;
		// Insert the first child of the node "CST", which is "Program"
		buildAST(cst.children[0]);
		indentLevel = -1;
		// The <pre> HTML tag defines preformatted text
		printASTOutput("Abstract Syntax Tree<pre>{0}</pre>".format(printAST(ast)));
		return true;
	} else {
		return false;
	}
}

/**
 * Recursively analyzes every node given from the Concrete Syntax Tree.
 *
 * @param {Node} cst The given Concrete Syntax Tree
 * @return {boolean} True if no semantic errors were thrown, false otherwise
 */
function analyzeNode(cst) {
	if (DEBUG) {
		printOutput("*DEBUG MODE* Current CST node contents: " + cst.contents.name);
	}
	
	switch (cst.contents.name) {
		case 'Block':
			// Signifies beginning of Block
			var enviroNode = new Node();
			enviroNode.contents = [];
			enviroNode.contents["scopeLevel"] = currentEnvNode.children.length + 1;
			enviroNode.parent = currentEnvNode;
			currentEnvNode.children.push(enviroNode);
			currentEnvNode = enviroNode;
			printVerbose("Opening scope {0}".format(getScope(currentEnvNode)));
			break;
		case 'StatementList':
			// StatementList with no children signifies end of Block
			if (cst.children.length == 0) {
				printVerbose("Closing scope {0}".format(getScope(currentEnvNode)));
				currentEnvNode = currentEnvNode.parent;
			}
			break;
		case 'IntExpr':
			// Handles IntExpr operations
			if (cst.children.length == 3) {
				if (cst.children[2].children[0].contents.name == "Id") {
					var value = cst.children[2].children[0].contents.token.value;
					var lineNum = cst.children[2].children[0].contents.token.lineNumber;
					var linePos = cst.children[2].children[0].contents.token.linePosition;
					var idType = getType(currentEnvNode, value);
					
					if (!isInitialized(currentEnvNode, value)) {
						printOutput("Warning: Uninitialized variable '{0}' on line {1} character {2}".format(value, lineNum, linePos));
					}
					
					if (idType != "int") {
						printOutput("Semantic Error: Type mismatch on line {0} character {1}. Expected '{2}' to be 'int', got '{3}'".format(lineNum, linePos, idType, value));
						return false;
					} else {
						printVerbose("Type check match: int to int");
					}
				} else if (cst.children[2].children[0].contents.name != "IntExpr") {
					var lineNum = cst.children[0].contents.token.lineNumber;
					var linePos = cst.children[0].contents.token.linePosition;
					var tName = cst.children[2].children[0].contents.name;
					printOutput("Semantic Error: Type mismatch on line {0} character {1}. Expected IntExpr, got {2}".format(lineNum, linePos, tName));
					return false;
				} else {
					printVerbose("Type check match: 'int' to 'int'");
				}
			}
			break;
		case 'Id':
			// Handles variable identifiers
			var parent = cst.parent.contents.name;
			var value = cst.contents.token.value;
			var lineNum = cst.contents.token.lineNumber;
			var linePos = cst.contents.token.linePosition;
			var idType;
			
			// Check id type
			if (parent == "VarDecl") {
				idType = cst.parent.children[0].contents.token.value;
			} else if (!inScope(currentEnvNode, value)) {
				printOutput("Semantic Error: Undeclared variable '{0}' used on line {1} character {2}".format(value, lineNum, linePos));
				return false;
			} else {
				idType = getType(currentEnvNode, value);
				varUsed(currentEnvNode, value);
			}
			
			// Handles variable declaration
			switch (parent) {
				case 'VarDecl':
					// If var has not already been declared in this scope, add to current environment node
					if (currentEnvNode.contents[value] == null) {
						// Fastest way to deep clone an object
						var token = JSON.parse(JSON.stringify(cst.contents.token));
						token.name = value;
						token.type = idType;
						token.value = null;
						currentEnvNode.contents[value] = token;
						printVerbose("Variable declared: '{0}' of type {1}".format(value, idType));
					} else {
						printOutput("Semantic Error: Variable '{0}' on line {1} character {2} already declared".format(value, lineNum, linePos))
						return false;
					}
					break;
				case 'Expr':
					var expType = cst.parent.parent.contents.name;
					if (expType == "IntExpr" && idType != "int") {
						printOutput("Semantic Error: Type mismatch on line {0} character {1}. Expected '{2}' to be 'int', got '{3}'".format(lineNum, linePos, idType, value));
						return false;
					} else if (expType == "BooleanExpr") {
						var comparedToken = cst.parent.children[2].children[0];
						var expectedType = comparedToken.contents.name;
						if (expectedType == "Id") {
							expectedType = getType(currentEnvNode, comparedToken.contents.token.value);
						} else {
							expectedType = expectedType.substr(0, expectedType.length - 4).toLowerCase();
						}
						if (idType != expectedType) {
							printOutput("Semantic Error: Type mismatch on line {0} character {1}. Expected '{2}' to be '{3}', got '{4}'".format(lineNum, linePos, value, idType, expectedType));
							return false;
						} else {
							printVerbose("Type check match: '{0}' to '{1}'".format(idType, expectedType));
						}
					}
					break;
				case 'AssignmentStatement':
					var comparedToken = cst.parent.children[1].children[0];
					var expectedType = comparedToken.contents.name;
					if (expectedType == "Id") {
						expectedType = getType(currentEnvNode, comparedToken.contents.token.value);
						if (!isInitialized(currentEnvNode, comparedToken.contents.token.value)) {
							printOutput("Warning: Uninitialized variable '{0}' on line {1} character {2}".format(comparedToken.contents.token.value, lineNum, linePos));
						}
					} else {
						expectedType = expectedType.substr(0, expectedType.length - 4).toLowerCase();
					}
					if (idType != expectedType) {
						printOutput("Semantic Error: Type mismatch on line {0} character {1}. Expected '{2}' to be '{3}', got '{4}'".format(lineNum, linePos, value, idType, expectedType));
						return false;
					} else {
						printVerbose("Type check match: '{0}' to '{1}'".format(idType, expectedType));
						varInitialized(currentEnvNode, value);
					}
					break;
				default:
					break;
			}
			break;
		default:
			break;
	}
	// Recursively analyze down the tree
	for (var i = 0; i < cst.children.length; i++) {
		if (!analyzeNode(cst.children[i])) {
			return false;
		}
	}
	return true;
}

/**
 * Helper function that creates a new node in the Abstract Syntax Tree.
 *
 * @param {String} contents Name value of the new node
 */
function newNode(contents) {
	var node = new Node();
	node.contents = [];
	node.contents.name = contents;
	node.parent = currentASTNode;
	currentASTNode.children.push(node);
	currentASTNode = node;
}

/**
 * Recursively builds and connects each node in the Abstract Syntax Tree.
 *
 * @param {Node} node The node being analyzed
 */
function buildAST(node) {
	var string;
	var build = false;
	
	// Some type of statement (print, while, if, etc.)
	if (((node.contents.name.indexOf("Statement") > 0) || 
		// Non-statement or node with multiple children
		(node.children.length != 1 && node.contents.name.indexOf("Statement") == -1) ||
		// Opening statement - Program
		(node.contents.name == "Program") ||
		// Opening statement - Block
		(node.contents.name == "Block")) && 
		// Remove charlist, chars and whitespace; use String for AST instead
		(node.contents.name != "Char") &&
		(node.contents.name != "CharList") &&
		(node.contents.name != "Space")) {
			if (node.children.length == 0) {
				// Create and insert new AST leaf node
				var astNode = new Node();
				var nodeContents;
				
				// Special case for Strings of length 0
				if (node.contents.name == "String" && node.contents.token == undefined) {
					nodeContents = '""';
				} else if (node.contents.name == "String" && node.contents.token != undefined) {
					nodeContents = '"{0}"'.format(node.contents.token.value);
				} else if (node.contents.name == "Intop") {
					nodeContents = "+";
				} else {
					nodeContents = node.contents.token.value;
				}
				
				insertASTNode(nodeContents);
			} else {
				// Create and insert new AST branch node
				if (node.contents.name == "Expr") {
					insertASTNode("BooleanExpr");
				} else {
					insertASTNode(node.contents.name);
				}
			}
		build = true;
	}
	
	// Recursively build AST to all available child nodes
	for (var i = 0; i < node.children.length; i++) {
		buildAST(node.children[i]);
	}
	
	// Reached leaf node and current AST node not Block or AssignmentStatement, return to parent
	if (node.children.length == 0 && currentASTNode.contents.name != "Block" && currentASTNode.contents.name != "AssignmentStatement" && node.contents.name != "Char" && node.contents.name != "Space") {
		currentASTNode = currentASTNode.parent;
	}
	
	// Reached branch node or Block node or Print node, return to parent if not null
	if ((node.children.length > 1 || node.contents.name == "Block" || node.contents.name == "PrintStatement") && node.contents.name != "CharList" && build == true) {
		if (currentASTNode != null) {
			currentASTNode = currentASTNode.parent;
		}
	}
}

/**
 * Helper function that recurses and prints the entire Abstract Syntax Tree.
 *
 * @param {Node} ast The root node of the AST.
 * @return {String} The AST in human-readable format.
 */
function printAST(ast) {
	var output = "";
	if (indentLevel >= 0) {
		output += printASTNode(ast.contents);
	}
	indentLevel++;
	for (var i = 0; i < ast.children.length; i++) {
		output += printAST(ast.children[i]);
	}
	indentLevel--;
	return output;
}

/**
 * Helper function that prints each AST node with correct indentation.
 *
 * @param {Node} n Node being printed
 */
function printASTNode(n) {
	var t = n.name;
	if (indentLevel > 0) {
		for (var i = 0; i < indentLevel; i++) {
			t = "| " + t;
		}
	}
	return t + "\n";
}

/**
 * Helper function that inserts a new AST node.
 *
 * @param {String} name Name of the AST node
 */
function insertASTNode(name) {
	if (DEBUG) {
		printOutput("*DEBUG MODE* Current AST node contents: " + currentASTNode.contents.name);
		printOutput("*DEBUG MODE* Current child: " + name);
	}
	
	var node = new Node();
	node.contents = [];
	node.contents.name = name;
	node.parent = currentASTNode;
	currentASTNode.children.push(node);
	currentASTNode = node;
}

/**
 * Recursively builds the symbol table from the environment (scope) tree.
 *
 * @param {Node} environment The environment tree
 */
function buildSymbolTable(environment) {
	if (environment.contents != "Environment") {
		for (var key in environment.contents) {
			// Note: hasOwnProperty returns a boolean value based on if the object has the property key
			if (key != "scopeLevel" && environment.contents.hasOwnProperty(key)) {
				var token = environment.contents[key];
				var used = "";
				if (token.used == false) {
					used = "un";
					symbolTable += "Warning: Unused variable '{0}' on line {1} character {2}<br />".format(token.name, token.lineNumber, token.linePosition);
				}
				printOutput("{0}: type {1} on line {2} character {3} in scope {4}. Status: {5}used".format(token.name, token.type, token.lineNumber, token.linePosition, getScope(environment), used));
			}
		}
	}
	
	if (environment.children != null) {
		for (var i = 0; i < environment.children.length; i++) {
			buildSymbolTable(environment.children[i]);
		}
	}
}

/**
 * Helper function to get the scope of a specified node.
 *
 * @param {Node} enviroNode Environment node; used to determine scope and type
 * @return {String} Scope list from specified node to root
 */
function getScope(enviroNode) {
	if (enviroNode.parent.contents == "Environment") {
		// Base scope
		return "1";
	} else {
		// Recursively get parent scope and append
		return getScope(enviroNode.parent) + "." + enviroNode.contents["scopeLevel"];
	}
}

/**
 * Helper function to get the type of the specified node.
 *
 * @param {Node} enviroNode Environment node; used to determine scope and type
 * @param {String} v Variable of which we are getting the type of
 * @return Type, or if unavailable, type of var in node's parent; otherwise false
 */
function getType(enviroNode, v) {
	if (enviroNode.contents[v] != null) {
		return enviroNode.contents[v].type;
	} else if (enviroNode.parent != null) {
		return getType(enviroNode.parent, v);
	} else {
		return false;
	}
}

/**
 * Helper function to check the scope in which the specified node is in.
 *
 * @param {Node} enviroNode Environment node; used to determine scope and type
 * @param {String} v Variable of which we are checking the scope of
 * @return true if scope is correct, false otherwise; recursively checks up scope tree
 */
function inScope(enviroNode, v) {
	if (enviroNode.contents[v] != null) {
		return true;
	} else if (enviroNode.parent != null) {
		return inScope(enviroNode.parent, v);
	} else {
		return false;
	}
}

/**
 * Helper function to check if a variable has been initialized.
 *
 * @param {Node} enviroNode Environment node; used to determine scope and type
 * @param {String} v Variable of which we are checking initialization status
 * @return true if initialized, false otherwise; recursively checks up scope tree
 */
function isInitialized(enviroNode, v) {
	if (enviroNode.contents[v] != null) {
		if (enviroNode.contents[v].initialized == true) {
			return true;
		} else {
			return false;
		}
	} else if (enviroNode.parent != null) {
		return isInitialized(enviroNode.parent, v);
	} else {
		return false;
	}
}

/**
 * Helper function to tag a variable as used (unused variables throw warnings).
 *
 * @param {Node} enviroNode Environment node; used to determine scope and type
 * @param {String} v Variable being tagged as used
 */
function varUsed(enviroNode, v) {
	if (enviroNode.contents[v] != null) {
		enviroNode.contents[v].used = true;
		printVerbose("Variable '{0}' used; declared in scope {1}".format(v, enviroNode.contents["scopeLevel"]));
	} else if (enviroNode.parent != null) {
		varUsed(enviroNode.parent, v);
	}
}

/**
 * Helper function to tag a variable as initialized (uninitialized variables throw warnings).
 *
 * @param {Node} enviroNode Environment node; used to determine scope and type
 * @param {String} v Variable being tagged as initialized
 */
function varInitialized(enviroNode, v) {
	if (enviroNode.contents[v] != null) {
		enviroNode.contents[v].initialized = true;
		printVerbose("Variable '{0}' initialized; declared in scope {1}".format(v, enviroNode.contents["scopeLevel"]));
	} else if (enviroNode.parent != null) {
		varInitialized(enviroNode.parent, v);
	}
}