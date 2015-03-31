var verbose = false;
var source;
var tokenlist;
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
	editor.getSession().setMode("ace/mode/c_cpp");
	
	$("#compile").on("click", function(){
		source = editor.getValue();
		tokenlist = [];
		clearOutput();
		printOutput("Beginning compilation process.");
		printOutput("Lexing...");
		
		if (lexer()) {
			printOutput("Lex successful!");
			printOutput("Parsing...");
			if (parser()) {
				printOutput("Parse successful!");
			} else {
				printOutput("Parse unsuccessful.");
				printCSTOutput("Parse Error: See main output window.");
			}
		} else {
			printOutput("Lex unsuccessful.");
			printCSTOutput("Lex Error: See main output window.");
		}
	});
	
	$("#verbose").on("click", function(){
		if (!verbose) {
			$("#verbose").text("Verbose On");
			verbose = true;
		} else {
			$("#verbose").text("Verbose Off");
			verbose = false;
		}
	});
}

/**
 * Clears text output from all screens.
 */
function clearOutput() {
	$("#output").text("");
	$("#cst").text("");
	$("#ast").text("");
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
 * Prints formatted CST to CST div box.
 *
 * @param {string} c Formatted CST.
 */
function printCSTOutput(c) {
	$("#cst").append(c + "<br />\n");
}

/**
 * Prints formatted AST to AST div box.
 *
 * @param {string} a Formatted AST.
 */
function printASTOutput(a) {
	$("#ast").append(a + "<br />\n");
}

/**
 * Prints verbose text output to output screen.
 *
 * @param {string} v Verbose text output.
 */
function printVerbose(v) {
	if (verbose)
		$("#output").append(v + "<br />\n");
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