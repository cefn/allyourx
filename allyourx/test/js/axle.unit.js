$(function(){
	
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls

    var rootName = "abc";
    var attName = "def";
    var childName = "ghi";
	var textContent = "jkl";
    
	/** N.B. Some debugging scenarios (e.g. Eclipse breakpoints) will cause browser 
	 * window to lose focus, and therefore this will unexpectedly return null
	 */
	function getDomFocus(){
		//a recent and more widely supported alternative to document.activeElement
		return document.querySelector(":focus");
	}
	
	function emulateFocusEvent(evt){
		//$("*[contenteditable=true]").trigger(evt);
		//$("*:focus").trigger(evt); //CH should be focus item for all tests
		$(getDomFocus()).trigger(evt); 
	}
	
	function typeCharacters(characters){
		var idx, evt;
		for(idx = 0; idx < characters.length; idx++){
			evt = $.Event('keypress');
			evt.which = characters.charCodeAt(idx);
			emulateFocusEvent(evt);
		}
	}
	
	function typeControlKey(controlName){
		if("AXLE" in YOURX.getGlobal()){
			for(var keyCode in AXLE.AvixEditor.prototype.navkeys){
				var handler = AXLE.AvixEditor.prototype.navkeys[keyCode];
				if(handler.name === controlName){
					evt = $.Event('keydown');
					evt.keyCode = keyCode;
					emulateFocusEvent(evt);					
					return;
				}
			}
		}
		throw Error("Could not identify matching symbolic name for control key.");
	};
	
    executeTests([
		["OperationCaret on Empty Root Thingy signals Element ThingyAddition needed", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("schema/yourx/examples.001/team.001.rng");
			UNITTEST.rule = UNITTEST.grammar; //first rule matches document node (top level element)
			UNITTEST.root = new YOURX.RootThingy(); //root thingy matches root node (empty container)
			UNITTEST.caret = new AXLE.OperationCaret(UNITTEST.rule,UNITTEST.root);
			var op=UNITTEST.caret.nextInvoluntaryOperation();
			return 	op instanceof AXLE.ThingyAddition &&
					op.rule instanceof YOURX.ElementThingyRule &&
					op.rule.name === "player";
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
					op.rule.name === "name";
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
			UNITTEST.editor = new AXLE.AvixEditor(); //create editor
			UNITTEST.editor.trackThingy(UNITTEST.thingy);
			UNITTEST.boundq = UNITTEST.editor.getBoundSelection(UNITTEST.thingy); //bind the empty thingy
			UNITTEST.viewportq.append(UNITTEST.boundq); //append to the page
			UNITTEST.editor.setCaret(UNITTEST.thingy, 0); //move caret to empty root thingy
			UNITTEST.editable = $("*[contenteditable=true]"); //try to identify focused element
			return UNITTEST.editable.size() === 1;
		}],
		["Keydown left angle-bracket where editable creates and focuses element name", function(){
			typeCharacters('<');	
			return 	UNITTEST.thingy.getChildren().length === 1 && 
					UNITTEST.editor.caret.thingy == UNITTEST.thingy.getChildren()[0] &&
					$(getDomFocus()).hasClass("xname") && 
					$(getDomFocus()).parent().hasClass("xelement");
		}],		
		["Keydown alpha modifies element name", function(){
			typeCharacters(rootName);
			var name = UNITTEST.thingy.getChildren()[0].getName();
			var domtext = $(UNITTEST.editor.editable.selection).text();
			return name ===rootName && domtext == rootName;
		}],
		["Keydown of invalid character not inserted", function(){
			var err;
			try{ typeCharacters('"');} catch(thrown){err=thrown;}
			var name = UNITTEST.thingy.getChildren()[0].getName();
			var domtext = $(UNITTEST.editor.editable.selection).text();
			return name ===rootName && domtext == rootName && 
			err.message === "Invalid character inserted, no matches available.";
		}],
		["Keydown space creates attribute and focuses attribute name", function(){
			typeCharacters(' ');
			var atts = UNITTEST.thingy.getChildren()[0].getAttributes();
			var att;
			return 	"" in atts && 
					(att = atts[""]) instanceof YOURX.AttributeThingy && 
					UNITTEST.editor.caret.thingy == att &&
					UNITTEST.editor.caretInName() && 
					$(getDomFocus()).hasClass("xname") && 
					$(getDomFocus()).parent().hasClass("xattribute");
		}],
		["Keydown alpha modifies attribute name", function(){
			typeCharacters(attName);
			var atts = UNITTEST.thingy.getChildren()[0].getAttributes();
			return attName in atts && atts[attName].name === attName;
		}],
		["Keydown equals moves focus to attribute value", function(){
			typeCharacters('=');
			var atts = UNITTEST.thingy.getChildren()[0].getAttributes();
			var att;
			return 	attName in atts && 
					(att = atts[attName]) && 
					UNITTEST.editor.caret.thingy == att &&
					UNITTEST.editor.caretInContent() && 
					$(getDomFocus()).hasClass("xcontent") && 
					$(getDomFocus()).parent().hasClass("xattribute");
		}],
		["Keydown quote returns focus to element open tag", function(){
			typeCharacters('"');
			return 	UNITTEST.editor.caret.thingy == UNITTEST.thingy.getChildren()[0] &&
					UNITTEST.editor.caretInAttributes() && 
					UNITTEST.editor.caret.key == attName &&
					$(getDomFocus()).hasClass("xopen") && 
					$(getDomFocus()).parent().hasClass("xelement");
		}],
		["Keydown right angle-bracket moves focus to available descendants", function(){
			typeCharacters('>');
			return 	UNITTEST.editor.caret.thingy == UNITTEST.thingy.getChildren()[0] &&
					UNITTEST.editor.caretInDescendants() && 
					UNITTEST.editor.caret.key == 0 &&
					$(getDomFocus()).hasClass("xdescend") && 
					$(getDomFocus()).parent().hasClass("xelement");
		}],
		["Element key sequence creates additional descendant", function(){
			typeCharacters("<" + childName + ">");
			var child,grandchild;
			return 	(child = UNITTEST.thingy.getChildren()[0]).getName() == rootName &&
					(grandchild = child.getChildren()[0]).getName() == childName &&
					UNITTEST.editor.caret.thingy == grandchild &&
					UNITTEST.editor.caretInDescendants() && 
					UNITTEST.editor.caret.key == 0 &&
					$(getDomFocus()).hasClass("xdescend") && 
					$(getDomFocus()).parent().hasClass("xelement");
		}],
		["Text input creates text node", function(){
			typeCharacters(textContent);
			var focusthingy;
			return 	(focusthingy = UNITTEST.editor.caret.thingy) instanceof YOURX.TextThingy &&
					focusthingy.value == textContent && 
					UNITTEST.editor.caretInContent() && 
					UNITTEST.editor.caret.key == textContent.length &&
					$(getDomFocus()).hasClass("xcontent") && 
					$(getDomFocus()).parent().hasClass("xtext");
		}],
		["Typed character followed by Backspace means no change", function(){
			typeCharacters("d");
			typeControlKey("Backspace");
			var focusthingy;
			return 	(focusthingy = UNITTEST.editor.caret.thingy) instanceof YOURX.TextThingy &&
					focusthingy.value === textContent && 
					UNITTEST.editor.caretInContent() && 
					UNITTEST.editor.caret.key === textContent.length &&
					$(getDomFocus()).hasClass("xcontent") && 
					$(getDomFocus()).parent().hasClass("xtext");
		}],
		["Keydown right angle-bracket moves focus beyond close tag to parent", function(){
			typeCharacters(">");
			var child, focusthingy;
			return 	(child = UNITTEST.thingy.getChildren()[0]) instanceof YOURX.ElementThingy &&
					(focusthingy = UNITTEST.editor.caret.thingy)  &&
					(focusthingy == child) &&
					UNITTEST.editor.caretInDescendants() && 
					UNITTEST.editor.caret.key == 1 &&
					$(getDomFocus()).hasClass("xdescend") && 
					$(getDomFocus()).parent().hasClass("xelement");
		}],
		/*
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
		*/
	]);
});

