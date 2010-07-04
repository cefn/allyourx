$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["OperationCaret on Empty Root Thingy signals Element ThingyAddition needed", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("../schema/yourx/examples.001/team.001.rng");
			UNITTEST.rule = UNITTEST.grammar; //first rule matches document node (top level element)
			UNITTEST.root = new YOURX.RootThingy(); //root thingy matches root node (empty container)
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.rule,UNITTEST.root);
			var op=UNITTEST.caret.nextInvoluntaryOperation();
			return 	op instanceof YOURX.ThingyAddition &&
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
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.rule,UNITTEST.thingy); //create new caret
			var op=UNITTEST.caret.nextInvoluntaryOperation();
			return 	op instanceof YOURX.ThingyAddition &&
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
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../schema/yourx/examples.001/team.001.xml");
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy);
			var involuntary = UNITTEST.caret.getInvoluntaryOperation();
			return involuntary === null;				
	    }],
		["OperationCaret Involuntary List Returns Att Ops for missing Att", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../schema/yourx/examples.001/team.001a.xml");
			//choose element as parent for caret test
			UNITTEST.thingy = UNITTEST.thingy.getChildren()[0];
			//choose matching rule as rule for caret test
			UNITTEST.rule = UNITTEST.grammar.getChildren()[0];
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy, UNITTEST.rule);
			var involuntary = UNITTEST.caret.getInvoluntaryOperation();
			return false;
	    }],
	    */
	]);
});

