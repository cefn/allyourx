$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["url2yourx loads XML file without corresponding schema ", function(){
	        UNITTEST.rootthingy = YOURX.ThingyUtil.url2thingy("../../data/data.xml");
	        return UNITTEST.rootthingy.getChildren().length != 0;
	    }],
		["bindThingy adds some text nodes", function(){
	        UNITTEST.editor = new ALLY.RawEditor();
	        UNITTEST.boundq = UNITTEST.editor.createThingyWrapper(UNITTEST.rootthingy);
	        UNITTEST.viewportq.append(UNITTEST.boundq);
	        var counttext = UNITTEST.viewportq.find(".xtext").size();
	        return counttext === 14;
	    }], 
		["bindThingy: first text node is correct", function(){
	        var testtext = UNITTEST.viewportq.find(".xtext .xcontent:first").text();
	        return testtext === "Suggested Format";
	    }], 
		["bindThingy: first attribute node is correct", function(){
	        var testtext = UNITTEST.viewportq.find(".xattribute .xcontent:first").text();
	        return testtext === "index";
	    }], 
		["bindThingy: last text node correct", function(){
	        var testtext = UNITTEST.viewportq.find(".xtext:last").text();
	        return testtext === "We hope these events provide an opportunity for critical exchanges to take place.";
	    }], 
		["bindThingy: valid heirarchy to first text node", function(){
	        var testtext = UNITTEST.viewportq.find(".xelement .xelement .xelement .xtext:first").text();
	        return testtext === "Suggested Format";
	    }], 
		["bindThingy: Removing attribute nodes removes all descendants bound to attributes", function(){
	        UNITTEST.boundq.find(".xattribute").each(function(){
				var thisq = $(this);
	            var attthingy = thisq.data("xthingy");
	            var elthingy = thisq.parents(".xelement:first").data("xthingy");
	            elthingy.removeAttribute(attthingy);
	        });
	        return UNITTEST.boundq.find(".xattribute").length === 0;
	    }], 
		["bindThingy: Removing text nodes removes all descendants bound to text", function(){
	        UNITTEST.boundq.find(".xtext").each(function(){
				var thisq = $(this);
	            var textthingy = thisq.data("xthingy");
	            var elthingy = thisq.parents(".xelement:first").data("xthingy");
	            elthingy.removeChild(textthingy);
	        });
	        return UNITTEST.boundq.find(".xattribute").length === 0;
	    }], 
		["bindThingy: Removing content from root removes all descendants bound to elements", function(){
	        YOURX.cloneArray(UNITTEST.rootthingy.getChildren()).forEach(function(child){
	            UNITTEST.rootthingy.removeChild(child);
	        });
	        return UNITTEST.boundq.find(".xelement").length === 0;
	    }], 
		["bindThingy: Removing Thingy wrapper altogether leaves empty element", function(){
			UNITTEST.boundq.remove();
			return UNITTEST.viewportq.children().length === 0;
	    }], 
	]);
});

