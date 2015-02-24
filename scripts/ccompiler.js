//TODO: Verbose?

var source;
var tokens;
var cst;
var ast;
var environ;

/**
 * Initializes the compiler.
 */
function init() {
	//Initialize Ace embedded code editor
	var editor = ace.edit("input");
	editor.setTheme("ace/theme/chrome");
	editor.getSession().setMode("ace/mode/javascript");
	
	$("#compile").on("click", function(){
		source = editor.getValue();
		tokens = [];
		clearOutput();
		//printOutput(source);
		printOutput("Compiling...");
		if (lexer()) {
			printOutput("Lexing successful!");
		} else {
			printOutput("Lexing unsuccessful.");
		}
		printOutput(tokens.length);
	});
}

/**
 * Clears text output from output screen.
 */
function clearOutput() {
	$("#output").text("");
}

/**
 * Prints text output to output screen.
 *
 * @param {string} o Text output.
 */
function printOutput(o) {
	$("#output").append(o + "<br />\n");
}

/**
 * Formats string output in a manner equivalent to C/PHP's printf() function.
 * Code taken from top non-accepted answer at http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format.
 */
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}