$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["OperationCaret on Empty Root Thingy signals Element ThingyAddition needed", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("schema/yourx/examples.001/team.001.rng");
			UNITTEST.rule = UNITTEST.grammar; //first rule matches document node (top level element)
			UNITTEST.root = new YOURX.RootThingy(); //root thingy matches root node (empty container)
			UNITTEST.caret = new AXLE.OperationCaret(UNITTEST.rule,UNITTEST.root);
			var op=UNITTEST.caret.nextInvoluntaryOperation();
			return 	op instanceof AXLE.ThingyAddition &&
					op.rule instanceof YOURX.ElementThingyRule &&
					op.rule.name === "player"
	    }],
		["Correct assignment of operations to attributes and children", function(){
			return 	UNITTEST.caret.involuntaryAttributeKeys().length === 0 &&
					UNITTEST.caret.involuntaryChildKeys().length === 1;	
		}],
		["Shallow Fix (ElementThingy addition) reports success", function(){
			return UNITTEST.caret.shallowFix();
		}],
		["Executing shallowFix creates correct top level element", function(){
			var children, child;
			return 	(children = UNITTEST.root.getChildren()).length === 1 &&
					(child = children[0]) instanceof YOURX.ElementThingy &&
					child.name === "player";
		}],
		["OperationCaret signals no further operations at this level", function(){
			return UNITTEST.caret.involuntaryKeys().length === 0;
		}],
		["OperationCaret at next level signals Attribute ThingyAdditions needed", function(){
			UNITTEST.rule = UNITTEST.rule.getChildren()[0]; //descend rule tree
			UNITTEST.thingy = UNITTEST.root.getChildren()[0]; //descend thingy tree 
			UNITTEST.caret = new AXLE.OperationCaret(UNITTEST.rule,UNITTEST.thingy); //create new caret
			var op=UNITTEST.caret.nextInvoluntaryOperation();
			return 	op instanceof AXLE.ThingyAddition &&
					op.rule instanceof YOURX.AttributeThingyRule &&
					op.rule.name === "name"
	    }],
		["Shallow Fix (AttributeThingy additions) reports success", function(){
			return UNITTEST.caret.shallowFix(); //future attribute rules may require input (to satisfy non-empty validation)
		}],
		["Executing shallowFix creates correct attributes", function(){
			var nameattribute,posattribute;
			return 	(nameattribute = UNITTEST.thingy.getAttributeThingy("name")) instanceof YOURX.AttributeThingy &&
					nameattribute.name === "name" &&
					nameattribute.value === "" &&
					(posattribute = UNITTEST.thingy.getAttributeThingy("position")) instanceof YOURX.AttributeThingy &&
					posattribute.name === "position" &&
					posattribute.value === "" ;
		}],
		["Thingy Tree now validates", function(){
			return UNITTEST.grammar.matchThingy(UNITTEST.root) === true;
		}],	
		/*
		["OperationCaret Involuntary List Returns No Ops on Valid Element", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.001.xml");
			UNITTEST.caret = new AXLE.OperationCaret(UNITTEST.thingy);
			var involuntary = UNITTEST.caret.getInvoluntaryOperation();
			return involuntary === null;				
	    }],
		["OperationCaret Involuntary List Returns Att Ops for missing Att", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.001a.xml");
			//choose element as parent for caret test
			UNITTEST.thingy = UNITTEST.thingy.getChildren()[0];
			//choose matching rule as rule for caret test
			UNITTEST.rule = UNITTEST.grammar.getChildren()[0];
			UNITTEST.caret = new AXLE.OperationCaret(UNITTEST.thingy, UNITTEST.rule);
			var involuntary = UNITTEST.caret.getInvoluntaryOperation();
			return false;
	    }],
	    */
		["Create editor without grammar and find focus", function(){
			UNITTEST.thingy = new YOURX.RootThingy(); //empty root element
			UNITTEST.editor = new AXLE.CompletionEditor(); //create a raw editor
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

