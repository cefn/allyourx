$(function() {
	var UNITTEST = {}; //create namespace object for temporary unittest properties
	executeTests([
		["load schema from examples.001/team.001.rng", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("schema/yourx/examples.001/team.001.rng");
			var rule, rulechild0, rulechild1;
			return (UNITTEST.grammar) instanceof YOURX.ThingyGrammar && 
				   (rule = UNITTEST.grammar.getChildren()[0]) instanceof YOURX.ElementThingyRule && 
				   (rulechild0 = rule.getChildren()[0]) instanceof YOURX.AttributeThingyRule && 
				   (rulechild1 = rule.getChildren()[1]) instanceof YOURX.AttributeThingyRule && 
				   rule.name == "player" && 
				   rulechild0.name == "name" && 
				   rulechild1.name == "position"; 
		}],
		["load data from examples.001/team.001.xml to in-memory model", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.001.xml");
			var docthingy, docthingyatt0, docthingyatt1;
			return ( (UNITTEST.thingy) instanceof YOURX.RootThingy) &&
				   ( (docthingy = UNITTEST.thingy.getChildren()[0]) instanceof YOURX.ElementThingy) &&
				   ( (docthingyatt0=docthingy.getAttributeThingy('name')) instanceof YOURX.AttributeThingy) &&
				   ( (docthingyatt1=docthingy.getAttributeThingy('position')) instanceof YOURX.AttributeThingy) &&
				   ( docthingy.name==='player') &&
				   ( docthingyatt0.name==='name') &&
				   ( docthingyatt1.name==='position') &&
				   ( docthingy.getAttributeValue('name') === 'Viswanathan Anand') &&
				   ( docthingy.getAttributeValue('position') === 'Grand Master') &&
				   ( docthingy.getAttributes()['name'].value === 'Viswanathan Anand') &&
				   ( docthingy.getAttributes()['position'].value  === 'Grand Master');
		}],
		["examples.001/team.001.xml accepted by validation", function(){
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === true;
		}],
		["examples.001/team.001a.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.001a.xml");
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === false;
		}],
		["examples.001/team.001b.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.001b.xml");
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === false;
		}],
		["examples.001/team.001c.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.001c.xml");
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === false;
		}],
		["load schema from examples.001/team.002.rng", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("schema/yourx/examples.001/team.002.rng");
			var rule, rulechild0, rulechild1;
			return  (UNITTEST.grammar) instanceof YOURX.ThingyGrammar &&
				    (rule = UNITTEST.grammar.getChildren()[0]) instanceof YOURX.ElementThingyRule &&
				    (rulechild0 = rule.getChildren()[0]) instanceof YOURX.AttributeThingyRule &&
				    (rulechild1 = rule.getChildren()[1]) instanceof YOURX.AttributeThingyRule &&
                    (rulechild2 = rule.getChildren()[2]) instanceof YOURX.ElementThingyRule &&
                    rule.name == "player" &&
				    rulechild0.name == "name" &&
                    rulechild1.name == "position"
				    rulechild2.name == "championship";
		}],
		["load data from examples.001/team.002.xml to in-memory model", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.002.xml");
			var docthingy, docthingyatt0, docthingyatt1;
			return ( (UNITTEST.thingy) instanceof YOURX.RootThingy) &&
				   ( (docthingy = UNITTEST.thingy.getChildren()[0]) instanceof YOURX.ElementThingy) &&
				   ( (docthingyatt0=docthingy.getAttributeThingy('name')) instanceof YOURX.AttributeThingy) &&
				   ( (docthingyatt1=docthingy.getAttributeThingy('position')) instanceof YOURX.AttributeThingy) &&
				   ( (docthingychild0 = docthingy.getChildren()[0]) instanceof YOURX.ElementThingy) &&
				   ( docthingy.name==='player') &&
				   ( docthingyatt0.name==='name') &&
				   ( docthingyatt1.name==='position') &&
				   ( docthingychild0.name==='championship') &&
				   ( docthingy.getAttributeValue('name') === 'Viswanathan Anand') &&
				   ( docthingy.getAttributeValue('position') === 'Grand Master') &&
				   ( docthingy.getAttributes()['name'].value === 'Viswanathan Anand') &&
				   ( docthingy.getAttributes()['position'].value  === 'Grand Master');			
		}],
		["examples.001/team.002.xml accepted by validation", function(){
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === true;
		}],
		["examples.001/team.002a.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.002a.xml");
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === false;
		}],
		["examples.001/team.002b.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("schema/yourx/examples.001/team.002b.xml");
			return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === false;
		}],
		["Document order traversal visits all items", function(){
	        UNITTEST.rootthingy = YOURX.ThingyUtil.url2thingy("../xq/data/data.xml");
	        UNITTEST.tracker = new YOURX.ThingyTracker();
			UNITTEST.tracker.trackThingy(UNITTEST.rootthingy);
			var thingies = [];
			UNITTEST.tracker.traverseDocumentOrder(UNITTEST.rootthingy, function(thingy){
				thingies.push(thingy);
			});
			return thingies.length === 33;
	    }]
/*		["insert required elements from examples.001/team.002.rng ", function(){
			UNITTEST.thingy = new YOURX.RootThingy();
			UNITTEST.grammar.autoPopulate(UNITTEST.thingy);
			return thingy.getChildren()[0].getName() == "player";
		}],

		 /**
		    For initial script expressivity we need the RelaxNG elements...
		    'choice'
		    'ref' & 'define'
		    'oneOrMore'

		 *

*/	]);
});            

