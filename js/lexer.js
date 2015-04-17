/**
 * Representation of lexemes/tokens as an object.
 */
var tokens = {

	T_LBrace: "T_LBrace",   // {
	T_RBrace: "T_RBrace",   // }
	T_LParen: "T_LParen",   // (
	T_RParen: "T_RParen",   // )
	T_Assign: "T_Assign",   // =
	T_Boolop: "T_Boolop",   // ==, !=
	T_EOF: "T_EOF",         // $
	T_Intop: "T_Intop",     // +
	T_Quote: "T_Quote",     // "
	T_Boolval: "T_Boolval", // true, false
	T_Print: "T_Print",     // print
	T_While: "T_While",     // while
	T_If: "T_If",           // if
	T_Type: "T_Type",       // int, string, boolean
	T_Id: "T_Id",           // [a-Z]
	T_Digit: "T_Digit",     // [0-9]
	T_Space: "T_Space",     // \s (whitespace metacharacter)
	T_Char: "T_Char",       // a-Z
	T_String: "T_String"    // string aka charlist

};

var textBuffer = new TextBuffer();

/**
 * Text buffer to store potential lexemes/tokens.
 * 
 * @this {TextBuffer}
 */
function TextBuffer() {
	this.buffer = "";
	this.add = function(b) { this.buffer += b; };
	this.get = function() { return this.buffer; };
	this.clear = function() { this.buffer = ""; };
}

/**
 * Handles lexing operations: parses source code and generates token list.
 * Attempts token creation after reaching whitespace or newline (or more?)
 *
 * @return {boolean} True of lexing process was successful, false otherwise
 */
