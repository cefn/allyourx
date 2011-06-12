$(function(){
    var UNITTEST = {}; //create namespace object for temporary unittest properties
    UNITTEST.viewportq = $("#UNITTEST"); //target this element when binding controls
    executeTests([
		["url2yourx loads XML file without corresponding schema ", function(){
	        UNITTEST.rootthingy = YOURX.ThingyUtil.url2thingy("../xq/data/data.xml");
	        return UNITTEST.rootthingy.getChildren().length != 0;
	    }],
		["bindThingy adds some text nodes", function(){
	        UNITTEST.editor = new ALLY.RawEditor();
			UNITTEST.editor.trackThingy(UNITTEST.rootthingy);
	        UNITTEST.boundq = UNITTEST.editor.getBoundSelection(UNITTEST.rootthingy);
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
		["Element name is in open and close tag of editor", function(){
			UNITTEST.firstchild = UNITTEST.rootthingy.getChildren()[0];
			var firstname = UNITTEST.firstchild.getName();
			var nameq = UNITTEST.editor.queryNameWrapper(UNITTEST.editor.getBoundSelection(UNITTEST.firstchild));
			nameq = nameq.filter(function(){ return $(this).text()===firstname; });
			return nameq.size() === 2;
	    }], 
		["Element name change modifies both open and close tag of SpanEditor", function(){
			var newname = "something";
			UNITTEST.firstchild.setName(newname);
			var nameq = UNITTEST.editor.queryNameWrapper(UNITTEST.editor.getBoundSelection(UNITTEST.firstchild));
			nameq = nameq.filter(function(){ return $(this).text()===newname; });
			return nameq.size() === 2;
	    }], 
		["bindThingy: Removing attribute nodes removes all descendants bound to attributes", function(){
	        UNITTEST.boundq.find(".xattribute").each(function(){
				var thisq = $(this);
	            var attthingy = UNITTEST.editor.getBoundThingy(thisq);
				var elthingy = UNITTEST.editor.getParent(attthingy);
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

