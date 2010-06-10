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
				if(thingy instanceof YOURX.AttributeThingy){
					this.queryContentWrapper(superq).before(' <span class="xname">' + thingy.getName() +'</span>="');
					this.queryContentWrapper(superq).after('"');
				}
			}
			return superq;
		}

		/** Only works for NamedThingy subclasses. */
		RawEditor.prototype.queryNameWrapper = function(elq){
			return elq.children().filter(".xname");
		}

		function CompletionEditor(){
			RawEditor.apply(this,arguments);
		}
		CompletionEditor.prototype = new RawEditor();
		
		CompletionEditor.prototype.setFocus = function(focusthingy, focuscaret){
			//remove previous focus
			var focusq = this.getFocusedSelection();
			if(focusq && focusq.size()){
				focusq.blur();
				focusq.removeAttr("contenteditable");
			}
			//sanitise submitted focuscaret value
			if(focuscaret){
				if(!isNaN(focuscaret)){ //turn integer into proper focuscaret structure
					focuscaret = {start:focuscaret,end:focuscaret};
				}
				else if("start" in focuscaret && !isNaN(focuscaret.start)){ //duplicate end value for zero length selection
					if(!("end" in focuscaret)){
						focuscaret.end = focuscaret.start;
					}
				}
				else{
					throw new Error("Malformed invocation of setFocus(). Improper focuscaret.");
				}
			}
			else{
				focuscaret = {start:0,end:0};
			}
			//set new values
			this.focusthingy = focusthingy;
			this.focuscaret = focuscaret;
			//add focus again
			var focusq = this.getFocusedSelection();
			if(focusq && focusq.size()){
				focusq.attr("contenteditable", "true");
				focusq.focus();
				focusq.caret(this.getDomCaret());
			}
		}

		/** Calculates the start and end of the selection in the actual DOM element, since focuscaret values use negative values symbolically. */
		CompletionEditor.prototype.getDomCaret = function(){
			if (this.focuscaret) {
				if (this.focuscaret.start === this.focuscaret.end) {
					if (this.focuscaret.start >= 0) { //cursor position is focused in content
						if (this.focusthingy instanceof YOURX.ContainerThingy) {
							if (this.focuscaret.start === 0) {
								return this.focuscaret;
							}
							else {
								//TODO, containers have no content as such, recurse to focus/create elements based on positive, 
								//non-zero cursor position within their content
								throw Error("Containers have no direct content, cursor position cannot be positive");
							}
						}
						else 
							if (this.focusthingy instanceof YOURX.ContentThingy) {
								return this.focuscaret; // content can have a positive 
							}
							else {
								throw Error("Focus requested from unexpected element");
							}
					}
					else { //cursor position is focused in name
						//negative offset according to the length of the name
						return {
							start: (this.focuscaret.start + this.focusthingy.name.length + 1),
							end: (this.focuscaret.end + this.focusthingy.name.length + 1)
						};
					}
				}
				else {
					throw Error("Multiple selection currently not implemented");
				}
			}
			else {
				throw Error("No focus caret is set.");
			}
		}

		CompletionEditor.prototype.getFocusedSelection = function(){
			if (this.focusthingy) { 
				var boundq = this.getBoundSelection(this.focusthingy);
				if(this.focuscaret) {
					if (this.focuscaret.start === this.focuscaret.end) {
						var cursorpos = this.focuscaret.start;
						if (cursorpos >= 0) {
							if(this.focusthingy instanceof YOURX.ContainerThingy){
								//cursor is in descendant wrapper
								return this.queryDescendantWrapper(boundq);								
							}
							else if (this.focusthingy instanceof ContentThingy){
								//cursor is just in the content
								return this.queryContentWrapper(boundq);								
							}
						}
						else { 
							//field cursor is in name
							return this.queryNameWrapper(boundq);								
						}
					}
					else {
						throw new Error("Multiple character selection currently not implemented");
					}
				}
			}
			return null;
		}

		
		CompletionEditor.prototype.trackThingy = function(thingy){
			//superclass tracking
			RawEditor.prototype.trackThingy.apply(this,arguments);
			//create listeners for key events
			var editorthis = this;
			var keydownListener = function(evt){
				return editorthis.handleKeydown(evt);
			};
			var keypressListener = function(evt){
				return editorthis.handleKeypress(evt);
			};
			//wire into bound selection
			var boundq = this.getBoundSelection(thingy);
			boundq.focus(function(evt){
				boundq.bind('keydown', keydownListener);
				boundq.bind('keypress', keypressListener);
				evt.stopPropagation();//consider more elegant way of differentiating if evt is for this level																	
			});
			boundq.blur(function(evt){
				boundq.unbind('keydown', keydownListener);
				boundq.unbind('keypress', keypressListener);
				evt.stopPropagation(); //consider more elegant way of differentiating if evt is for this level																
			});
		}

		CompletionEditor.prototype.untrackThingy = function(){ //TODO, consider unbinding focus and key listeners
			RawEditor.prototype.untrackThingy.apply(this,arguments);			
		}


		/** Handles a new key pressed in the context of a given...
		 * @param {Object} whichkey the key to handle
		 * @return The thingy which should acquire focus, or null if no focus
		 */
		CompletionEditor.prototype.handleKeypress = function(evt){
			//TODO : wire into operationcaret's list of available operations
			var charpress = String.fromCharCode(evt.which);
			if(this.focusthingy){
				if(evt.which === 16){ // shift key - do nothing
				}
				else if(charpress === '<'){ // '<' beginning of open tag
					if(this.focusthingy instanceof YOURX.ContainerThingy){
						var newthingy = new YOURX.ElementThingy("");
						this.focusthingy.addChild(newthingy);
						this.setFocus(newthingy, -1);
						evt.preventDefault();
					}
				}
				else if(charpress.match(/[A-Za-z]/)){ //alpha 
					if(this.focuscaret.start < 0){ //check if in name section
						var domcaret = this.getDomCaret();
						var name = this.focusthingy.name;
						this.focusthingy.name = name.slice(0,domcaret.start) + charpress + name.slice(domcaret.end, name.length);
					}
				}
				else{
					throw new Error("Character '" + evt.which + "' unhandled by any Controller case. Should have returned by now." );					
				}
			}
			return true;
		}
		
		/** Handles a new key pressed in the context of a given...
		 * @param {Object} whichkey the key to handle
		 * @return The thingy which should acquire focus, or null if no focus
		 */
		CompletionEditor.prototype.handleKeydown = function(evt){
			//TODO : wire into operationcaret's list of available operations
			/*
			if(this.focusthingy){
				switch(evt.which){
					case 16: // shift key - do nothing
						return;
					break;
					case 188: // '<' key for beginning of open tag
						if(this.focusthingy instanceof YOURX.ContainerThingy){
							var newthingy = new YOURX.ElementThingy("");
							this.focusthingy.addChild(newthingy);
							this.setFocus(newthingy, -1);
							evt.preventDefault();
							evt.stopPropagation();
						}
					break;
					case '>': //
					break;
					default:
					throw new Error("Character '" + evt.which + "' unhandled by any Controller case. Should have returned by now." );
					break;
				}
			}
			*/
			return true;
		}
			
		/*
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
		*/
		
		return eval(YOURX.writeScopeExportCode([
			'RecursiveEditor', 'SpanEditor', 'RawEditor', 'CompletionEditor']
		));	
		
	}()),
	'ALLY'
);