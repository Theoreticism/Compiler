var runtimeEnviron;
var staticData;
var stackPointer;
var heapPointer;
var stackOverflow;
var jumps;
var jumpNum;
var success;

/**
 * Base codegen function. Initializes runtime environment, stack pointer, and
 * heap pointer. Handles backpatching and filling unused space with zeroes.
 *
 * @return {boolean} True if codegen was successful, false otherwise
 */
function codegen() {
	runtimeEnviron = [];
	staticData = [{
		temp: "T1 XX",
		varname: "temp",
		scope: 0,
		vartype: "int",
		address: 0
	}];
	jumps = {};
	jumpNum = 0;
	stackPointer = 0;
	heapPointer = 255;
	stackOverflow = false;
	currentEnvNode = environ;
	// AST -> Program -> Block start
	success = beginCodeGen(ast.children[0].children[0]);
	if (!success) {
		return false;
	}
	backpatch();
	fillUnusedWithZeroes();
	printOutput("<br />" + getRuntimeEnvironment());
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
		printVerbose("Generating code for " + ast.contents.name + ".");
		window["generate" + ast.contents.name](ast);
		if (stackOverflow) {
			printOutput("Codegen Error: Stack overflow!");
			return false;
		}
	}
	
	// Block start, move scope pointer down to first child
	if (ast.contents.name == "Block") {
		currentEnvNode = currentEnvNode.children[0];
	}
	
	// Recurse on non-statement children
	if (ast.contents.name.indexOf("Statement") == -1) {
		for (var i = 0; i < ast.children.length; i++) {
			if (!stackOverflow) {
				beginCodeGen(ast.children[i]);
			} else {
				return false;
			}
		}
	}
	
	// Block end, move scope pointer up to parent
	if (ast.contents.name == "Block") {
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
		runtimeEnviron[heapPointer] = toBytes(str.charCodeAt(i));
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
		hexVal = "0" + hexVal;
	}
	return hexVal;
}

/**
 * Sorts static data by decreasing scope length. This enables iteration over 
 * the static data to get the first partial match to get the correct scope.
 *
 * This function is being used in the getTempCode() and getVarType() functions'
 * sort calls as a parameter: the compare function that defines sort order.
 *
 * @param {list} a List representing the first static data
 * @param {list} b List representing the second static data
 * @return {integer} Decreased scope length
 */
function sortStaticData(a, b) {
	return b.scope.length - a.scope.length;
}

/**
 * Helper function to get the 6502a machine code representing temporary variable
 * storage from the static data.
 *
 * @param {String} varName Name of the variable for which temp code is being acquired
 * @param {integer} scope Scope of the variable for which temp code is being acquired
 * @return {String} Temp code for the code
 */
function getTempCode(varName, scope) {
	staticData.sort(sortStaticData);
	for (var i = 0; i < staticData.length; i++) {
		if (staticData[i].varname == varName && scope.indexOf(staticData[i].scope) == 0) {
			return staticData[i].temp;
		}
	}
}

/**
 * Helper function to get the variable type for a variable from static data.
 *
 * @param {String} varName Name of the variable for which type is being read
 * @param {integer} scope Scope of the variable for which type is being read
 * @return {String} Variable type
 */
