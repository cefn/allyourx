$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["Create editor without grammar and find focus", function(){
			UNITTEST.thingy = new YOURX.RootThingy(); //empty root element
			UNITTEST.editor = new ALLY.CompletionEditor(); //create a raw editor
			UNITTEST.editor.trackThingy(UNITTEST.thingy);
			UNITTEST.boundq = UNITTEST.editor.getBoundSelection(UNITTEST.thingy); //bind the empty thingy
			UNITTEST.viewportq.append(UNITTEST.boundq); //append to the page
			UNITTEST.editor.setFocus(UNITTEST.thingy); //focus on empty root thingy
			UNITTEST.editable = $("*[contenteditable=true]"); //try to identify focused element
			return UNITTEST.editable.size() === 1;
		}],
		["Keydown left angle-bracket where editable creates and focuses element", function(){
			var evt = $.Event('keypress');
			evt.which = '<'.charCodeAt(0); // '<' character
			$("*[contenteditable=true]").trigger(evt);
			return UNITTEST.thingy.getChildren().length === 1 && $(document.activeElement).hasClass("xname"); //add test for focus [document.activeElement]
		}],		
		["Keydown alpha modifies element name", function(){
			var evt = $.Event('keypress');
			evt.which = 'a'.charCodeAt(0);
			$("*[contenteditable=true]").trigger(evt);
			var name = UNITTEST.thingy.getChildren()[0].getName();
			return name ==="a"; 
		}],
		["Keydown space creates and focuses attribute name", function(){
			var evt = $.Event('keypress');
			evt.which = ' '.charCodeAt(0);
			$("*[contenteditable=true]").trigger(evt);
			var atts = UNITTEST.thingy.getChildren()[0].getAttributes();
			return "" in atts && atts[""] instanceof YOURX.AttributeThingy; 
		}],
		["Keydown alpha modifies attribute value", function(){
			var evt = $.Event('keypress');
			evt.which = 'b'.charCodeAt(0);
			$("*[contenteditable=true]").trigger(evt);
			var atts = UNITTEST.thingy.getChildren()[0].getAttributes();
			return "" in atts && atts[""].name === "b"; //TODO have to have elements tracking attribute names so attribute maps are up to date 
		}],
		["Keydown equals moves focus to attribute value", function(){
			var evt = $.Event('keypress');
			evt.which = '='.charCodeAt(0);
			$("*[contenteditable=true]").trigger(evt);
			return false;
		}],
		["Keydown quote returns focus to open tag", function(){
			return false;
		}],
		["Keydown right angle-bracket moves focus to available descendants", function(){
			return false;
		}],
		["Keydown right angle-bracket moves focus to parent when descendants exhausted", function(){
			return false;
		}],
		["Keydown backspace on structural character deletes structure", function(){
			return false;
		}],
		["Validating; Editor with grammar creates OperationCaret for focus", function(){
			return false;
		}],
		["Validating; OperationCaret updated following focus change", function(){
			return false;
		}],
		["Validating noninteractive; Keydown angle-bracket autocompletes involuntary operations", function(){
			return false;
		}],
		["Validating interactive; Keydown angle-bracket prompts operations ", function(){
			return false;
		}],
		["Click on element name sets focus", function(){
			return false;
		}],
		["Click on attribute name sets focus", function(){
			return false;
		}],
		["Click on attribute value sets focus", function(){
			return false;
		}],
		["Click in text sets focus", function(){
			return false;
		}],
		["Click after last attribute in an element sets focus", function(){
			return false;
		}],
		["Click after element open tag in an element sets focus in descendant area", function(){
			return false;
		}],
	]);
});

