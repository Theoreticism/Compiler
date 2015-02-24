/**
 * Text buffer closure object to store potential lexemes/tokens
 * Was unable to make this work with just nested functions (probably impossible)
 */
var textBuffer = (function() {
	var buffer = "";
	return {
		"add": function(b) { buffer += b; },
		"get": function() { return buffer; },
		"clear": function() { buffer = ""; }
	}
})();

/**
 * Representation of lexemes/tokens as an object
 */
var token = {

	T_LBrace: "T_LBrace",   // {
	T_RBrace: "T_RBrace",   // }
	T_LParen: "T_LParen",   // (
	T_RParen: "T_RParen",   // )
	T_Assign: "T_Assign",   // =
	T_Boolop: "T_Boolop",   // ==, !=
	T_EOF: "T_EOF",         // $
	T_Plus: "T_Plus",       // +
	T_Quote: "T_Quote",     // "
	T_Boolval: "T_Boolval", // true, false
	T_Keyword: "T_Keyword", // print, while, if
	T_Type: "T_Type",       // int, string, boolean
	T_ID: "T_ID",           // [a-Z]
	T_Number: "T_Number",   // [0-9]
	T_Space: "T_Space",     // \s (whitespace metacharacter)
	T_Char: "T_Char"        // a-Z

};

/**
 * Handles lexing operations: parses source code and generates token list.
 * Attempts token creation after reaching whitespace or newline (or more?)
 */
function lexer() {
	var lineNumber = 1;
	var linePosition = 0;
	var inString = false; //check if we are in string
	var tokenized = false; //check if we have already created a token
	for (var index = 0; index < source.length; index++) {
		var currentChar = source[index];
		
		// Input after end of file ignored
		if ((currentChar.match(/\$/)) && (index < source.length - 1)) {
			printOutput("Warning: Input found after EOF ignored.");
			return;
		}
		
		// Handle reaching end of file (with or without EOF symbol ($))
		if ((currentChar != '$') && (index == source.length - 1) && !inString) {
			linePosition++;
			if (!tokenized) {
				textBuffer.add(currentChar);
				if (!idToken(lineNumber, linePosition, textBuffer.get())) {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				}
			}
			printOutput("Warning: End of file character not found. Appending an EOF character.");
			idToken(lineNumber, linePosition, '$');
			textBuffer.clear();
		}
		
		// Matching whitespace
		if (currentChar.match(/\s/)) {
			linePosition++;
			if (inString) {
				makeToken(tokens.T_Space, lineNumber, linePosition, currentChar);
				tokenized = true;
			} else if (!idToken(lineNumber, linePosition, textBuffer.get())) {
				printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
				return;
			}
			textBuffer.clear();
		}
		
		// Matching newline
		if (currentChar.match(/\n/)) {
			linePosition++;
			if (inString) {
				printOutput("Lex Error: Invalid newline detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
				return;
			} else if (!idToken(lineNumber, linePosition, textBuffer.get())) {
				printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
				return;
			}
			lineNumber++;
			linePosition = 0; // Increment line number and reset line position on newline
			textBuffer.clear();
		}
		
		// Matching open/closing curly brace, parentheses, EOF and plus
		if (currentChar.match(/\{|\}|\(|\)|\$|\+/)) {
			linePosition++;
			if (inString) {
				printOutput("Lex Error: Invalid character detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
				return;
			} else if (!idToken(lineNumber, linePosition, textBuffer.get())) {
				printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));1
				return;
				idToken(lineNumber, linePosition, currentChar);
				tokenized = true;
			}
			textBuffer.clear();
		}
		
		// Matching assignment or boolops
		if (currentChar.match(/\!|\=/)) {
			var lookAhead = source[index+1];
			linePosition++;
			if (inString) {
				printOutput("Lex Error: Invalid character detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
				return;
			} else {
				if (!idToken(lineNumber, linePosition, textBuffer.get())) {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				}
				textBuffer.clear();
				
				// Matching boolop "==" or "!="
				if (lookAhead === '=') {
					idToken(lineNumber, linePosition, currentChar + '=');
					index++;
					tokenized = true;
					linePosition++;
				} else if (currentChar === '!') {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				} else {
					idToken(lineNumber, linePosition, currentChar);
					tokenized = true;
				}
			}
		}
		
		// Matching double quotes, handle string start or end
		if (currentChar.match(/"/)) {
			linePosition++;
			if (!inString) {
				if (!idToken(lineNumber, linePosition, textBuffer.get())) {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				}
				inString = !inString;
				idToken(lineNumber, linePosition, currentChar);
				tokenized = true;
				textBuffer.clear();
			}
		}
		
		// Matching in string, alphabetic character
		if (currentChar.match(/[a-zA-Z]/) && inString && !tokenized) {
			linePosition++;
			makeToken(tokens.T_Char, lineNumber, linePosition, currentChar);
			tokenized = true;
		}
		
		// If no token is recognized and none has been created, advance buffer
		if (!tokenized) {
			linePosition++;
			textBuffer.add(currentChar);
		}
		
		tokenized = false;
	}
	return true;
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
	if (value.length === 0) {
		return true;
	}
	
	if (value.length === 1) {
		if (value.match(/[a-z]/)) {
			makeToken(tokens.T_ID, lineNumber, linePosition, value);
			return true;
		} else if (value.match(/[0-9]/)) {
			makeToken(tokens.T_Number, lineNumber, linePosition, value);
			return true;
		}
	}
	
	switch (value) {
		case 'int':
		case 'string':
		case 'boolean':
			makeToken(tokens.T_Type, lineNumber, linePosition, value);
			return true;
		case 'print':
		case 'while':
		case 'if':
			makeToken(tokens.T_Keyword, lineNumber, linePosition, value);
			return true;
		case 'false':
		case 'true':
			makeToken(tokens.T_Boolval, lineNumber, linePosition, value);
			return true;
		case '{':
			makeToken(tokens.T_LBrace, lineNumber, linePosition, value);
			return true;
		case '}':
			makeToken(tokens.T_RBrace, lineNumber, linePosition, value);
			return true;
		case '(':
			makeToken(tokens.T_LParen, lineNumber, linePosition, value);
			return true;
		case ')':
			makeToken(tokens.T_RParen, lineNumber, linePosition, value);
			return true;
		case '=':
			makeToken(tokens.T_Assign, lineNumber, linePosition, value);
			return true;
		case '==':
		case '!=':
			makeToken(tokens.T_Boolop, lineNumber, linePosition, value);
			return true;
		case '$':
			makeToken(tokens.T_EOF, lineNumber, linePosition, value);
			return true;
		case '+':
			makeToken(tokens.T_Plus, lineNumber, linePosition, value);
			return true;
		case '"':
			makeToken(tokens.T_Quote, lineNumber, linePosition, value);
			return true;
		default:
			break;
	}
	
	return false;
}

/**
 * Helper function designed to create and push a meaningful token object to the token list.
 *
 * @param {token} type The token type, as defined by the token variable.
 * @param {number} lineNumber Line number of the token specified.
 * @param {number} linePosition Line position of the token specified.
 * @param {*} value Value of the token.
 */
function makeToken(type, lineNumber, linePosition, value) {
	tokens.push({
		"type": type,
		"lineNumber": lineNumber,
		"linePosition": linePosition,
		"value": value
	});
}