function getVarType(varName, scope) {
	staticData.sort(sortStaticData);
	for (var i = 0; i < staticData.length; i++) {
		if (staticData[i].varname == varName && scope.indexOf(staticData[i].scope) == 0) {
			return staticData[i].vartype;
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
	var tempNum = staticData.length + 1;
	
	staticData.push({
		temp: "T{0} XX".format(tempNum),
		varname: name,
		scope: getScope(currentEnvNode),
		vartype: type,
		address: 0
	});
	
	if (type == "int" || type == "boolean") {
		insertCode("A9 00 8D T{0} XX".format(tempNum));
	}
}

/**
 * Handles generation of 6502a machine code for print statements. This includes
 * all numbers, digits, expressions and statements.
 *
 * @param {Node} node The given node in the AST
 */
function generatePrintStatement(node) {
	var output = node.children[0].contents.name;
	
	// Print number
	if ("1234567890".indexOf(output) != -1) {
		insertCode("A0 " + toBytes(output));
		insertCode("A2 01 FF");
	} else if (output == "true") {
		writeStringToHeap("true");
		// Load accumulator into y register, then syscall
		insertCode("A0 " + toBytes(heapPointer + 1));
		insertCode("A2 02 FF");
	} else if (output == "false") {
		writeStringToHeap("false");
		// Load accumulator into y register, then syscall
		insertCode("A0 " + toBytes(heapPointer + 1));
		insertCode("A2 02 FF");
	// Print string
	} else if (output.substr(0, 1) == '"') {
		writeStringToHeap(output.substr(1, output.length - 2));
		// Load accumulator into y register, then syscall
		insertCode("A0 " + toBytes(heapPointer + 1));
		insertCode("A2 02 FF");
	// Print ID
	} else if (output.indexOf("Expr") == -1) {
		switch (getVarType(output, getScope(currentEnvNode))) {
			case "boolean":
				// Load 1 into x register, test var, jump over true part if var = 0
				insertCode("A2 01");
				insertCode("EC " + getTempCode(output, getScope(currentEnvNode)));
				insertCode("D0 0C");
				
				// TRUE PART
				writeStringToHeap("true");
				// Load accumulator into y register, then syscall
				insertCode("A0 " + toBytes(heapPointer + 1));
				insertCode("A2 02 FF");
				// Load 0 into x register, test var, jump over false part if var = 1
				insertCode("A2 00");
				insertCode("EC " + getTempCode(output, getScope(currentEnvNode)));
				insertCode("D0 05");
				
				// FALSE PART
				writeStringToHeap("false");
				// Load accumulator into y register, then syscall
				insertCode("A0 " + toBytes(heapPointer + 1));
				insertCode("A2 02 FF");
				break;
			case "int":
				// Load y register from memory, then syscall
				insertCode("AC " + getTempCode(output, getScope(currentEnvNode)));
				insertCode("A2 01 FF");
				break;
			case "string":
				// Load y register from memory, then syscall
				insertCode("AC " + getTempCode(output, getScope(currentEnvNode)));
				insertCode("A2 02 FF");
				break;
		}
	// Print Expr
	} else {
		node = node.children[0];
		window["generate" + node.contents.name](node);
		if (node.contents.name == "BooleanExpr") {
			insertCode("D0 11");
			
			// TRUE PART
			writeStringToHeap("true");
			// Load accumulator into y register, then syscall
			insertCode("A0 " + toBytes(heapPointer + 1));
			insertCode("A2 02 FF");
			// Load 0 into x register
			insertCode("A2 00");
			// Load 1 into temp register
			insertCode("A9 01 8D T1 XX");
			// Test variable
			insertCode("EC T1 XX");
			// Jump over false part if var = 1;
			insertCode("D0 05");
			
			// FALSE PART
			writeStringToHeap("false");
			// Load accumulator into y register, then syscall
			insertCode("A0 " + toBytes(heapPointer + 1));
			insertCode("A2 02 FF");
		} else {
			// Load accumulator into y register, then syscall
			insertCode("AC T1 XX");
			insertCode("A2 01 FF");
		}
	}
}

/**
 * Handles generation of 6502a machine code for assignment statements. Pushes
 * the code to code list.
 *
 * @param {Node} node The given node in the AST
 */
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
				value = toBytes(value);
				insertCode("A9 {0} 8D {1}".format(value, getTempCode(name, getScope(currentEnvNode))));
			// Value is an ID
			} else {
				insertCode("AD {0} 8D {1}".format(getTempCode(value, getScope(currentEnvNode)), getTempCode(name, getScope(currentEnvNode))));
			}
		// Value is a string
		} else {
			writeStringToHeap(value.substr(1, value.length - 2));
			insertCode("A9 {0} 8D {1}".format(toBytes(heapPointer + 1), getTempCode(name, getScope(currentEnvNode))));
		}
	// Right side is an expression; call and store to memory
	} else {
		node = node.children[1];
		window["generate" + node.contents.name](node);
		insertCode("8D " + getTempCode(name, getScope(currentEnvNode)));
	}
}

function generateWhileStatement(node) {
	insertCode("EA");
}

/**
 * Handles generation of 6502a machine code for if statements. Pushes
 * jump code to code list.
 *
 * @param {Node} node The given node in the AST
 */
function generateIfStatement(node) {
	var condition = node.children[0].contents.name;
	
	if (condition == "true") {
		beginCodeGen(node.children[1]);
	} else if (condition == "false") {
		// If false, don't bother generating code; will never be evaluated
	} else {
		// Evaluate boolean expression
		generateBooleanExpr(node.children[0]);
		
		// Generate jump, distance = ?
		var oldStackPointer = stackPointer;
		jumpNum++;
		var jn = jumpNum;
		jumps["J" + jn] = "?";
		insertCode("D0 J" + jn);
		
		beginCodeGen(node.children[1]);
		
		// Backpatch
		jumps["J" + jn] = stackPointer - oldStackPointer - 1;
	}
}

/**
 * Handles generation of 6502a machine code for integer expressions. Pushes
 * code to code list with the postcondition that the accumulator has the 
 * result of the expression.
 *
 * @param {Node} node The given node in the AST
 */
