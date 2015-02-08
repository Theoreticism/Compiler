var input;
var tokens;
var cst;
var ast;
var environ;

function init() {
	var editor = ace.edit("input");
	editor.setTheme("ace/theme/chrome");
	editor.getSession().setMode("ace/mode/javascript");
	
	$("#compile").on("click", function(){
		$("#output").text("");
	});
}