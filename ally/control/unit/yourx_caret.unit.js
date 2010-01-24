$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		/*
		["OperationCaret Involuntary List Returns Correct Ops on Empty Container", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("../../schema/yourx/examples.001/team.001.rng");
			UNITTEST.rule = UNITTEST.grammar.getChildren()[0]; //first rule matches document node (top level element)
			UNITTEST.thingy = new YOURX.ContainerThingy(); //root thingy matches root node (empty container)
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy);
			var involuntary = UNITTEST.caret.getInvoluntaryOperation(UNITTEST.rule);
			return false;				
	    }],
		["OperationCaret Involuntary List Returns No Ops on Valid Element", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../schema/yourx/examples.001/team.001.xml");
			UNITTEST.caret = new YOURX.OperationCaret(UNITTEST.thingy);
			var involuntary = UNITTEST.caret.getInvoluntaryOperation();
			return involuntary === null;				
	    }],
		["OperationCaret Involuntary List Returns Att Ops for missing Att", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../schema/yourx/examples.001/team.001a.xml");
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