function lexer() {
	var index;
	var lineNumber = 1;
	var linePosition = 1;
	var inString = false; //check if we are in string
	var tokenized = false; //check if we have already created a token
	var charListify = false; // check if we need to fill a CharList
	var charList = ""; // stores CharList value
	textBuffer.clear();
	for (index = 0; index < source.length; index++) {
		var currentChar = source[index];
		
		// Handle reaching end of file (with or without EOF symbol ($))
		if ((currentChar != '$') && !inString && (index == source.length - 1)) {
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
			if (inString) {
				makeToken(tokens.T_Space, lineNumber, linePosition, currentChar);
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Space, currentChar));
				tokenized = true;
			} else if (!idToken(lineNumber, linePosition, textBuffer.get())) {
				printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
				return;
			}
			textBuffer.clear();
		}
		
		// Matching newline
		if (currentChar.match(/\n|\r\n/)) {
			if (inString) {
				printOutput("Lex Error: Invalid newline detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
				return;
			} else if (!idToken(lineNumber, linePosition, textBuffer.get())) {
				printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
				return;
			}
			lineNumber++;
			linePosition = 1; // Increment line number and reset line position on newline
			textBuffer.clear();
		}
		
		// Matching open/closing curly brace, parentheses, EOF and intop
		if (currentChar.match(/\{|\}|\(|\)|\$|\+/)) {
			if (inString) {
				printOutput("Lex Error: Invalid character detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
				return;
			} else {
				if (!idToken(lineNumber, linePosition, textBuffer.get())) {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length))
					return;
				}
				idToken(lineNumber, linePosition, currentChar);
				tokenized = true;
			}
			textBuffer.clear();
		}
		
		// Matching assignment or boolops
		if (currentChar.match(/\!|\=/)) {
			var lookAhead = source[index+1];
			if (inString) {
				printOutput("Lex Error: Invalid character detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
				return;
			} else {
				if (!idToken(lineNumber, linePosition, textBuffer.get())) {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				}
				
				// Matching boolop "==" or "!="
				if (lookAhead === '=') {
					idToken(lineNumber, linePosition, currentChar + '=');
					index++;
					tokenized = true;
				} else if (currentChar === '!') {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				} else {
					idToken(lineNumber, linePosition, currentChar);
					tokenized = true;
				}
				textBuffer.clear();
			}
		}
		
		// Matching double quotes, handle string start or end
		if (currentChar.match(/"/)) {
			if (!inString) {
				if (!idToken(lineNumber, linePosition, textBuffer.get())) {
					printOutput("Lex Error: Invalid token '{0}' at line {1} character {2}.".format(textBuffer.get(), lineNumber, linePosition - textBuffer.get().length));
					return;
				}
			}
			inString = !inString;
			idToken(lineNumber, linePosition, currentChar);
			tokenized = true;
			textBuffer.clear();
		}
		
		// Matching in string, uppercase alphabetic character or digit (not allowed!)
		if (currentChar.match(/[0-9A-Z]/) && inString && !tokenized) {
			printOutput("Lex Error: Invalid uppercase alphanumeric character detected in string at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length));
			return;
		}
		
		// Matching in string, lowercase alphabetic character
		if (currentChar.match(/[a-z]/) && inString && !tokenized) {
			var nextChar = source[index+1];
			var prevChar = source[index-1];
			
			// Tokenize single char value
			makeToken(tokens.T_Char, lineNumber, linePosition, currentChar);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Char, currentChar));
			tokenized = true;
			
			// Tokenize entire string (CharList) value
			if (prevChar.match(/"/) && charListify == false) {
				charListify = true;
				charList += currentChar;
			} else if (nextChar.match(/"/) && charListify == true) {
				charListify = false;
				charList += currentChar;
				makeToken(tokens.T_String, lineNumber, linePosition, charList);
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_String, charList));
				charList = "";
			} else {
				charList += currentChar;
			}
		}
		
		// Input after end of file ignored
		if ((currentChar.match(/\$/)) && (index < source.length - 1)) {
			printOutput("Warning: Input found after EOF ignored.");
			return true;
		}
		
		// If no token is recognized and none has been created, advance buffer
		if (!tokenized) {
			textBuffer.add(currentChar);
			linePosition++;
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
	indiv = value.split(""); //Split into single characters for if no keywords match
	if (value.length === 0) {
		return true;
	}
	
	// Space, newline or other line-ending character delimited
	switch (value) {
		case 'print':
			makeToken(tokens.T_Print, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Print, value));
			return true;
		case 'while':
			makeToken(tokens.T_While, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_While, value));
			return true;
		case 'if':
			makeToken(tokens.T_If, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_If, value));
			return true;
		case 'int':
		case 'string':
		case 'boolean':
			makeToken(tokens.T_Type, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Type, value));
			return true;
		case 'false':
		case 'true':
			makeToken(tokens.T_Boolval, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Boolval, value));
			return true;
		case '{':
			makeToken(tokens.T_LBrace, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_LBrace, value));
			return true;
		case '}':
			makeToken(tokens.T_RBrace, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_RBrace, value));
			return true;
		case '(':
			makeToken(tokens.T_LParen, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_LParen, value));
			return true;
		case ')':
			makeToken(tokens.T_RParen, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_RParen, value));
			return true;
		case '=':
			makeToken(tokens.T_Assign, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Assign, value));
			return true;
		case '==':
		case '!=':
			makeToken(tokens.T_Boolop, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Boolop, value));
			return true;
		case '$':
			makeToken(tokens.T_EOF, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_EOF, value));
			return true;
		case '+':
			makeToken(tokens.T_Intop, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Intop, value));
			return true;
		case '"':
			makeToken(tokens.T_Quote, lineNumber, linePosition, value);
			printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Quote, value));
			return true;
		default:
			break;
	}
	
	// No spaces, newlines or other line-ending characters
	if (indiv.length > 0) {
		for (var i = 0; i < indiv.length; i++) {
			if (value.substr(i, 7) === "boolean") {
				makeToken(tokens.T_Type, lineNumber, linePosition, value.substr(i, 7));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Type, value.substr(i, 7)));
				i += 6;
			} else if (value.substr(i, 6) === "string") {
				makeToken(tokens.T_Type, lineNumber, linePosition, value.substr(i, 6));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Type, value.substr(i, 6)));
				i += 5;
			} else if (value.substr(i, 3) === "int") {
				makeToken(tokens.T_Type, lineNumber, linePosition, value.substr(i, 3));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Type, value.substr(i, 3)));
				i += 2;
			} else if (value.substr(i, 2) === "if") {
				makeToken(tokens.T_If, lineNumber, linePosition, value.substr(i, 2));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_If, value.substr(i, 2)));
				i++;
			} else if (value.substr(i, 5) === "print") {
				makeToken(tokens.T_Print, lineNumber, linePosition, value.substr(i, 5));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Print, value.substr(i, 5)));
				i += 4;
			} else if (value.substr(i, 5) === "while") {
				makeToken(tokens.T_While, lineNumber, linePosition, value.substr(i, 5));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_While, value.substr(i, 5)));
				i += 4;
			} else if (value.substr(i, 4) === "true") {
				makeToken(tokens.T_Boolval, lineNumber, linePosition, value.substr(i, 4));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Boolval, value.substr(i, 4)));
				i += 3;
			} else if (value.substr(i, 5) === "false") {
				makeToken(tokens.T_Boolval, lineNumber, linePosition, value.substr(i, 5));
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Boolval, value.substr(i, 5)));
				i += 4;
			} else if (indiv[i].match(/[a-z]/)) {
				makeToken(tokens.T_Id, lineNumber, linePosition, indiv[i]);
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Id, indiv[i]));
			} else if (indiv[i].match(/[0-9]/)) {
				makeToken(tokens.T_Digit, lineNumber, linePosition, indiv[i]);
				printVerbose("Identified token: {0} from '{1}'".format(tokens.T_Digit, indiv[i]));
			} else {
				printOutput("Lex Error: Invalid character detected at line {0} character {1}.".format(lineNumber, linePosition - textBuffer.get().length + i));
				return;
			}
		}
		return true;
	}
	
	return false;
}

/**
 * Helper function designed to create and push a token object to the token list.
 *
 * @param {token} type The token type, as defined by the token variable.
 * @param {number} lineNumber Line number of the token specified.
 * @param {number} linePosition Line position of the token specified.
 * @param {*} value Value of the token.
 */
function makeToken(type, lineNumber, linePosition, value) {
	var token = new Token(type, lineNumber, linePosition, value);
	tokenlist.push(token);
}