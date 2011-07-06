/*
 * Various utility classes providing functionality for real-time updating views
 * of Thingy Trees, defined in a a private scope with public functions served 
 * under the ALLY namespace.
 * 
 */
ALLY = function(){
	
	/** Abstract definition of a View. Subclasses are expected to coordinate between an in-memory
	 * Thingy tree, and an in-page DOM based representation. Definitions can rely on the Sizzle engine 
	 * to select sets of page resources which are bound to subtrees. The current implementation uses 
	 * JQuery for convenience, but the use of Sizzle directly could be more lightweight in suitable 
	 * cases. 
	 */
	function View(){
		YOURX.ThingyTracker.apply(this,arguments);
	}
	View.prototype = new YOURX.ThingyTracker();
	
	//TODO consider moving bind functions into ThingyUtil
	//where they can be shared more generally
	
	//TODO CH this was unused? What was it intended for? Undo levels?
	/*
	//Acquire listener implementations from YOURX.Thingy 
	View.prototype.bind = YOURX.Thingy.prototype.bind; 
	View.prototype.unbind = YOURX.Thingy.prototype.unbind;
	*/
	
	/** Abstract definition for any View which monitors a tree node for changes, 
	 * keeping its DOM structures in sync. Recursively subscribes to events 
	 * from all new descendant nodes as subtrees appear. This implementation triggers 
	 * factory methods to create new DOM structures, which should be overridden by subclasses.
	 */
	function RecursiveView(){
		View.apply(this,arguments);
	}
	RecursiveView.prototype = new View();

	/** Should create a new set of DOM elements to represent the specified Thingy in the View.
	 * @param {Thingy} thingy The thingy to create elements for
	 * @return A JQuery set of elements not yet attached to a DOM. 
	 */
	RecursiveView.prototype.boundSelectionImpl = function(thingy){
		throw new YOURX.UnsupportedException("The boundSelectionImpl() function must be overriden to implement an ALLY.RecursiveView");
	};

	/** Retrieves the DOM selection matching the provided thingy. */
	RecursiveView.prototype.getBoundSelection = function(thingy){
		return this.getMetadata(thingy)["boundselection"];
	};

	/** Retrieves the thingy matching the provided DOM selection. */
	RecursiveView.prototype.getBoundThingy = function(selection){
		return selection.data("xthingy");
	};
	
	/** Starts tracking an individual Thingy. Creates corresponding content for the 
	 * DOM, makes a cross-referenced record of both DOM and Thingy and then 
	 * hands off to superclass implementation to wire up insertion, deletion and change events. 
	 * @param thingy The thingy to track
	 * @param data An optional data structure argument used for bootstrapping internally to the library
	 */
	RecursiveView.prototype.trackThingy = function(thingy, data){
		var boundq = this.boundSelectionImpl(thingy); //create control
		//TODO, should caret be stored instead?
		boundq.data("xthingy",thingy); //store thingy reference in control
		//metadata needs bootstrapping so listener traversals tie up
		if(!data){
			data = {};
		}
		data["boundselection"] = boundq;//store control reference against thingy metadata
		return View.prototype.trackThingy.apply(this,[thingy, data]); 
	};

	/** Stops tracking an individual Thingy. Tidies up the content and records 
	 * associated with it and stops listening for future events.
	 * @param thingy The thingy to stop tracking.
	 */
	RecursiveView.prototype.untrackThingy = function(thingy){
		var boundq = this.getBoundSelection(thingy);
		View.prototype.untrackThingy.apply(this,arguments);
		boundq.remove();
	};
			
	/** Triggered when a new child is added to a tracked Thingy. 
	 * @param parent The parent thingy to which the child is being added
	 * @param child The new child thingy
	 * @param childidx The child's new position
	 * */
	RecursiveView.prototype.childAdded = function(parent,child,childidx){
		View.prototype.childAdded.apply(this, arguments); //creates bound selection
		var childq = this.getBoundSelection(child);
		var pos = this.getPosition(child);
		var targetq = null;
		if(pos > 0){ //place after preceding sibling, which is already in the descendant wrapper
			targetq = this.getBoundSelection(parent.children[pos -1]);
			targetq.after(childq);					
		}
		else{ //just place below parent in its descendant wrapper
			targetq = this.queryDescendantWrapper(this.getBoundSelection(parent));
			targetq.append(childq);
		}
		if(targetq.size() !== 1){
			throw new Error("Could not find parent or unique preceding sibling selection for child added");
		}
	};

	/** Triggered when a new attribute is added to a tracked Thingy. 
	 * @param parent The parent thingy to which the attribute is being added
	 * @param child The new attribute thingy
	 * */
	RecursiveView.prototype.attributeAdded = function(parent,att){ //attribute appeared
		View.prototype.attributeAdded.apply(this, arguments); //track as normal
		var targetq = this.queryOpenWrapper(this.getBoundSelection(parent));
		targetq.append(this.getBoundSelection(att));
		if(targetq.size() !== 1){
			throw new Error("Could not find parent selection for attribute added");
		}			
	};
			
	/** Triggered when a the content of a Thingy changes (YOURX.TextThingy or YOURX.AttributeThingy). 
	 * @param thingy The thingy whose content is changed
	 * @param newvalue The new content
	 * @param oldvalue The old content
	 * */
	RecursiveView.prototype.valueChanged = function(thingy,newvalue,oldvalue){
		View.prototype.valueChanged.apply(this, arguments); //track as normal
		var targetq = this.queryContentWrapper(this.getBoundSelection(thingy));
		targetq.text(newvalue);
		if(targetq.size() !== 1){
			throw new Error("Could not find content selection for value change");
		}						
	};	
	
	/** A RecursiveView whose factory methods create class-annotated spans
	 * as the structural elements corresponding with individual Thingies in the DOM.
	 */
	function StyledView(){
		RecursiveView.apply(this,arguments);
	};
	StyledView.prototype = new RecursiveView();
	
	/** Constructs nested spans with class annotations representing 
	 * the type of the specified Thingy, then recursively constructs required
	 * spans for all descendants.
	 * @param {Object} thingy
	 */
	StyledView.prototype.boundSelectionImpl = function(thingy){
		var elq = $("<span/>");			

		//bind thingy and add structural elements

		//assign classes depending on Thingy type
		if(thingy instanceof YOURX.ContainerThingy){
			elq.addClass("xcontainer");
			if(thingy instanceof YOURX.ElementThingy){
				elq.addClass("xelement");
			}
			else if(thingy instanceof YOURX.RootThingy){
				elq.addClass("xroot");
			}
		}
		else if(thingy instanceof YOURX.ContentThingy){
			if(thingy instanceof YOURX.AttributeThingy){
				elq.addClass("xattribute");
			}
			else if(thingy instanceof YOURX.TextThingy){
				elq.addClass("xtext");
			}
		}
		
		if(thingy instanceof YOURX.ContainerThingy){
			//add structural spans for start, end and descendants
			elq.append('<span class="xdescend"/>');
			if(thingy instanceof YOURX.ElementThingy){
				elq.prepend('<span class="xopen" />');
				elq.append('<span class="xclose" />');
			}
		}
		if(thingy instanceof YOURX.ContentThingy){
			//add a separate content span
			var contentq = $('<span class="xcontent">' + thingy.getValue() + '</span>');
			elq.append(contentq);
		}		
		
		return elq;
	};
	
	StyledView.prototype.queryContentWrapper = function(elq){
		return elq.children().filter(".xcontent");
	};
	StyledView.prototype.queryDescendantWrapper = function(elq){
		return elq.children().filter(".xdescend");
	};
	StyledView.prototype.queryOpenWrapper = function(elq){
		return elq.children().filter(".xopen");
	};
	StyledView.prototype.queryCloseWrapper = function(elq){
		return elq.children().filter(".xclose");
	};
	
	function XmlView(){
		StyledView.apply(this,arguments);
	}
	XmlView.prototype = new StyledView();
	/** Add xraw class and contentEditable behaviour to content elements
	 * @param {Object} thingy
	 * @param {Object} descend
	 */
	XmlView.prototype.boundSelectionImpl = function(thingy){
		var superq = StyledView.prototype.boundSelectionImpl.apply(this,arguments);
		superq.addClass("xraw");
		if(thingy instanceof YOURX.ContainerThingy){
			if(thingy instanceof YOURX.ElementThingy){
				this.queryOpenWrapper(superq).before('&lt;<span class="xname"></span>');					
				this.queryOpenWrapper(superq).after('&gt;');					
				this.queryCloseWrapper(superq).before('&lt;/<span class="xname"></span>');					
				this.queryCloseWrapper(superq).after('&gt;');
			}					
		}
		else if (thingy instanceof YOURX.ContentThingy){
			if(thingy instanceof YOURX.AttributeThingy){
				this.queryContentWrapper(superq).before(' <span class="xname">' + thingy.getName() +'</span>="');
				this.queryContentWrapper(superq).after('"');
			}
		}
		return superq;
	};

	//TODO: Eliminate need to call getBoundSelection for queryXWrapper functions
	//TODO: Promote common name wrapper functionality into StyledView
	
	//TODO ensure getValue/setValue in ThingyTracker matches getName/setName in behaviour

	/** Only works for NamedThingy subclasses. */
	XmlView.prototype.queryNameWrapper = function(elq){
		return elq.children().filter(".xname");
	};

	/** Handle situation where attribute or element names change. */
	XmlView.prototype.nameChanged = function(thingy,name){
		StyledView.prototype.nameChanged.apply(this, arguments);
		var boundq = this.getBoundSelection(thingy);
		var nameq = this.queryNameWrapper(boundq);
		nameq.text(name); //set the text in the name span(s)
	};
			
	/*
	function getAnnotationNames(){
		return ['a:label','a:help','a:xpathselect','a:tabindex']; //incrementally support use name, type and ordinary facets from RelaxNG
	}
	*/
	
	return eval(YOURX.writeScopeExportCode([
		'RecursiveView', 'StyledView', 'XmlView']
	));	
	
}();