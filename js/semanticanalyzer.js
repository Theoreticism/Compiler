var currentNode;
var indentLevel;
var success;

function analyzer() {
	var ast = new Node();
	ast.contents = "ast";
	currentNode = ast;
	indentLevel = -1;
	success = true;
	if (success) {
		return true;
	} else
		return false;
}

function printAST(ast) {
	var output = "";
	if (indentLevel >= 0) {
		output += printNode(ast.contents);
	}
	indentLevel++;
	for (var i = 0; i < ast.children.length; i++) {
		output += printAST(ast.children[i]);
	}
	indentLevel--;
	return output;
}

function printNode(n) {
	var t = n.name;
	if (indentLevel > 0) {
		t = "|" + t;
	}
	return t + "\n";
}