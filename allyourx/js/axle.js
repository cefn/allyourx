/** AXLE is the home for components coordinating the Schema (YOURX) and Editor (ALLY) libraries to 
 * make schema-driven editors.
 *  
 * OperationCaret provides a logic 'model' for schema driven editing, indicating what operations are available. 
 * It incorporates conventions for representing _focus_ and _change operations_ in trees of Thingies.
 * 
 * CompletionEditor is an example 'view' extending ALLY.RawEditor with smart autocompletion behaviours driven by keyboard text entry. 
 * It draws heavily on the YOURX.ThingyTracker tree-monitoring, querying and metadata storage structure.
 * 
 */
AXLE = function(){	
	
	/** 
	 * @param {Thingy} parentthingy A parent thingy which, it is assumed, shallow-validates 
	 * against the corresponding ThingyRule in the grammar, as do all its ancestors and preceding siblings.
	 * @param {ThingyRule} parentrule The corresponding ThingyRule which parentthingy statisfies.
	 * 
	 * @classDescription  An OperationCaret applies to the attributes and children of one Thingy in an existing tree, 
	 * represented by 'parentthingy'. For the proper functioning of the OperationCaret it is assumed that all ancestors
	 * including the parentthingy, and all preceding sibling thingies have passed shallow validation (validation only 
	 * up to and including their own level; e.g. rule#matchThingy(thingy, shallow=true) ).
	 * 
	 * Operations are expansions or contractions of the tree which can or must be executed at the given caret position, creating
	 * or maintaining a tree which will pass shallow validation for all attributes and children of the parentthingy.
	 * 
	 * The OperationCaret monitors changing rule, attribute and child assignment to that Thingy
	 * and updates its estimate of available Operations accordingly.
	 *  
	 * You can use the OperationCaret to automatically construct one of two Operations for you.
	 * 
	 * The 'involuntary' operation will execute changes which MUST be applied to a partially invalid tree in 
	 * order to make the tree pass shallow validation.
	 * 
	 * The 'voluntary' operation will execute a set of changes which MAY be applied to a valid tree
	 * such that it will still pass shallow validation.
	 * 
	 * Each operation may have to be re-evaluated after a change to the Thingy tree, including the changes applied 
	 * by applying an Operation, so these results should not be cached.
	 * 
	 * Operations are composed from atomic ThingyAdditions, ThingyDeletions, and ThingyEdits, and may be aggregated
	 * using specialised subclasses of ThingyOperation which represent a compound set.
	 * 
	 * ThingyOperations for which #isInteractive() returns false are deterministic enough to proceed
	 * without any user input, introducing or removing ElementThingy,AttributeThingy and TextThingy objects to the tree.
	 * 
	 * ThingyOperations for which #isInteractive() returns true require the user to make a selection or provide a value 
	 * before they can proceed. Passing a user object into ThingyOperation's interactWithUser method triggers callbacks
	 * to get information.
	 * 
	 * The getInvoluntaryOperation() method will return operations until the Tree passes shallow validation. If no 
	 * further operations are required to satisfy validation then it will return null;
	 * 
	 * The getVoluntaryOperation() method may return operations only if the Tree has already passed shallow validation,
	 * and may throw an exception if this is not the case. If all production rules are finite and already satisfied, 
	 * then the method will return null;
	 * 
	 * @projectDescription Scenarios to note. Sequences of multiple zeroOrMore elements with no matching children
	 * are effectively active in parallel at the same caret position. Attribute rules are effectively 
	 * active in parallel. Any child rules of an Interleave structure are active in parallel. Highly 
	 * parallel expansions can create ThingyOperations which embody a very large number of alternative sub-operations.
	 * 
	 */
	function OperationCaret(parentrule,parentthingy){
		this.treeUpdatedListener = YOURX.ThingyUtil.methodHandoffFunction(this, "updateOperationCache"); 
		this.setParentRule(parentrule);
		this.setParentThingy(parentthingy);
	}
	
	//TODO consider how OperationCaret should bind to ContentThingies (Attributes and Text) where validation rules are highly granular (e.g. RegExp)
	// Position cld be character position? What is name hashmap for? 
	//TODO position representation for large number of positions (e.g. text blocks) could be more efficient using integers/arrays than
	//strings/hashmap
	
	//TODO handle the issue that keys have to be typed as string to index properties
	//but need to be numbers and strings to be used elsewhere, or perhaps this is already 
	//implicitly addressed 

	/** Returns the key of the next involuntary operation. If this is a number, then the operation will act at a given
	 * numbered position (e.g. act on a child node). If it is a string, then the operation will act at a given named 
	 * position (e.g. act on an attribute). The operation itself can be retrieved using nextInvoluntaryOperation()
	 */	
	OperationCaret.prototype.nextInvoluntaryKey = function(){
		var key;
		for(key in this.involuntaryoperations){
			return key;
		}
		return null;
	};

	/** Returns the next involuntary operation. It simply returns the operation stored at the next key in interation order. 
	 * The sequence of returned operations is therefore dependent on the implementation and should be assumed to be arbitrary.
	 */
	OperationCaret.prototype.nextInvoluntaryOperation = function(){
		var key = this.nextInvoluntaryKey();
		if(key){
			return this.involuntaryoperations[key];
		}
		else{
			return null;				
		}
	};
	
	/** Retrieves and executes all involuntary operations required to make the thingy validate. This is likely to be 
	 * the first operation executed on a thingy tree in an editor. Some involuntary operations will require interactions 
	 * with the provided user object.
	 * @param {Object} user
	 */
	OperationCaret.prototype.shallowFix = function(user){
		var key, op;
		while(key=this.nextInvoluntaryKey()){
			op = this.involuntaryoperations[key];
			if(!op.isInteractive()){
				op.act(this.parentthingy,key);
			}
			else if(user){
				op.interact(this.parentthingy,key,user);
			}
			else{
				return false;
			}
		}
		return true;
	};
					
	/** Binds changes in the thingy to trigger a refresh of the operation cache. */
	OperationCaret.prototype.startListeningTo = function(thingy){
		if("getChildren" in thingy){
			thingy.bind('childadded',this.treeUpdatedListener);
			thingy.bind('childremoved',this.treeUpdatedListener);
		}
		if("getAttributes" in thingy){				 
			thingy.bind('attributeadded',this.treeUpdatedListener);
			thingy.bind('attributeremoved',this.treeUpdatedListener);
		}
	};

	/** Unsubscribes all listener relationships for a given thingy. */
	OperationCaret.prototype.stopListeningTo = function(thingy){
		var listener = this.getRecacheFunction();
		if("getChildren" in thingy){
			thingy.unbind('childadded',this.treeUpdatedListener);
			thingy.unbind('childremoved',this.treeUpdatedListener);
		}
		if("getAttributes" in thingy){				 
			thingy.unbind('attributeadded',this.treeUpdatedListener);
			thingy.unbind('attributeremoved',this.treeUpdatedListener);
		}				
	};

	/** Used to configure the parentthingy of the OperationCaret. In principle this means
	 * that an OperationCaret can be reused for multiple points in the tree, although
	 * this should be tested. 
	 * @param {Object} parentthingy The thingy monitored
	 */
	OperationCaret.prototype.setParentThingy = function(parentthingy){			
		///store and subscribe parentthingy
		if(this.parentthingy){ //already a previous parentthingy - unbind events
			this.stopListeningTo(this.parentthingy);
		}
		this.parentthingy = parentthingy;
		if(this.parentthingy){
			this.startListeningTo(this.parentthingy);
			this.updateOperationCache();								
		}
		else{
			throw new Error("null parentthingy set in OperationCaret");
		}
	}
	
	/** Used to configure the parentrule of the OperationCaret. In principle this means
	 * that an OperationCaret can be reused through different validation scenarios for the 
	 * same thingy, although this should be tested. 
	 * @param {Object} parentrule The rule monitored
	 */
	OperationCaret.prototype.setParentRule = function(parentrule){
		this.parentrule = parentrule;
		if(this.parentrule){
			this.updateOperationCache();		
		}
		else{
			throw new Error("null parentrule set in OperationCaret");
		}
	}
	
	/** Returns the parentthingy which this OperationCaret is testing validity for.*/
	OperationCaret.prototype.getParentThingy = function(){
		return this.parentthingy;
	}

	/** Returns the parentrule which this OperationCaret is validating against.*/
	OperationCaret.prototype.getParentRule = function(){
		return this.parentrule;
	}
	
	/** Refreshes the set of possible valid operations on the current parentthingy given
	 * the current parentrule. Typically this is re-executed after every change in 
	 * the tree. It will either create a set of involuntary operations if the tree is not 
	 * yet valid, or voluntary ones, if the tree is valid, but optional operations are 
	 * available. Currently, it terminates after it has found the next involuntary operation,
	 * and does not search for voluntary operations.
	 */ 
	OperationCaret.prototype.updateOperationCache = function(){
		var caretthis = this; //allows closures to access caret properties
		
		if(this.parentrule && this.parentthingy){
			
			//Either voluntary or involuntary operations will be produced, should never be both

			this.involuntaryoperations = {}; //indexed by name (string) and pos (number)
			this.voluntaryoperations = {}; //indexed by name (string) and pos (number)
			
			//test to see if tree is not valid - i.e. involuntary operations are required?
			
			//create ElementWalker which caches operations required at this level
			var caretwalker = new YOURX.ElementWalker();
			var opfound = {};
			caretwalker.nameAccepted=function(name,rule){ /* do nothing */}
			caretwalker.nameRejected=function(name,rule){ 
				caretthis.involuntaryoperations[name] = new ThingyDeletion(rule); 
				throw opfound;
			}
			caretwalker.nameRequired=function(name,rule){ 
				caretthis.involuntaryoperations[name] = new ThingyAddition(rule); 
				throw opfound;
			}
			caretwalker.posAccepted=function(pos,rule){ /* do nothing */}
			caretwalker.posRejected=function(pos,rule){ 
				caretthis.involuntaryoperations[pos] = new ThingyDeletion(rule); 
				throw opfound;
			}
			caretwalker.posRequired=function(pos,rule){ 
				caretthis.involuntaryoperations[pos] = new ThingyAddition(rule); 
				throw opfound;
			}
			
			//Walk to find involuntary operations available at various caret positions
			//terminating early using 'opfound' exception hack when first operation is found
			try{
				YOURX.ThingyUtil.walkBelow(this.parentrule,this.parentthingy, caretwalker);
				
				//if this line is reached then there are no involuntary operations, 
				//as no exception was thrown. Can proceed to assess voluntary ones

				//create CachingWalker which allows multiple entries per key
				/*
				var cachingwalker = new YOURX.CachingWalker();
				cachingwalker.putCache = function(allmaps,mapkey,key,item){
					var itemarray = this.getCache(key);
					if(itemarray === null){
						itemarray = [];
						CachingWalker.prototype.putCache.apply(this, [allmaps,mapkey,key,itemarray]);
					}
					itemarray.push(item);
				}
				*/
				
			}
			catch(e){
				if(e !== opfound){
					throw e;
				}
			}
			

		}			
	}		
	
	/** Gets an involuntary operation against a given key
	 * @param {integer,string} key The key for the operation, which may be an 
	 * attribute name (string) or an child position (integer) 
	 */
	OperationCaret.prototype.getInvoluntaryOperation = function(key){
		return this.involuntaryoperations[key];
	}
	
	/** Gets the list of keys for which there are involuntary operations. */ 
	OperationCaret.prototype.involuntaryKeys = function(filterfun){
	   var keys = [];
	   for(var key in this.involuntaryoperations){
	      if(!filterfun || filterfun(key)){
		      keys.push(key);
		  }
	   }
	   return keys;
	};

	/** Gets the attribute keys for which involuntary operations are required. */ 
	OperationCaret.prototype.involuntaryAttributeKeys = function(){
		return this.involuntaryKeys(function(key){return isNaN(key);});
	};

	/** Gets the child keys for which involuntary operations are required. */ 
	OperationCaret.prototype.involuntaryChildKeys = function(){
		return this.involuntaryKeys(function(key){return !isNaN(key);});
	};
	
	/** 
	 * @param {integer,string} key The key for the expansion, which may be an 
	 * attribute name (string) or an child position (integer) 
	 */
	OperationCaret.prototype.getVoluntaryOperations = function(key){
		throw new YOURX.UnsupportedOperationError("getVoluntaryOperations() not (yet) implemented.");	
	}

	
	/** A ThingyOperation represents a change to the children or attributes of the thingy. 
	 * @param {Object} rule The rule which this operation attempts to satisfy.
	 */
	function ThingyOperation(rule){
		this.rule = rule;
	}
	/** @return {String} The text label which should be shown to describe this operation */
	ThingyOperation.prototype.getLabel = function(){
		throw new YOURX.UnsupportedOperationError("getLabel() is not yet implemented for this Operation");	
	}		
	/** @return {boolean} True iff the operation needs user input to proceed. */
	ThingyOperation.prototype.isInteractive = function(){
		throw new YOURX.UnsupportedOperationError("isInteractive() is not yet implemented for this Operation");
	}

	/** Triggers non-interactive operations
	 */
	ThingyOperation.prototype.act = function(user){
		throw new YOURX.UnsupportedOperationError("act() is not implemented for this Operation. Check the value of isInteractive()");
	}

	/** Triggers interactive operations
	 * Fires requests to get user input until sufficient unknowns have been provided to proceed.
	 * Operations which represent a compound set may pass the user object to their components.
	 * @param {YOURX.User} user
	 */
	ThingyOperation.prototype.interact = function(user){
		throw new YOURX.UnsupportedOperationError("interact() is not implemented for this Operation. Check the value of isInteractive().");
	}
			
	/** @param {ThingyRule} rule The rule which this Deletion is trying to satisfy */
	function ThingyDeletion(rule){
		ThingyOperation.apply(this,arguments);
	}
	ThingyDeletion.prototype = new ThingyOperation();
	ThingyDeletion.prototype.isInteractive = function(){
		return false; //all scenarios for v001 are non-interactive
	}
	/** Executes the deletion of the invalid child. */
	ThingyDeletion.prototype.act = function(parentthingy, key){
		if(this.rule instanceof YOURX.ElementThingyRule){
			if(typeof(key) === "number"){
				parentthingy.removeChild(key);
			}
			else{
				throw new Error("Key for child operations should be an integer number identifying the position");
			}					
		}
		else if(this.rule instanceof YOURX.AttributeThingyRule){
			if(typeof(key) === "string"){
				parent.removeAttribute(key);
			}
			else{
				throw new YOURX.ThingyRuleError("Key for attribute operations should be a text string identifying the name");
			}
		}
		else{
			throw new YOURX.UnsupportedOperationError('ThingyDeletion cannot (yet) handle this ThingyRule type');
		}
	}
	
	/** @param {ThingyRule} rule The rule which this Expansion is trying to satisfy */
	function ThingyAddition(rule){
		ThingyOperation.apply(this,arguments);
	}
	ThingyAddition.prototype = new ThingyOperation();
	ThingyAddition.prototype.isInteractive = function(){
		return false; //all scenarios for v001 are non-interactive
	}
	/** Executes the addition of a child required by the rule.
	 * @param {Thingy} parentthingy The thingy which matched the parent rule 
	 * @param {integer} key The child key indicating where expansion should take place (string=name,integer=pos)
	 */
	ThingyAddition.prototype.act = function(parentthingy, key){
		if(this.rule instanceof YOURX.ElementThingyRule){
			if(!isNaN(key)){ //key is element position
				parentthingy.addChild(new YOURX.ElementThingy(this.rule.name), parseInt(key));
			}
			else{
				throw new Error("Key should be an integer number");
			}					
		}
		else if(this.rule instanceof YOURX.AttributeThingyRule){
			if(isNaN(key)){ //key is attribute name
				parentthingy.addAttribute(new YOURX.AttributeThingy(this.rule.name));
			}
			else{
				throw new YOURX.ThingyRuleError("Attribute key should be a text string");
			}
		}
		else{
			throw new YOURX.UnsupportedOperationError('ThingyAddition cannot (yet) handle this ThingyRule type');
		}
	}
	
	
	function CompletionEditor(){
		ALLY.RawEditor.apply(this,arguments);
	}
	CompletionEditor.prototype = new ALLY.RawEditor();
	
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
			
			//TODO: This is dependent on W3C implementation - will break in IE
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
						else if (this.focusthingy instanceof YOURX.ContentThingy){
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
		ALLY.RawEditor.prototype.trackThingy.apply(this,arguments);
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
		ALLY.RawEditor.prototype.untrackThingy.apply(this,arguments);			
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
	
	/** AvixEditor is wired into mouse and keyboard eventing and triggers changes to the ThingyTree
	 * or navigation operations depending where the caret and cursor is, and which characters are hit.
	 */ 
	
	/** Alternate names; Exemplar, FixEditor, PoxEditor */
	function AvixEditor(){
		ALLY.RawEditor.apply(this,arguments);
		this.keyPressedListener = YOURX.ThingyUtil.methodHandoffFunction(this, "handleKeypress");
	}
	AvixEditor.prototype = new ALLY.RawEditor();
	
	//TODO set editor caret based on mouse click in DOM
	
	AvixEditor.prototype.trackThingy= function(thingy){
		ALLY.RawEditor.prototype.trackThingy.apply(this,arguments); //superclass call
		var boundselection = this.getBoundSelection(thingy);
		boundselection.bind("keypress",this.keyPressedListener);
	}

	AvixEditor.prototype.untrackThingy= function(thingy){
		var boundselection = this.getBoundSelection(thingy);
		boundselection.unbind("keypress",this.keyPressedListener);
		ALLY.RawEditor.prototype.untrackThingy.apply(this,arguments); //superclass call
	}

	/** Records the current thingy and key indicating where the cursor is, and moves the cursor there. */ 
	AvixEditor.prototype.setCaret = function(){
		//handle various forms of invocation
		if('thingy' in arguments[0] && 'key' in arguments[0]){
			this.caret = arguments[0];
		}
		else if(arguments[0] instanceof YOURX.Thingy && 
				(typeof(arguments[1])=="string" || !isNaN(arguments[1]))){
			this.caret = {'thingy':arguments[0],'key':arguments[1]};				
		}
		this.refreshCursor();
	}

	AvixEditor.prototype.caretInName = function(){ //key is numerical and negative
		return 	( !isNaN(this.caret.key) ) && 
				(this.caret.key < 0); 
	}

	AvixEditor.prototype.caretInDescendants = function(){ //key numerical, positive and thingy is container
		return 	(!isNaN(this.caret.key) ) && 
				(this.caret.key >= 0) && 
				(this.caret.thingy instanceof YOURX.ContainerThingy); 			
	}

	AvixEditor.prototype.caretInContent = function(){ //key numerical, positive and thingy is content
		return 	(!isNaN(this.caret.key) ) && 
				(this.caret.key >= 0) && 
				(this.caret.thingy instanceof YOURX.ContentThingy); 			
	}

	AvixEditor.prototype.caretInAttributes = function(){ //key is a string
		isNaN(this.caret.key);
	}
	
	AvixEditor.prototype.getFieldText = function(){
		if(this.caretInName()){
			return this.caret.thingy.getName();
		}
		else if(this.caretInContent()){
			return this.caret.thingy.getValue()
		}
		else if(this.caretInDescendants() || this.caretInAttributes()){
			return ""; //only a placeholder
		}
		else throw new Error("Unexpected caret status");
	}

	AvixEditor.prototype.setFieldText = function(newtext){
		if(this.caretInName()){
			this.caret.thingy.setName(newtext);
		}
		else if(this.caretInContent()){
			this.caret.thingy.setValue(newtext);
		}
		else if(this.caretInDescendants() || this.caretInAttributes()){
			if(newtext != ""){
				throw new Error("Cannot assign text directly to a container");
			}
		}
		else throw new Error("Unexpected caret status");
		
		this.refreshCursor();
	}
			
	AvixEditor.prototype.refreshCursor = function(){
		//calculate new selection (element which will be contenteditable) and position (location of cursor in final Range call)
		var boundselection = this.getBoundSelection(this.caret.thingy);
		var neweditableselection = null;
		var neweditableposition = null;
		if(this.caretInName()){ //position cursor in text node of the name   
			neweditableselection = this.queryNameWrapper(boundselection);
			neweditableposition = this.caret.thingy.name.length + this.caret.key + 1;
		}	
		else if(this.caretInContent()){ //position cursor in text node of the content  
			neweditableselection = this.queryContentWrapper(boundselection);
			neweditableposition = this.caret.key;
		}
		else if(this.caretInDescendants()){ //place cursor among descendant characters or child elements
			neweditableselection = this.queryDescendantWrapper(boundselection);
			neweditableposition = this.caret.key;				
		}
		else if(this.caretInAttributes()){ //place cursor after attribute
			var att = this.caret.thingy.getAttributeThingy(this.caret.key);
			var attselection = this.getBoundSelection(att);
			neweditableselection = this.queryDescendantWrapper(boundselection)
			neweditableposition = neweditableselection.children().index(attselection) + 1;
		}
		
		//update to the new new selection and position
		if((neweditableselection !== null) && (neweditableposition !== null)){

			//control which elements are editable
			var EDITABLEATTR = "contenteditable";

			//TODO can avoid this if selections are equal
			if(this.editableselection){
				this.editableselection.children().andSelf().removeAttr(EDITABLEATTR); //strip old assignments from self and children				
				this.editableselection.blur();
			}
			neweditableselection.attr(EDITABLEATTR,"true"); //ensure element editable
			neweditableselection.children().attr(EDITABLEATTR,"false"); //ensure children not editable
			neweditableselection.focus();
			
			//choose anchor node
			var anchornode = null; 
			if(this.caretInName() || this.caretInContent()){ //character position in first DOM child (text node)
				anchornode = neweditableselection.contents()[0];
			}
			if(this.caretInDescendants() || this.caretInAttributes()){ //child position in parent DOM element 
				anchornode = neweditableselection[0];
			}
			
			//TODO: Below implementation dependent on W3C - will break in IE
			
			//position cursor by creating range
			var winselection = window.getSelection();
			var range;
			if(winselection.rangeCount == 0){ 
				range = document.createRange();
				winselection.addRange(range);
			} 
			else{
				range = winselection.getRangeAt(0); 
			}
			range.setStart(anchornode, neweditableposition);
			range.setEnd(anchornode, neweditableposition);
			
			//store new values
			this.editableselection = neweditableselection;
			this.editableposition = neweditableposition;
		}
	}
	
	AvixEditor.prototype.handleFieldChange = function(newtext){ //TODO refactor for efficiency by caching values and functions below
		var keepmatch;
		var actions = new Hashtable();
		//TODO replace manual checking of keys below with calls to caretInX() functions
		if(this.caret.thingy instanceof YOURX.ContainerThingy){
			if(!isNaN(this.caret.key)){ //key references child position
				if(this.caret.key < 0){ //cursor in element name 
					keepmatch = /^[A-Za-z]+/;
					actions.put(">", function(){ //focus content
						this.setCaret(this.caret.thingy,0);
					});
					actions.put("\\s", function(){ //new attribute and focus name
						var att = new YOURX.AttributeThingy("",""); //blank name and value to begin
						this.caret.thingy.addThingy(att);
						this.setCaret(att,-1);
					});
				}
				else{ //cursor in container content
					keepmatch = /^$/;
					actions.put("<", function(){ //create element and focus name
						var el = new YOURX.ElementThingy(""); //blank name to begin
						this.caret.thingy.addThingy(el);
						this.setCaret(el,-1);
					});
					if(this.caret.thingy instanceof YOURX.ElementThingy){
						actions.put("[^<]", function(surplus){ //allow text up to new element tag
							var tx = new YOURX.TextThingy(surplus);
							this.caret.thingy.addThingy(tx);
							this.setCaret(tx,1);
						});
					}				
				}
			}
			else{ //key references a property (cursor is after an attribute)
				keepmatch = /^$/;
				actions.put(">", function(){ //focus in content
					this.setCaret(this.caret.thingy,0);
				});
			}
		}
		else if(this.caret.thingy instanceof YOURX.AttributeThingy){
			if(!isNaN(this.caret.key)){ //key references position
				if(this.caret.key < 0){ //cursor is in name
					keepmatch = /^[A-Za-z]+/;
					actions.put("=", function(){
						this.setCaret(this.caret.thingy,0);//move to content
					});
				}
				else{ //cursor is in content
					keepmatch = /^[^"]*/;
					actions.put('">', function(){ //attribute and element closed
						this.setCaret(this.getParent(this.caret.thingy),0); //focus in element content
					});
					actions.put('"\s', function(){ //attribute closed and another opened
						var att = new YOURX.AttributeThingy(""); //create new attribute
						var el = this.getParent(caret.thingy); //introspect parent
						el.addThingy(att); //add to parent
						this.setCaret(att,-1); //focus on name
					});						
				}
			}
			else{throw new Error("AttributeThingies can't have named properties.");}
		}
		else if(this.caret.thingy instanceof YOURX.TextThingy){ 
			if(!isNaN(this.caret.key) && this.caret.key >=0 ){ //key references content position
				keepmatch = /^[^<]*/;
				actions.put("<",function(){ //add element to parent after your position
					var el = new YOURX.ElementThingy();
					var txpos = this.getPosition(this.caret.thingy);
					this.getParent(this.caret.thingy).addThingy(el, txpos + 1);
					this.setCaret(el,-1);
				});
			}
			else{throw new Error("TextThingies can't have named properties.");}
		}

		//get the current content
		var fieldtext = this.getFieldText();
		
		//find any characters which are content
		var validmatches = newtext.match(keepmatch);
		if(validmatches && validmatches.length > 0){
			validtext = validmatches[0];
		}
		else{
			validtext = null;
		}
		//trigger insertion if content is new
		if(validtext && validtext != fieldtext){ //the new character is valid content
			var growth = validtext.length - fieldtext.length;
			this.setFieldText(validtext);
			if(this.caretInContent()){ //increment caret key for the new character
				this.setCaret(this.caret.thingy, this.caret.key + growth); //setField and this may trigger a double refreshCursor call
			}
		}
		else{ //surplus text beyond valid text
			var surplustext;
			if(validtext){
				surplustext = newtext.substring(validtext.length);				
			}
			else{
				surplustext = newtext;
			}
			//match surplus characters to an action and trigger it
			if(surplustext){
				var actionkeys = actions.keys();
				var actionidx,actionkey,actionfun; 
				for(actionidx = 0; actionidx < actionkeys.length; actionidx++){ //'actions' has functions stored against patterns
					var actionkey = actionkeys[actionidx];
					var actionpattern = new RegExp(actionkey); //load pattern and test
					var actionmatches = surplustext.match(actionpattern);
					if(actionmatches && actionmatches.length > 0){
						actions.get(actionkey).apply(this,[surplustext]); //load function and execute
						return;
					}
				}			
			} //fallthrough to error condition
			throw new Error("Invalid character inserted.");
		}
	}
	
	AvixEditor.prototype.handleKeypress = function(evt){
		//update the field text
		var charpressed = String.fromCharCode(evt.which);
		var oldtext = this.getFieldText();
		var newtext;
		if(oldtext && oldtext != ""){ //insert in existing text
			newtext = oldtext.slice(0,this.editableposition) + charpressed + oldtext.slice(this.editableposition, oldtext.length);
		}
		else{ //no existing text
			newtext = charpressed;
		}
		this.handleFieldChange(newtext);
		
		//key event has been handled so consume
		evt.stopPropagation();
		evt.preventDefault();
	};
				
	return eval(YOURX.writeScopeExportCode([
		'OperationCaret','ThingyOperation','ThingyAddition','ThingyDeletion','CompletionEditor', 'AvixEditor'
	]));	
	
}();
