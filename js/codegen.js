var runtimeEnviron;
var staticCode;
var stackPointer;
var heapPointer;
var stackOverflow;
var success;

/**
 * Base codegen function. Initializes runtime environment, stack pointer, and
 * heap pointer. Handles backpatching and filling unused space with zeroes.
 *
 * @return {boolean} True if codegen was successful, false otherwise
 */
function codegen() {
	runtimeEnviron = [];
	staticCode = [{
		temp: "T1 XX",
		varname: "temp",
		scope: 0,
		vartype: "int",
		address: 0
	}];
	stackPointer = 0;
	heapPointer = 255;
	stackOverflow = false;
	currentEnvNode = environ;
	success = beginCodeGen(ast.children[0]);
	if (!success) {
		return false;
	}
	// backpatch
	// fill rest with zeroes
	// output result?
	return true;
}

/**
 * Begins and handles code generation process in a recursive manner from a
 * given abstract syntax tree and scope environment.
 *
 * @param {Node} ast The given abstract syntax tree.
 * @return {boolean} True if stack did not overflow, false otherwise
 */
function beginCodeGen(ast) {
	// Calls generate function for the ast node specified (non-leaf nodes only)
	if (ast.children.length > 0) {
		printOutput("Generating code for " + node.contents.name);
		window["generate" + node.contents.name](ast);
		if (stackOverflow) {
			printOutput("Codegen Error: Stack Overflow!");
			return false;
		}
	}
	
	// Block start, move scope pointer down to first child
	if (node.contents.name == "Block") {
		currentEnvNode = currentEnvNode.children[0];
	}
	
	// Recurse on non-statement children
	if (node.contents.name.indexOf("Statement") == -1) {
		for (var i = 0; i < node.children.length; i++) {
			if (!stackOverflow) {
				beginCodeGen(node.children[i]);
			} else {
				return false;
			}
		}
	}
	
	// Block end, move scope pointer up to parent
	if (node.contents.name == "Block") {
		currentEnvNode = currentEnvNode.parent;
		// Splice: at position 0, remove 1 item; don't need info from node anymore
		currentEnvNode.children.splice(0, 1);
	}
	
	return true;
}

/**
 * Handles insertion of 6502a machine code into the runtime environment. If
 * the stack overlaps into the heap, triggers a stack overflow.
 *
 * @param {String} code The 6502a machine code to be inserted
 */
function insertCode(code) {
	var code = code.split(" ");
	for (var i = 0; i < code.length; i++) {
		runtimeEnviron[stackPointer] = code[i];
		stackPointer++;
		if (stackPointer >= heapPointer) {
			stackOverflow = true;
		}
	}
}

/**
 * Writes the string data (contents) into heap memory.
 *
 * @param {String} str String contents to be written into the heap
 */
function writeStringToHeap(str) {
	heapPointer = heapPointer - str.length;
	for (var i = 0; i < str.length; i++) {
		runtimeEnviron[heapPointer] = toByte(str.charCodeAt(i));
		heapPointer++;
	}
	runtimeEnviron[heapPointer] = "00";
	heapPointer = heapPointer - (str.length + 1);
}

/** 
 * Converts a number in string format to a hexadecimal value in string format.
 *
 * @param {String} str Number in string format
 * @return {String} The hex value in string format
 */
function toBytes(str) {
	if (!(str instanceof String)) {
		str = str + "";
	}
	var hexVal = parseInt(str).toString(16).toUpperCase();
	if (hexVal.length == 1) {
		hex = "0" + hex;
	}
	return hex;
}

/**
 * Sorts static code by decreasing scope length. This enables iteration over 
 * the static code to get the first partial match to get the correct scope.
 *
 * This function is being used in the getTempCode() and getType() functions'
 * sort calls as a parameter: the compare function that defines sort order.
 *
 * @param {list} a List representing the first static code
 * @param {list} b List representing the second static code
 * @return {integer} Decreased scope length
 */
function sortStaticCode(a, b) {
	return b.scope.length - a.scope.length;
}