function generateIntExpr(node) {
	printVerbose("Generating code for IntExpr.");
	var digit = node.children[0].contents.name;
	var digit2 = node.children[2].contents.name;
	
	if (node.parent.contents.name.indexOf("Statement") != -1) {
		insertCode("A9 " + toBytes(digit));
	// Nested IntExpr
	} else {
		insertCode("8D T1 XX");
		insertCode("A9 " + toBytes(digit));
		insertCode("6D T1 XX");
	}
	
	if ("1234567890".indexOf(digit2) != -1 || digit2.indexOf("Expr") == -1) {
		insertCode("8D T1 XX");
		
		// Number or ID, load accumulator from memory
		if ("1234567890".indexOf(digit2) != -1) {
			insertCode("A9 " + toBytes(digit2));
		} else {
			insertCode("AD " + getTempCode(digit2, getScope(currentEnvNode)));
		}
		
		insertCode("6D T1 XX");
		insertCode("8D T1 XX");
	} else {
		generateIntExpr(node.children[2]);
	}
}

/**
 * Handles generation of 6502a machine code for boolean expressions. Pushes
 * code to code list with the postcondition that the z register has been set.
 *
 * @param {Node} node The given node in the AST
 */
function generateBooleanExpr(node) {
	printVerbose("Generating code for BooleanExpr.");
	var left = node.children[0].contents.name;
	var operation = node.children[1].contents.name;
	var right = node.children[2].contents.name;
	
	// Evaluate left side into x register
	if ("1234567890".indexOf(left) != -1) {
		insertCode("A2 " + toBytes(left));
	} else if (left == "true") {
		insertCode("A2 01");
	} else if (left == "false") {
		insertCode("A2 00");
	} else if (left.substr(0, 1) == '"') {
		insertCode("AE " + getTempCode(left, getScope(currentEnvNode)));
	} else if (left.indexOf("Expr") == -1) {
		switch (getVarType(left, getScope(currentEnvNode))) {
			case "int":
			case "boolean":
				insertCode("AE " + getTempCode(left, getScope(currentEnvNode)));
				break;
			case "string":
				insertCode("AE " + getTempCode(left, getScope(currentEnvNode)));
				break;
		}
	} else {
		node = node.children[0];
		// Call expression, set accumulator to result
		window["generate" + node.contents.name](node);
		// Store accumulator in temp
		insertCode("8D T1 XX");
		// Store temp in x register
		insertCode("AE T1 XX");
	}
	
	// Evaluate right side into temp register
	if ("1234567890".indexOf(right) != -1) {
		insertCode("A9 " + toBytes(right));
	} else if (right == "true") {
		insertCode("A9 01");
	} else if (right == "false") {
		insertCode("A9 00");
	} else if (right.substr(0, 1) == '"') {
		insertCode("AD " + getTempCode(right, getScope(currentEnvNode)));
	} else if (right.indexOf("Expr" == -1)) {
		switch (getVarType(right, getScope(currentEnvNode))) {
			case "int":
			case "boolean":
				insertCode("AD " + getTempCode(right, getScope(currentEnvNode)));
				break;
			case "string":
				insertCode("AD " + getTempCode(right, getScope(currentEnvNode)));
				break;
		}
	} else {
		node = node.children[2];
		// Call expression, set accumulator to result
		window["generate" + node.contents.name](node);
	}
	
	// Store accumulator in temp
	insertCode("8D T1 XX");
	// Complete comparison
	insertCode("EC T1 XX");
}

function generateBlock(node) {
	
}

/**
 * Handles backpatching of static and jump data from temporary values 
 * to actual register and value allocated.
 */
function backpatch() {
	printOutput("<br />Backpatching...");
	insertCode("00");
	
	// Static data
	for (var i = 1; i <= staticData.length; i++) {
		var hexVal = parseInt(stackPointer).toString(16).toUpperCase();
		while (hexVal.length < 4) {
			hexVal = "0" + hexVal;
		}
		
		printOutput("T{0} XX -> {1}".format(i, hexVal));
		
		for (var j = 0; j < runtimeEnviron.length; j++) {
			if (runtimeEnviron[j] == "T" + i) {
				var byte1 = hexVal.substr(2, 2);
				var byte2 = hexVal.substr(0, 2);
				runtimeEnviron[j] = byte1;
				runtimeEnviron[j+1] = byte2;
			}
		}
		insertCode("00");
	}
	
	// Jumps
	for (var i = 1; i <= jumpNum; i++) {
		var hexVal = jumps["J" + i].toString(16).toUpperCase();
		while (hexVal.length < 2) {
			hexVal = "0" + hexVal;
		}
		
		printOutput("J{0} -> {1}".format(i, hexVal));
		
		for (var j = 0; j < runtimeEnviron.length; j++) {
			if (runtimeEnviron[j] == "J" + i) {
				runtimeEnviron[j] = hexVal;
			}
		}
	}
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