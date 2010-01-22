$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["OperationCaret Involuntary List Returns Correct Ops on Empty Container", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("../../schema/yourx/examples.001/team.001.rng");
			UNITTEST.rule = UNITTEST.grammar.getChildren()[0]; //first rule matches document node (top level element)
			UNITTEST.thingy = new YOURX.ContainerThingy(); //root thingy matches root node (empty container)
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy);
			var op;
			var involuntary = UNITTEST.caret.getInvoluntaryOperations(UNITTEST.rule);
			return 	involuntary.length === 1 &&
					(op = involuntary[0])  instanceof YOURX.ThingyAddition &&
					op.rule  instanceof YOURX.ElementThingyRule &&
					op.rule.name === "player";				
	    }],
		["OperationCaret Involuntary List Returns No Ops on Valid Element", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../schema/yourx/examples.001/team.001.xml");
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy);
			var involuntary = UNITTEST.caret.getInvoluntaryOperations(UNITTEST.rule);
			return 	involuntary.length === 0;				
	    }],
		["OperationCaret Involuntary List Returns Att Ops for missing Att", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../schema/yourx/examples.001/team.001a.xml");
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy);
			var involuntary = UNITTEST.caret.getInvoluntaryOperations(UNITTEST.rule);
			return 	involuntary.length === 1;				
	    }],
	]);
});

