var index;
var lineNumber;
var charPosition;
var currentToken;
var inString;
var currentChar;
var tokenized;
var token = {

	T_LBrace: "T_LBrace",   // {
	T_RBrace: "T_RBrace",   // }
	T_LParen: "T_LParen",   // (
	T_RParen: "T_RParen",   // )
	T_Assign: "T_Assign";   // =
	T_Boolop: "T_Boolop";   // ==, !=
	T_EOF: "T_EOF";         // $
	T_Plus: "T_Plus";       // +
	T_Quote: "T_Quote";     // "
	T_Boolval: "T_Boolval"; // true, false
	T_Keyword: "T_Keyword"; // print, while, if
	T_Type: "T_Type";       // int, string, boolean
	T_ID: "T_ID";           // [a-Z]
	T_Number: "T_Number";      // [0-9]
	T_Space: "T_Space";     // \s (whitespace metacharacter)

};

/**
 * Handles lexing operations.
 */
function lexer() {
	index = 0;
	lineNumber = 1;
	linePosition = 0;
	currentToken = "";
	inString = false; //check if we are in string
	for (var i = 0; i < source.length; i++) {
		currentChar = source[i];
		
		// Input after end of file ignored
		if ((currentChar.match(/\$/)) && (i < source.length - 1)) {
			printOutput("Warning: Input found after EOF ignored<br />");
			return;
		}
		
		// Handle reaching end of file (with or without EOF symbol ($))
		if ((currentChar != '$') && (i == source.length-1) && !inString) {
			
		}
		
		tokenized = false;
	}
}

/**
 * Simple text buffer to store potential tokens for analysis.
 * Nested methods have the following properties:
 * Add: Adds specified content (b) to the text buffer.
 * Get: Gets the entire text buffer and returns it.
 * Clear: CLears the text buffer.
 *
 * @method textBuffer
 */
function textBuffer() {
	var buffer = "";
	function add(b) { buffer += b; }
	function get() { return buffer; }
	function clear() { buffer = ""; }
}

/**
 * Identifies token and upon successful identification, pushes to token list.
 *
 * @param {number} lineNumber The line the current character is on
 * @param {number} linePosition The position the current character is on in the line
 * @param {*} value The value associated with the current token as a lexeme
 * @return {boolean} True if token identification was successful, false otherwise
 */
function idToken(lineNumber, linePosition, value) {
	value = value.trim(); //Remove excess whitespace
	if (value.length === 0) 
		return true;
	
	if (value.length === 1) {
		if (value.match(/[a-z]/)) {
			tokens.push({tokens.T_ID, lineNumber, linePosition, value});
			return true;
		} else if (value.match(/[0-9]/)) {
			tokens.push({tokens.T_Number, lineNumber, linePosition, value});
			return true;
		}
	}
	
	switch (value) {
		case 'int':
		case 'string':
		case 'boolean':
			tokens.push({tokens.T_Type, lineNumber, linePosition, value});
			return true;
		case 'print':
		case 'while':
		case 'if':
			tokens.push({tokens.T_Keyword, lineNumber, linePosition, value});
			return true;
		case 'false':
		case 'true':
			tokens.push({tokens.T_Boolval, lineNumber, linePosition, value});
			return true;
		case '{':
			tokens.push({tokens.T_LBrace, lineNumber, linePosition, value});
			return true;
		case '}':
			tokens.push({tokens.T_RBrace, lineNumber, linePosition, value});
			return true;
		case '(':
			tokens.push({tokens.T_LParen, lineNumber, linePosition, value});
			return true;
		case ')':
			tokens.push({tokens.T_RParen, lineNumber, linePosition, value});
			return true;
		case '=':
			tokens.push({tokens.T_Assign, lineNumber, linePosition, value});
			return true;
		case '==':
		case '!=':
			tokens.push({tokens.T_Boolop, lineNumber, linePosition, value});
			return true;
		case '$':
			tokens.push({tokens.T_EOF, lineNumber, linePosition, value});
			return true;
		case '+':
			tokens.push({tokens.T_Plus, lineNumber, linePosition, value});
			return true;
		case '"':
			tokens.push({tokens.T_Quote, lineNumber, linePosition, value});
			return true;
		default:
			break;
	}
	
	return false;
}