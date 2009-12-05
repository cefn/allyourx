$(function() {
	var UNITTEST = {}; //create namespace object for temporary unittest properties
	executeTests([
		["Create Simple Thingy", function(){
			UNITTEST.simplethingy = new YOURX.ElementThingy("data");
			//YOURX.ThingyUtil.log(uneval(UNITTEST.simplethingy));
			return true;
		}],
		["Create Simple ThingyRule", function(){
			UNITTEST.simplethingyrule = new YOURX.ElementThingyRule('data');
			return true;
		}],
		["Parse Simple ThingyRule",function(){
			UNITTEST.simplerngxml = 
				<grammar xmlns="http://relaxng.org/ns/structure/1.0" xmlns:a="http://relaxng.org/ns/compatibility/annotations/1.0" datatypeLibrary="http://www.w3.org/2001/XMLSchema-datatypes">
					<start>
            			<element name="data"/>
					</start>
				</grammar>;
			var parsed = YOURX.ThingyUtil.parseThingyRule(simplerngxml.toXMLString());
			return uneval(parsed) == uneval(UNITTEST.simplethingyrule);
		}],
		["Serialize Simple ThingyRule", function(){
			var serialized = YOURX.ThingyUtil.serializeThingyRule(UNITTEST.simplethingyrule);
			return serialised == UNITTEST.simplerngxml;
		}],
		["Create Complex ThingyRule", function(){
			UNITTEST.complexthingyrule = new YOURX.ElementThingyRule("data",[
				new ZeroOrMoreThingyRule([
					new ElementThingyRule("item",[
							new AttributeThingyRule("title"),
							new AttributeThingyRule("description")						
					])
				])
			]);
			return true;
		}]
	]);
});            

