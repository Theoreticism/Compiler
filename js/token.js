/**
 * Creates an instance of Token for tokenizing characters.
 *
 * @constructor
 * @this {Token}
 */
function Token(type, lineNumber, linePosition, value) {
	this.type = type;
	this.lineNumber = lineNumber;
	this.linePosition = linePosition;
	this.value = value;	
	this.used = false;
	this.initialized = false;
}