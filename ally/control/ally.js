/*
 * Various functions defined in a a private scope, 
 * with public functions served under the ALLY namespace.
 */
YOURX.copyProperties(
	(function(){	
	
		/** Abstract definition of an editor, which coordinates between an in-memory
		 * Thingy tree, and an in-page DOM based representation. The definition relies 
		 * on the Sizzle engine to define sets of page resources which are bound
		 * to subtrees (provided through JQuery sets for convenience). 
		 */
		function Editor(){
			YOURX.ThingyTracker.apply(this,arguments);
		}
		Editor.prototype = new YOURX.ThingyTracker();
		
		//TODO consider moving bind functions into ThingyUtil
		
		/** Acquire listener implementations from YOURX.Thingy */
		Editor.prototype.bind = YOURX.Thingy.prototype.bind;
		Editor.prototype.unbind = YOURX.Thingy.prototype.unbind;
		
		
		/** Abstract definition for any editor which monitors a tree node for changes, 
		 * keeping its DOM structures in sync. Recursively subscribes to events 
		 * from all new descendant nodes as subtrees appear. This implementation triggers 
		 * factory methods to create new DOM structures, which should be overridden by subclasses.
		 */
		function RecursiveEditor(){
			Editor.apply(this,arguments);
		}
		RecursiveEditor.prototype = new Editor();

		/** Creates a new set of DOM elements to represent the specified Thingy in the Editor.
		 * @param {Thingy} thingy The thingy to create elements for
		 * @return A JQuery set of elements not yet attached to a DOM. 
		 */
		RecursiveEditor.prototype.boundSelectionImpl = function(thingy){
			throw new YOURX.UnsupportedException("The boundSelectionImpl() function must be overriden to implement an ALLY.RecursiveEditor");
		}

		RecursiveEditor.prototype.getBoundSelection = function(thingy){
			return this.getMetadata(thingy)["boundselection"];
		}

		RecursiveEditor.prototype.getBoundThingy = function(selection){
			return selection.data("xthingy");
		}
		
		RecursiveEditor.prototype.trackThingy = function(thingy, data){
			var boundq = this.boundSelectionImpl(thingy); //create control
			//TODO, should caret be stored instead?
			boundq.data("xthingy",thingy); //store thingy reference in control
			//metadata needs bootstrapping so listener traversals tie up
			if(!data){
				data = {};
			}
			data["boundselection"] = boundq;//store control reference against thingy metadata
			return Editor.prototype.trackThingy.apply(this,[thingy, data]); 
		}

		RecursiveEditor.prototype.untrackThingy = function(thingy){
			var boundq = this.getBoundSelection(thingy);
			Editor.prototype.untrackThingy.apply(this,arguments);
			boundq.remove();
		}
				
		RecursiveEditor.prototype.childAdded = function(parent,child,childidx){
			Editor.prototype.childAdded.apply(this, arguments); //creates bound selection
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
		}

		RecursiveEditor.prototype.attributeAdded = function(parent,att){ //attribute appeared
			Editor.prototype.attributeAdded.apply(this, arguments); //track as normal
			var targetq = this.queryOpenWrapper(this.getBoundSelection(parent));
			targetq.append(this.getBoundSelection(att));
			if(targetq.size() !== 1){
				throw new Error("Could not find parent selection for attribute added");
			}			
		}
				
		RecursiveEditor.prototype.valueChanged = function(thingy,newvalue,oldvalue){
			Editor.prototype.valueChanged.apply(this, arguments); //track as normal
			var targetq = this.queryContentWrapper(this.getBoundSelection(thingy));
			targetq.text(newvalue);
			if(targetq.size() !== 1){
				throw new Error("Could not find content selection for value change");
			}						
		}		
		
		/** A RecursiveEditor whose factory methods create class-annotated spans
		 * as the structural elements corresponding with individual Thingies in the DOM.
		 */
		function SpanEditor(){
			RecursiveEditor.apply(this,arguments);
		}
		SpanEditor.prototype = new RecursiveEditor();
		/** Constructs nested spans with class annotations representing 
		 * the type of the specified Thingy, then recursively constructs required
		 * spans for all descendants.
		 * @param {Object} thingy
		 */
		SpanEditor.prototype.boundSelectionImpl = function(thingy){
			var elq = $("<span/>");			

			//bind thingy and add structural elements

			//assign classes depending on Thingy type
			if(thingy instanceof YOURX.ContainerThingy){
				elq.addClass("xcontainer");
				if(thingy instanceof YOURX.ElementThingy){
					elq.addClass("xelement");
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
		}
		
		SpanEditor.prototype.queryContentWrapper = function(elq){
			return elq.children().filter(".xcontent");
		}
		SpanEditor.prototype.queryDescendantWrapper = function(elq){
			return elq.children().filter(".xdescend");
		}
		SpanEditor.prototype.queryOpenWrapper = function(elq){
			return elq.children().filter(".xopen");
		}
		SpanEditor.prototype.queryCloseWrapper = function(elq){
			return elq.children().filter(".xclose");
		}
		
		function RawEditor(){
			SpanEditor.apply(this,arguments);
		}
		RawEditor.prototype = new SpanEditor();
		/** Add xraw class and contentEditable behaviour to content elements
		 * @param {Object} thingy
		 * @param {Object} descend
		 */
		RawEditor.prototype.boundSelectionImpl = function(thingy){
			var superq = SpanEditor.prototype.boundSelectionImpl.apply(this,arguments);
			superq.addClass("xraw");
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){
					this.queryOpenWrapper(superq).before('&lt;<span class="xname">' + thingy.getName() +'</span>');					
					this.queryOpenWrapper(superq).after("&gt;");					
					this.queryCloseWrapper(superq).before("&lt;" + thingy.getName());					
					this.queryCloseWrapper(superq).after("/&gt;");
				}					
			}
			else if (thingy instanceof YOURX.ContentThingy){
				this.queryContentWrapper(superq).attr("contentEditable",true);
				if(thingy instanceof YOURX.AttributeThingy){
					this.queryContentWrapper(superq).before(' <span class="xname">' + thingy.getName() +'</span>="');
					this.queryContentWrapper(superq).after('"');
				}
			}
			return superq;
		}
			
		/*
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
		*/
		
		return eval(YOURX.writeScopeExportCode([
			'RecursiveEditor', 'SpanEditor', 'RawEditor']
		));	
		
	}()),
	'ALLY'
);