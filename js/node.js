/**
 * Creates an instance of Node for building the CST and AST.
 *
 * @constructor
 * @this {Node}
 */
function Node() {
	this.parent = null;
	this.children = [];
	this.contents = null;
}