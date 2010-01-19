$(function() {
	var UNITTEST = {}; //create namespace object for temporary unittest properties
	executeTests([
		["load schema from examples.001/team.rng", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("../../lib/schema/yourx/examples.001/team.001.rng");
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
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.001.xml");
			var docthingy, docthingyatt0, docthingyatt1;
			return ( (UNITTEST.thingy) instanceof YOURX.ContainerThingy) &&
				   ( (docthingy = UNITTEST.thingy.getChildren()[0]) instanceof YOURX.ElementThingy) &&
				   ( (docthingyatt0=docthingy.getAttributeThingy('name')) instanceof YOURX.AttributeThingy) &&
				   ( (docthingyatt1=docthingy.getAttributeThingy('position')) instanceof YOURX.AttributeThingy) &&
				   ( docthingy.name==='player') &&
				   ( docthingyatt0.name==='name') &&
				   ( docthingyatt1.name==='position') &&
				   ( docthingy.getAttribute('name') === 'Viswanathan Anand') &&
				   ( docthingy.getAttribute('position') === 'Grand Master') &&
				   ( docthingy.getAttributes()['name'].value === 'Viswanathan Anand') &&
				   ( docthingy.getAttributes()['position'].value  === 'Grand Master');
		}],
		["examples.001/team.001.xml accepted by validation", function(){
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === true;			
		}],
		["examples.001/team.001a.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.001a.xml");
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === false;
		}],
		["examples.001/team.001b.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.001b.xml");
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === false;
		}],
		["examples.001/team.001c.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.001c.xml");
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === false;
		}],
		["load schema from examples.001/team.002.rng", function(){
			UNITTEST.grammar = YOURX.ThingyUtil.url2rule("../../lib/schema/yourx/examples.001/team.002.rng");
			var rule, rulechild0, rulechild1;
			return (UNITTEST.grammar) instanceof YOURX.ThingyGrammar && 
				   (rule = UNITTEST.grammar.getChildren()[0]) instanceof YOURX.ElementThingyRule && 
				   (rulechild0 = rule.getChildren()[0]) instanceof YOURX.AttributeThingyRule && 
				   (rulechild1 = rule.getChildren()[1]) instanceof YOURX.AttributeThingyRule && 
				   rule.name == "player" && 
				   rulechild0.name == "name" && 
				   rulechild1.name == "position"; 
		}],
		["load data from examples.001/team.002.xml to in-memory model", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.002.xml");
			var docthingy, docthingyatt0, docthingyatt1;
			return ( (UNITTEST.thingy) instanceof YOURX.ContainerThingy) &&
				   ( (docthingy = UNITTEST.thingy.getChildren()[0]) instanceof YOURX.ElementThingy) &&
				   ( (docthingyatt0=docthingy.getAttributeThingy('name')) instanceof YOURX.AttributeThingy) &&
				   ( (docthingyatt1=docthingy.getAttributeThingy('position')) instanceof YOURX.AttributeThingy) &&
				   ( (docthingychild0 = docthingy.getChildren()[0]) instanceof YOURX.ElementThingy) &&
				   ( docthingy.name==='player') &&
				   ( docthingyatt0.name==='name') &&
				   ( docthingyatt1.name==='position') &&
				   ( docthingychild0.name==='championship') &&
				   ( docthingy.getAttribute('name') === 'Viswanathan Anand') &&
				   ( docthingy.getAttribute('position') === 'Grand Master') &&
				   ( docthingy.getAttributes()['name'].value === 'Viswanathan Anand') &&
				   ( docthingy.getAttributes()['position'].value  === 'Grand Master');			
		}],
		["examples.001/team.002.xml accepted by validation", function(){
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === true;
		}],
		["examples.001/team.002a.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.002a.xml");
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === false;
		}],
		["examples.001/team.002b.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.002b.xml");
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === false;
		}],
		["examples.001/team.002c.xml rejected by validation", function(){
			UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../../lib/schema/yourx/examples.001/team.002c.xml");
			return UNITTEST.thingy.matchRule(UNITTEST.grammar) === false;
		}],
/*		["insert required elements from examples.001/team.002.rng ", function(){
			UNITTEST.thingy = new YOURX.ContainerThingy();
			UNITTEST.grammar.autoPopulate(UNITTEST.thingy);
			return thingy.getChildren()[0].getName() == "player";
		}], 
*/	]);
});            

