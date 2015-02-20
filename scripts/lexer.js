var index;
var lineNumber;
var charPosition;
var currentToken;
var inString;
var currentChar;
var tokenized;

function lexer() {
	index = 0;
	lineNumber = 1;
	linePosition = 0;
	currentToken = "";
	inString = false;				//check if we are in string
	currentChar = nextChar();		//get next character
	while (currentChar != "") {		//match method compares string with regex
		if currentChar.match(/\$/))
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

function nextChar() {
	var next = source.charAt(index++);
	if (next.match(/\n/)) {
		lineNumber++;
		linePosition = 0;
	} else {
		linePosition++;
	}
	return next;
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
			tokens.push({tokens.T_Num, lineNumber, linePosition, value});
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