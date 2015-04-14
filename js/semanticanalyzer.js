var currentASTNode;
var indentLevel;
var success;

function analyzer() {
	ast = new Node();
	ast.contents = "ast";
	currentASTNode = ast;
	indentLevel = -1;
	success = true;
	if (success) {
		return true;
	} else
		return false;
}

function buildAST() {
	
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

function analyzeNode(node) {
	switch (node.contents.name) {
		case 'Block':
		case 'StatementList':
		case 'IntExpr':
		case 'Id':
	}
}

function newNode(contents) {
	var node = new Node();
	node.contents = [];
	node.contents.name = contents;
	node.parent = currentASTNode;
	currentASTNode.children.push(node);
	currentASTNode = node;
}