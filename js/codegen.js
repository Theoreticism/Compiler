var runtimeEnviron;
var stackPointer;
var heapPointer;
var stackOverflow;
var success;

/**
 *
 *
 * @return {boolean}
 */
function codegen() {
	runtimeEnviron = [];
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

function beginCodeGen(ast) {
	// Calls generate function for the ast node specified (non-leaf nodes only)
	if (ast.children.length > 0) {
		printOutput("Generating code for " + node.contents.name);
		window["gen" + node.contents.name](ast);
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

function generateVarDecl(node) {
	var name = node.children[1].contents.name;
	var type = node.children[0].contents.name;
	
}

function generatePrintStatement(node) {
	
}

function generateAssignmentStatement(node) {
	
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