$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["Create editor and find focus", function(){
			UNITTEST.thingy = new YOURX.RootThingy(); //empty root element
			UNITTEST.editor = new ALLY.CompletionEditor(); //create a raw editor
			UNITTEST.editor.trackThingy(UNITTEST.thingy);
			UNITTEST.boundq = UNITTEST.editor.getBoundSelection(UNITTEST.thingy); //bind the empty thingy
			UNITTEST.viewportq.append(UNITTEST.boundq); //append to the page
			UNITTEST.editor.setFocus(UNITTEST.thingy); //focus on empty root thingy
			UNITTEST.editable = $("*[contenteditable=true]"); //try to identify focused element
			return UNITTEST.editable.size() === 1;
		}],
		/*
		["Send less-than key creates element", function(){
			var evt = $.Event('keydown');
			evt.which = 38; // '<' character
			UNITTTEST.editable.trigger(evt);
			return false;
		}],
		*/
		["Undefined", function(){
			return false;
		}],
		["Undefined", function(){
			return false;
		}],
		["Undefined", function(){
			return false;
		}],
		["Undefined", function(){
			return false;
		}],
	]);
});

