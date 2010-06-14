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
					this.queryOpenWrapper(superq).before('&lt;<span class="xname"></span>');					
					this.queryOpenWrapper(superq).after('&gt;');					
					this.queryCloseWrapper(superq).before('&lt;<span class="xname"></span>');					
					this.queryCloseWrapper(superq).after('/&gt;');
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

		//TODO: Eliminate need to call getBoundSelection for queryXWrapper functions
		//TODO: Promote common name wrapper functionality into SpanEditor
		
		//TODO ensure getValue/setValue in ThingyTracker matches getName/setName in behaviour

		/** Only works for NamedThingy subclasses. */
		RawEditor.prototype.queryNameWrapper = function(elq){
			return elq.children().filter(".xname");
		}

		RawEditor.prototype.nameChanged = function(thingy,name){
			SpanEditor.prototype.nameChanged.apply(this, arguments);
			this.queryNameWrapper(this.getBoundSelection(thingy)).text(name); //set the text in the name spans
		}

		function CompletionEditor(){
			RawEditor.apply(this,arguments);
		}
		CompletionEditor.prototype = new RawEditor();
		
		CompletionEditor.prototype.setFocus = function(focusthingy, focuscaret){			
			/** Note this from http://www.w3.org/TR/2000/REC-DOM-Level-2-Traversal-Range-20001113/ranges.html
			 * It is also possible to set a Range's position relative to nodes in the tree:
			 *   void setStartBefore(in Node node); raises(RangeException);
			 *   void setStartAfter(in Node node); raises(RangeException);
			 *   void setEndBefore(in Node node); raises(RangeException);
			 *   void setEndAfter(in Node node); raises(RangeException);
			 */
			
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
				
				//TODO: This is heavily dependent on W3C implementation - will break in IE
				var range = window.getSelection().getRangeAt(0);
				var domcaret = this.getDomCaret();
				//use focus node or first text node as anchor
				var anchornode = focusq[0];
				focusq.contents().each(function(){
					if(this.nodeType === Node.TEXT_NODE){
						anchornode = this;
						return false;
					}
					return true;
				});
				//position cursor
				range.setStart(anchornode, domcaret.start);
				range.setEnd(anchornode, domcaret.start);
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
								//containers' positive cursor positions correspond with child positions
								//cursors between children should be before the child's open tag
								return {start:0,end:0};
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
						var name = this.focusthingy.getName();
						return {
							start: (this.focuscaret.start + name.length + 1),
							end: (this.focuscaret.end + name.length + 1)
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
							//field cursor is in name - place cursor in name part of open tag 
							var namewrapper = this.queryNameWrapper(boundq); 
							return namewrapper.eq(0);								
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

		CompletionEditor.prototype.insertAtFocusCaret = function(toinsert){
			if (this.focusthingy instanceof YOURX.ContentThingy && 
				this.focuscaret.start >= 0){ //in value section of object with setValue() method
				var value = this.focusthingy.value;
				//make change
				this.focusthingy.setValue(value.slice(0,domcaret.start) + toinsert + value.slice(domcaret.end, value.length));
				//move cursor forward
				this.setFocus(this.focusthingy,domcaret.start + toinsert.length);				
			}
			else if(this.focuscaret.start < 0 && 
					(this.focusthingy instanceof YOURX.ElementThingy || 
					this.focusthingy instanceof YOURX.AttributeThingy)){ //in name section of an object with setName() method
				var domcaret = this.getDomCaret();
				var name = this.focusthingy.getName();
				name = name.slice(0,domcaret.start) + toinsert + name.slice(domcaret.end, name.length);
				this.focusthingy.setName(name);
				this.setFocus(this.focusthingy, (domcaret.start + toinsert.length) - (name.length + 1));
			}
			else{
				throw new Error("Editing event routing error: Illegal to insert at the current DOM position.");
			}
		}

		/** Handles a new key pressed in the context of a given...
		 * @param {Object} whichkey the key to handle
		 * @return The thingy which should acquire focus, or null if no focus
		 */
		CompletionEditor.prototype.handleKeypress = function(evt){
			//TODO: Replicate this functionality using character and keycode sets or regular expressions, ThingyOperation and focus values.
			//this will expose the logic more straighforwardly
			
			/** PSEUDOCODE 
			 * if(caret is in name area){
			 * 		var qnameregexp = /[A-Za-z_]/
			 * 		if(focus is an element or an attribute){
			 * 			get name, and edit according to focus and key hit
			 * 			check it conforms to regexp
			 * 			if it conforms then create a NameChangeThingyOperation
			 * 			else it must be a keypress intended for another later part of the logic
			 * 		}
			 * }
			 * ...
			 * //not an edit, must be a navigation
			 * map keypresses to moves in the document, including arrow keys stepping between editable parts
			 * may need a programmatic representation of the sequence of editable parts
			 */
			
			/** Here's a NCName definition (element and attribute names) from http://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-NCNameChar
			 *  An XML Name, minus the ":"
			 * NCName 	 ::= 	(Letter | '_') (NCNameChar)*	 
			 * NCNameChar 	::= 	Letter | Digit | '.' | '-' | '_' | CombiningChar | Extender
			 */
			
			//TODO: Work out how to represent focus after different attributes in element to permit cursor-driven keyboard navigation
			//possibly requires rethink of focus representation to allow keys as per operationcaret, could allow separation of 
			//focuscaret representation from domcaret (e.g. drop start+end conceit since this doesn't currently work). 
			
			//TODO: consider possibility of using a ThingyTracker to keep an XML DOM in synchrony, permitting XPath to be used?
			
			//TODO : wire into operationcaret's list of available operations
			
			//TODO: make sure that focus cursor shows where characters are about to be inserted

			//override default
			//any edits will be triggered by model change and focus change
			//any navigation will be explicitly triggered below
			evt.preventDefault(); 

			//future implementation can explicitly determine
			// a ThingyOperation
			// a focusthingy and focuscaret (new items created gain focus by default)
			var charpress = String.fromCharCode(evt.which);
			if(this.focusthingy){
				if(charpress === '<'){ // '<' begin tag
					if(this.focusthingy instanceof YOURX.ContainerThingy){ // '<' is tag insertion character
						var newthingy = new YOURX.ElementThingy("");
						this.focusthingy.addChild(newthingy);
						this.setFocus(newthingy, -1); //move domcaret to name
					}
				}
				else if (charpress === '>') { // '>' end tag
					if(this.focusthingy instanceof YOURX.ElementThingy){
						if(this.focuscaret.start < 0){ // '>' next valid at end of opening tag ; move there
							this.setFocus(this.focusthingy,0); //move domcaret to descendants
						}
						else { // '>' next valid at end of closing tag ; move to next available sibling or parent's sibliing
							if(this.focuscaret.start < this.focusthingy.getChildren().length){
								this.setFocus(this.focusthingy, this.focuscaret.start + 1);
							}
							else{
								var parentthingy = this.getParent(this.focusthingy);
								if(parentthingy){
									var parentcaret = this.getPosition(parent, this.focusthingy) + 1;
									this.setFocus(parentthingy,parentcaret); //move domcaret to descendants
								}
								else{ //reached last position in root node - can't go further
									evt.preventDefault(); //override insert; navigating
									throw new Error("At last node");
								}
							}
						}
					}				
				}
				else if (charpress.match(/[A-Za-z]/)) { //alpha
						this.insertAtFocusCaret(charpress);
				}
				else if (charpress.match(/ /)) { //space bar 
					if (this.focuscaret.start < 0) { //in name section
						if (this.focusthingy instanceof YOURX.ElementThingy) { //space is attribute separator, create a new attribute and focus on name
							var att = new YOURX.AttributeThingy("", "");
							this.focusthingy.addAttribute(att);
							this.setFocus(att, -1);
						}
						else if (this.focusthingy instanceof YOURX.AttributeThingy) { //space next valid in attribute value; move there
							setFocus(this.focusthingy,0);
							this.insertAtFocusCaret(charpress);
						}
						else {
							throw new Error("Editing event routing error: Space with negative caret unhandled.");
						}
					}
					else { //in value section
						this.insertAtFocusCaret(" ");
					}
				}
				else if (evt.which === 16) { // shift key - do nothing
				}
				else {
					throw new Error("Character '" + evt.which + "' unhandled by any Controller case. Should have returned by now.");
				}
			}
			return true;
		}
		
		/** Handles a new key pressed in the context of a given...
		 * @param {Object} whichkey the key to handle
		 * @return The thingy which should acquire focus, or null if no focus
		 */
		CompletionEditor.prototype.handleKeydown = function(evt){
			return true;
		}
			
		/*
		function getAnnotationNames(){
			return ['a:label','a:help','a:xpathselect']; //incrementally support use name, type and ordinary facets from RelaxNG
		}
		*/
		
		return eval(YOURX.writeScopeExportCode([
			'RecursiveEditor', 'SpanEditor', 'RawEditor', 'CompletionEditor']
		));	
		
	}()),
	'ALLY'
);