/**
 * Helper function to get the 6502a machine code representing temporary variable
 * storage from the static code.
 *
 * @param {String} varName Name of the variable for which temp code is being acquired
 * @param {integer} scope Scope of the variable for which temp code is being acquired
 * @return {String} Temp code for the code
 */
function getTempCode(varName, scope) {
	staticCode.sort(sortStaticCode);
	for (var i = 0; i < staticCode.length; i++) {
		if (staticCode[i].varname == varName && scope.indexOf(staticCode[i].scope) == 0) {
			return staticCode[i].temp;
		}
	}
}

/**
 * Helper function to get the variable type for a variable from static code.
 *
 * @param {String} varName Name of the variable for which type is being read
 * @param {integer} scope Scope of the variable for which type is being read
 * @return {String} Variable type
 */
function getType(varName, scope) {
	staticCode.sort(sortStaticCode);
	for (var i = 0; i < staticCode.length; i++) {
		if (staticCode[i].varname == varName && scope.indexOf(staticCode[i].scope) == 0) {
			return staticCode[i].vartype;
		}
	}
}

/**
 * Handles generation of 6502a machine code for variable declarations. Pushes
 * the code to code list.
 *
 * @param {Node} node The given node in the AST
 */
function generateVarDecl(node) {
	var name = node.children[1].contents.name;
	var type = node.children[0].contents.name;
	var tempNum = staticCode.length + 1;
	
	staticCode.push({
		temp: "T{0} XX".format(tempNum),
		varname: name,
		scope: getScope(currentEnvNode),
		vartype: type,
		address: 0
	});
	
	if (type == "int" || type == "boolean") {
		insertCode("A9 00 8D T{0} XX".format(n));
	}
}

function generatePrintStatement(node) {
	
}

function generateAssignmentStatement(node) {
	var name = node.children[0].contents.name;
	var value = node.children[1].contents.name;
	
	// Right side is not an expression
	if (value.indexOf("Expr") == -1) {
		if (value == "false") {
			value = "0";
		} else if (value == "true") {
			value = "1";
		}
		
		// Value is not a string (does not open with double quotes)
		if (value.substr(0, 1) != '"') {
			// Value is a digit
			if ("1234567890".indexOf(value) != -1) {
				value = toByte(value);
				insertCode("A9 {0} 8D {1}".format(value, getTempCode(name, getScope(currentEnvNode))));
			// Value is an ID
			} else {
				insertCode("AD {0} 8D {1}".format(getTempCode(value, getScope(currentEnvNode)), getTempCode(name, getScope(currentEnvNode))));
			}
		// Value is a string
		} else {
			writeStringToHeap(value.substr(1, value.length - 2));
			insertCode("AD {0} 8D {1}".format(toByte(heapPointer + 1), getTempCode(name, getScope(currentEnvNode))));
		}
	// Right side is an expression; call and store to memory
	} else {
		node = node.children[1];
		window["generate" + node.contents.name](node);
		insertCode("8D " + getTempCode(name, getScope(currentEnvNode)));
	}
}

function generateWhileStatement(node) {
	
}

function generateIfStatement(node) {
	
}

function generateIntExpr(node) {
	
}

function generateBooleanExpr(node) {
	
}

function backpatch() {
	
}

/**
 * Fills the unused section of the runtime environment with zeroes.
 * This unused section is between the stack (top) and heap (bottom).
 */
function fillUnusedWithZeroes() {
	for (var i = stackPointer; i <= heapPointer; i++) {
		runtimeEnviron[i] = "00";
	}
}

/**
 * Formats the runtime environment for output to screen. Single space
 * between generated code, newline every 8 generated codes.
 *
 * @return {String} Preformatted output text.
 */
function getRuntimeEnvironment() {
	var output = "<pre>";
	for (var i = 0; i < runtimeEnviron.length; i++) {
		if (i % 8 == 0) {
			output += "\n";
		}
		output += runtimeEnviron[i] + " ";
	}
	return "</pre>" + output;
}