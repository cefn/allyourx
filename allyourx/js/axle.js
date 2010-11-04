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
	 * yet valid, or voluntary ones, if the tree is valid but optional operations are 
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
	};

	AvixEditor.prototype.caretInName = function(){ //key is numerical and negative
		return 	( !isNaN(this.caret.key) ) && 
				(this.caret.key < 0); 
	};

	AvixEditor.prototype.caretInDescendants = function(){ //key numerical, positive and thingy is container
		return 	(!isNaN(this.caret.key) ) && 
				(this.caret.key >= 0) && 
				(this.caret.thingy instanceof YOURX.ContainerThingy); 			
	};

	AvixEditor.prototype.caretInContent = function(){ //key numerical, positive and thingy is content
		return 	(!isNaN(this.caret.key)) && 
				(this.caret.key >= 0) && 
				(this.caret.thingy instanceof YOURX.ContentThingy); 			
	};

	AvixEditor.prototype.caretInAttributes = function(){ //key is a string
		return isNaN(this.caret.key);
	};
	
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
	};

	AvixEditor.prototype.setFieldText = function(newtext){
		if(this.caretInName()){
			var parentelement = (this.caret.thingy instanceof YOURX.AttributeThingy ? this.getParent(this.caret.thingy) : null);
			if(parentelement){ //handle case that attribute is parented and name table needs updating
				parentelement.renameAttribute(this.caret.thingy.getName(),newtext);
			}
			else{ //just rename directly
				this.caret.thingy.setName(newtext);				
			}
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
	};
			
	AvixEditor.prototype.refreshCursor = function(){
		//calculate new selection (element which will be contenteditable) and position (location of cursor in final Range call)
		var boundselection = this.getBoundSelection(this.caret.thingy);
		var neweditableselection = null;
		var neweditableposition = null;
		if(this.caretInName()){ //position cursor in text node of the name   
			neweditableselection = this.queryNameWrapper(boundselection);
			neweditableposition = this.caret.thingy.name.length + this.caret.key + 1; //expecting negative value of key
		}	
		else if(this.caretInContent()){ //position cursor in text node of the content  
			neweditableselection = this.queryContentWrapper(boundselection);
			neweditableposition = this.caret.key; //expecting positive value of key
		}
		else if(this.caretInDescendants()){ //place cursor among descendant characters or child elements
			neweditableselection = this.queryDescendantWrapper(boundselection);
			neweditableposition = this.caret.key;				
		}
		else if(this.caretInAttributes()){ //place cursor after attribute
			var att = this.caret.thingy.getAttributeThingy(this.caret.key);
			var attselection = this.getBoundSelection(att);
			var elementselection = this.getBoundSelection(this.getParent(att));
			neweditableselection = this.queryOpenWrapper(elementselection);
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
			
		/** Note this from http://www.w3.org/TR/2000/REC-DOM-Level-2-Traversal-Range-20001113/ranges.html
		 * It is also possible to set a Range's position relative to nodes in the tree:
		 *   void setStartBefore(in Node node); raises(RangeException);
		 *   void setStartAfter(in Node node); raises(RangeException);
		 *   void setEndBefore(in Node node); raises(RangeException);
		 *   void setEndAfter(in Node node); raises(RangeException);
		 */
			
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
	};


	;(function(){
		
		//TODO Puzzle through issue with attributes dynamically changing name during edit, 
		//whilst the key against which they are stored in the element DOES NOT change, creating an inconsistent model
		//see Element#addAttribute(...)

		var keeppattern = function(match){
			var newtext = match;
			var oldtext = this.getFieldText();
			if(newtext != oldtext){
				var growth = newtext.length - oldtext.length;
				this.setFieldText(newtext);
				if(this.caretInContent()){ // caretInName() reverse numbered so no increment
					this.setCaret(this.caret.thingy, this.caret.key + growth); //setField and this may trigger a double refreshCursor call
				}
			}
		};

		//define character patterns against focus position
		var treelogic = {};
		
		treelogic.container = {
			descendants:{ //cursor is in between some descendants (key is position)
				patterns:{
					//no keeppattern
					"<":function(){ //create element and focus name
						var el = new YOURX.ElementThingy(""); //blank name to begin
						this.caret.thingy.addThingy(el);
						this.setCaret(el,-1);
					}					
				}
			}				
		};
		treelogic.element = {
			name:{ //cursor is in the name string (key is negative)
				patterns:{
					"^[A-Za-z]+$":keeppattern, //field matches
					">":function(){ //focus content
						this.setCaret(this.caret.thingy,0);
					},
					"\\s":function(){ //new attribute and focus name
						var att = new YOURX.AttributeThingy("",""); //blank name and value to begin
						this.caret.thingy.addThingy(att);
						this.setCaret(att,-1);
					}									
				}
			}, 
			attributes:{ //cursor is in between some attributes (key names attribute preceding)
				patterns:{
					//no keeppattern
					"\\s":function(){ //new attribute and focus name
						var att = new YOURX.AttributeThingy("",""); //blank name and value to begin
						this.caret.thingy.addThingy(att);
						this.setCaret(att,-1);
					},
					">":function(){ //focus in content
						this.setCaret(this.caret.thingy,0);
					}								
				}
			},
			descendants: {
				patterns:YOURX.copyProperties(treelogic.container.descendants.patterns, //merge with container descendants
				{ 
					//no keeppattern
					"[^<]": function(match){ //also allow text in an element tag
						var tx = new YOURX.TextThingy(match);
						this.caret.thingy.addThingy(tx);
						this.setCaret(tx, 1);
					}
				})
			}
		};
		
		treelogic.attribute = {
			name:{ //cursor is in name
				patterns:{
					"^[A-Za-z]+$":keeppattern,
					"=":function(){
						this.setCaret(this.caret.thingy,0);//move to content
					}				
				}
			},
			content:{ //cursor is in value
				patterns:{
					'^[^"]*$':keeppattern,
					'"':function(){ //attribute and element closed
						var attname = this.caret.thingy.name; //current attribute's name
						this.setCaret(this.getParent(this.caret.thingy),attname); //focus after the attribute
					}																	
				}
			}
		};
		
		treelogic.text = {
			content:{ //cursor is in content
				patterns:{
					"^[^<>]*$":keeppattern,
					"<":function(){ //add element to parent after your position
						var el = new YOURX.ElementThingy();
						var txpos = this.getPosition(this.caret.thingy);
						this.getParent(this.caret.thingy).addThingy(el, txpos + 1);
						this.setCaret(el,-1);
					}	,			
					">":function(){ //move focus beyond current text into grandparent 
						//TODO CH establish editor functions focusBefore() focusAfter()   
						var text = this.caret.thingy;
						var parent = this.getParent(text);
						if(parent){
							var grandparent = this.getParent(parent);
							if (grandparent) {
								var pos = this.getPosition(parent);
								this.setCaret(grandparent, pos + 1);															
							}
						}
					}				
				}
			}
		};

		//TODO express navlogic actions for non-character keycodes

		var nav = {
			backspace:{
				name:"Backspace",
				action:function(){
					//TODO consider use of CTRL to override non-empty protection
					if(this.caretInName() || this.caretInContent()){ //in some kind of field
						if(this.editableposition > 0){ //in middle of field
							//remove a character from the text
							var oldtext = this.getFieldText();
							var newtext = oldtext.slice(0,this.editableposition -1) + oldtext.slice(this.editableposition, oldtext.length);
							this.setFieldText(newtext);
							//move the cursor back one position
							this.setCaret(this.caret.thingy, this.caret.key - 1);
						}
						else if(this.editableposition == 0){ //at beginning of field
							if(this.getFieldText().length == 0){ //at start of empty field
								if(this.caretInContent()){ //it's a content field
									if(this.caret.thingy instanceof YOURX.ElementThingy || this.caret.thingy instanceof YOURX.AttributeThingy){
										//move the cursor into the name
										this.setCaret(this.caret.thingy, -1);
									}
									else if(this.caret.thingy instanceof YOURX.Text){
										//delete the thingy
										var parent = this.getParent(this.caret.thingy);
										var pos = this.getPosition(this.caret.thingy);
										parent.removeThingy(this.caret.thingy);
										//caret where text thingy was
										this.setCaret(parent,pos);
									}									
								}
								else if(this.caretInName()){ //it's a name field
									//CH TODO normalise Thingy deletion into a single function
									//delete the thingy
									var parent = this.getParent(this.caret.thingy);
									var pos = this.getPosition(this.caret.thingy);
									parent.removeThingy(this.caret.thingy);
									//caret where text thingy was
									this.setCaret(parent,pos);									
								}
							}
						}
					}
				}
			},
			del:{name:"Delete"},
			tab:{name:"Tab"},enter:{name:"Enter"},shift:{name:"Shift"},ctrl:{name:"Control"},alt:{name:"Alt"},escape:{name:"Escape"},
			pageup:{name:"Page Up"},pagedown:{name:"Page Down"},end:{name:"End"},home:{name:"Home"},
			left:{name:"Arrow Left"},up:{name:"Arrow Up"},right:{name:"Arrow Right"},down:{name:"Arrow Down"},
			f1:{name:"F1"},f2:{name:"F2"},f3:{name:"F3"},f4:{name:"F4"},f5:{name:"F5"},f6:{name:"F6"},
			f7:{name:"F7"},f8:{name:"F8"},f9:{name:"F9"},f10:{name:"F10"},f11:{name:"F11"},f12:{name:"F12"}
		};
		
		//keycode to key name mapping
		var navkeys = {
			8:nav.backspace,9:nav.tab,13:nav.enter,16:nav.shift,17:nav.ctrl,18:nav.alt,27:nav.escape,
			33:nav.pageup,34:nav.pagedown,35:nav.end,36:nav.home,37:nav.left,38:nav.up,39:nav.right,40:nav.down,
			46:nav.del,112:nav.f1,113:nav.f2,114:nav.f3,115:nav.f4,116:nav.f5,117:nav.f6,
			118:nav.f7,119:nav.f8,120:nav.f9,121:nav.f10,122:nav.f11,123:nav.f12
		};
		
		AvixEditor.prototype.treelogic = treelogic;
		AvixEditor.prototype.nav = nav;
		AvixEditor.prototype.navkeys = navkeys;
		
	})();

		
	//TODO handle non-character keycodes
	AvixEditor.prototype.handleKeypress = function(evt){
		//TODO refactor for efficiency by caching values and functions below
						
		//update the field text
		if(! (evt.which in this.nav)){

			//event will be interpreted - suppress browser behaviour (appending characters)
			evt.stopPropagation();
			evt.preventDefault();

			//calculate field after character added
			var charpressed = String.fromCharCode(evt.which);
			var oldtext = this.getFieldText();
			var newtext;
			if(oldtext && oldtext != ""){ //insert in existing text
				newtext = oldtext.slice(0,this.editableposition) + charpressed + oldtext.slice(this.editableposition, oldtext.length);
			}
			else{ //no existing text
				newtext = charpressed;
			}
			
			//TODO split into type logic and caret logic for different levels
			//of route to pattern map
			var patterns = null;
			if(this.caret.thingy instanceof YOURX.RootThingy){
				if(this.caretInDescendants()){ patterns = this.treelogic.container.descendants.patterns;}
				else{throw new Error("RootThingies only have descendants.");}
			}
			else if(this.caret.thingy instanceof YOURX.ElementThingy){
				if(this.caretInName()){ patterns = this.treelogic.element.name.patterns;}
				else if(this.caretInAttributes()){ patterns = this.treelogic.element.attributes.patterns;}
				else if(this.caretInDescendants()){ patterns = this.treelogic.element.descendants.patterns;}
				else{throw new Error("ElementThingies only have names, attributes and descendants.");}
			}
			else if(this.caret.thingy instanceof YOURX.AttributeThingy){
				if(this.caretInName()){ patterns = this.treelogic.attribute.name.patterns;}
				else if(this.caretInContent()){ patterns = this.treelogic.attribute.content.patterns;}
				else{throw new Error("AttributeThingies only have a name and value.");}
			}
			else if(this.caret.thingy instanceof YOURX.TextThingy){ 
				if(this.caretInContent()){ patterns = this.treelogic.text.content.patterns; }
				else{ throw new Error("TextThingies only have a value.");}
			}
			
			if(patterns != null){
				//keys are regexp matches, values are functions 
				for(var pattern in patterns){ //trigger function against first matching pattern and return
					var regexp = new RegExp(pattern);
					var matches = newtext.match(regexp);
					if(matches && matches.length > 0){
						patterns[pattern].apply(this,[matches[0]]); //execute matching function
						return;
					}
				} //fallthrough to error condition
				throw new Error("Invalid character inserted, no matches available.");			
			}
			else{
				throw new Error("No patterns available");
			}			
		}
	};

	return eval(YOURX.writeScopeExportCode([
		'OperationCaret','ThingyOperation','ThingyAddition','ThingyDeletion','AvixEditor'
	]));	
	
}();
