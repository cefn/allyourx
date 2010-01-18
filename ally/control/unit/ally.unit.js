$(function() {
	var UNITTEST = {}; //create namespace object for temporary unittest properties
	UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
	executeTests([
		["url2yourx loads XML file  ", function(){
			UNITTEST.rootthingy = YOURX.ThingyUtil.url2thingy("../../data/data.xml");
			return UNITTEST.rootthingy.getChildren().length != 0;
		}],
		["bindThingy adds some text nodes",function(){
			ALLY.bindThingy(UNITTEST.rootthingy,UNITTEST.viewportq);
			var counttext = UNITTEST.viewportq.find(".xtext").size();
			return counttext === 14;
		}],
		["bindThingy: first text node is correct",function(){
			var testtext = UNITTEST.viewportq.find(".xtext .xcontent:first").text();
			return testtext === "Suggested Format";
		}],
		["bindThingy: first attribute node is correct",function(){
			var testtext = UNITTEST.viewportq.find(".xattribute .xcontent:first").text();
			return testtext === "index";
		}],
		["bindThingy: last text node correct",function(){
			var testtext = UNITTEST.viewportq.find(".xtext:last").text();
			return testtext === "We hope these events provide an opportunity for critical exchanges to take place.";
		}],
		["bindThingy: valid heirarchy to first text node",function(){
			var testtext = UNITTEST.viewportq.find(".xelement .xelement .xelement .xtext:first").text();
			return testtext === "Suggested Format";
		}],
	]);
});            

