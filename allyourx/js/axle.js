/** AXLE is the home for components coordinating the Schema (YOURX) and View (ALLY) libraries, adding the handling of mouse
 * and keyboard events to create a schema-driven editor.
 *  
 * OperationCaret provides a logic 'model' for schema driven editing, indicating what operations are available. 
 * It incorporates conventions for representing _focus_ and _change operations_ in trees of Thingies.
 * 
 * AvixEditor is an example editor extending ALLY.XmlView with smart autocompletion behaviours driven by keyboard text entry. 
 * It draws heavily on the YOURX.ThingyTracker tree-monitoring, querying and metadata storage structure.
 * 
 * Focus within a tree is represented by a caret pair, combining a thingy, and a key.
 * The Thingy is the item in focus and the key represents the relative position of the cursor within the thingy.
 * Keys are drawn from a set combining the integer number line and the space of all possible text strings, which map as follows.
 * 
 * Elements :
 * 	Integers	[ Negative => name] [ Zero or positive => child position in descendants]
 * 	Strings		[QName => Named attribute in open tag] [special value '>' => end of open tag]
 * 
 * Attribute :   
 * 	Integers	[ Negative => name] [ Zero or positive => character position in value] 
 *	Strings		[ N/A ]
 * 
 * Text :
 * 	Integers	[ Less than zero => N/A ] [ Zero or positive => character position in value]
 * 	Strings		[ N/A ] 
 * 
 * Operations are provided to define relations between caret positions, such as preceding and following.
 * Further operations allow the deletion of items at a caret position. In the long run, selections
 * and ThingyOperations will all rely on the definition of caret position.
 * 
 */
AXLE = function(){	
	
	/** 
	 * @param {Thingy} parentthingy A parent thingy which, it is assumed, shallow-validates 
	 * against the corresponding ThingyRule in the grammar, as do all its ancestors and preceding siblings.
	 * @param {ThingyRule} parentrule The corresponding ThingyRule which parentthingy satisfies.
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
	 * to get information, those callbacks may be served as a dialog or other form of user interface.
	 * 
	 * The getInvoluntaryOperation() method will return a series of atomic operations until the Tree passes shallow validation. If no 
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
	
	//TODO consider how, in the future, OperationCaret could bind within ContentThingies (Attributes and Text) 
	//where validation rules are highly granular (e.g. RegExp)
	// Position cld be character position? What is name hashmap for? 
	
	//TODO position representation for large number of positions (e.g. text blocks) could be more efficient 
	//using integers/arrays than strings/hashmap
	
	//TODO handle the issue that keys have to be of type string in order to index properties
	//but need to be numbers and strings to be used elsewhere, (perhaps this is already implicitly addressed)

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
		if("getChildren" in thingy){
			thingy.unbind('childadded',this.treeUpdatedListener);
			thingy.unbind('childremoved',this.treeUpdatedListener);
		}
		if("getAttributes" in thingy){				 
			thingy.unbind('attributeadded',this.treeUpdatedListener);
			thingy.unbind('attributeremoved',this.treeUpdatedListener);
		}				
	};

	/** Used to configure the parentthingy of the OperationCaret. In principle this containment 
	 * means an OperationCaret can be reused for multiple points in the tree, although
	 * this should be tested, and is perhaps of questionable value compared to a clean object. 
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
	};
	
	/** Used to configure the parentrule of the OperationCaret. In principle this means
	 * that an OperationCaret can be reused through different validation scenarios for the 
	 * same thingy, although this should be tested, and is perhaps of questionable value compared to a clean object. 
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
	};
	
	/** Returns the parentthingy which this OperationCaret is testing validity for.*/
	OperationCaret.prototype.getParentThingy = function(){
		return this.parentthingy;
	};

	/** Returns the parentrule which this OperationCaret is validating against.*/
	OperationCaret.prototype.getParentRule = function(){
		return this.parentrule;
	};
	
	/** Refreshes the set of possible valid operations on the current parentthingy given
	 * the current parentrule. Typically this is re-executed after every change in 
	 * the tree. It will either create a set of involuntary operations if the tree is not 
	 * yet valid, or voluntary ones if the tree is valid but optional operations are 
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
			caretwalker.nameAccepted=function(name,rule){ /* do nothing */};
			caretwalker.nameRejected=function(name,rule){ 
				caretthis.involuntaryoperations[name] = new ThingyDeletion(rule); 
				throw opfound;
			};
			caretwalker.nameRequired=function(name,rule){ 
				caretthis.involuntaryoperations[name] = new ThingyAddition(rule); 
				throw opfound;
			};
			caretwalker.posAccepted=function(pos,rule){ /* do nothing */};
			caretwalker.posRejected=function(pos,rule){ 
				caretthis.involuntaryoperations[pos] = new ThingyDeletion(rule); 
				throw opfound;
			};
			caretwalker.posRequired=function(pos,rule){ 
				caretthis.involuntaryoperations[pos] = new ThingyAddition(rule); 
				throw opfound;
			};
			
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
	};	
	
	/** Gets an involuntary operation against a given key
	 * @param {integer,string} key The key for the operation, which may be an 
	 * attribute name (string) or an child position (integer) 
	 */
	OperationCaret.prototype.getInvoluntaryOperation = function(key){
		return this.involuntaryoperations[key];
	};
	
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
	};
	
	/** A ThingyOperation represents a change to the children or attributes of the thingy. 
	 * @param {Object} rule The rule which this operation attempts to satisfy.
	 */
	function ThingyOperation(rule){
		this.rule = rule;
	}
	/** @return {String} The text label which should be shown to describe this operation */
	ThingyOperation.prototype.getLabel = function(){
		throw new YOURX.UnsupportedOperationError("getLabel() is not yet implemented for this Operation");	
	};		
	/** @return {boolean} True iff the operation needs user input to proceed. */
	ThingyOperation.prototype.isInteractive = function(){
		throw new YOURX.UnsupportedOperationError("isInteractive() is not yet implemented for this Operation");
	};

	/** Triggers non-interactive operations
	 */
	ThingyOperation.prototype.act = function(parentthingy, key){
		throw new YOURX.UnsupportedOperationError("act() is not implemented for this Operation. Check the value of isInteractive()");
	};

	/** Triggers interactive operations
	 * Fires requests to get user input until sufficient unknowns have been provided to proceed.
	 * Operations which represent a compound set may pass the user object to their components.
	 * @param {YOURX.User} user
	 */
	ThingyOperation.prototype.interact = function(parentthingy, key, user){
		throw new YOURX.UnsupportedOperationError("interact() is not implemented for this Operation. Check the value of isInteractive().");
	};
			
	/** @param {ThingyRule} rule The rule which this Deletion is trying to satisfy */
	function ThingyDeletion(rule){
		ThingyOperation.apply(this,arguments);
	}
	ThingyDeletion.prototype = new ThingyOperation();
	ThingyDeletion.prototype.isInteractive = function(){
		return false; //all scenarios for v001 are non-interactive
	};
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
	};
	
	/** @param {ThingyRule} rule The rule which this Expansion is trying to satisfy */
	function ThingyAddition(rule){
		ThingyOperation.apply(this,arguments);
	}
	ThingyAddition.prototype = new ThingyOperation();
	ThingyAddition.prototype.isInteractive = function(){
		return false; //all scenarios for v001 are non-interactive
	};
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
	};
		
	
	/** AvixEditor is wired into mouse and keyboard eventing and triggers changes to the ThingyTree
	 * or navigation operations depending where the caret and cursor is, and which characters are hit.
	 */ 
	
	/** Alternate names; Exemplar, FixEditor, PoxEditor */
	function AvixEditor(){
		ALLY.XmlView.apply(this,arguments);
		this.keyPressedListener = YOURX.ThingyUtil.methodHandoffFunction(this, "handleKeypress");
		this.keyDownListener = YOURX.ThingyUtil.methodHandoffFunction(this, "handleKeydown");
	}
	AvixEditor.prototype = new ALLY.XmlView();
	
	//TODO set editor caret based on mouse click in DOM
	
	AvixEditor.prototype.trackThingy= function(thingy){
		ALLY.XmlView.prototype.trackThingy.apply(this,arguments); //superclass call
		var boundselection = this.getBoundSelection(thingy);
		boundselection.bind("keypress",this.keyPressedListener);
		boundselection.bind("keydown",this.keyDownListener);
	};

	AvixEditor.prototype.untrackThingy= function(thingy){
		var boundselection = this.getBoundSelection(thingy);
		boundselection.unbind("keypress",this.keyPressedListener);
		boundselection.unbind("keydown",this.keyDownListener);
		ALLY.XmlView.prototype.untrackThingy.apply(this,arguments); //superclass call
	};

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

	AvixEditor.prototype.caretInName = function(targetcaret){ //key is numerical and negative
		if(arguments.length === 0) targetcaret = this.caret;
		return 	( !isNaN(targetcaret.key) ) && 
				(targetcaret.key < 0); 
	};

	AvixEditor.prototype.caretInDescendants = function(targetcaret){ //key numerical, positive and thingy is container
		if(arguments.length === 0) targetcaret = this.caret;
		return 	(!isNaN(targetcaret.key) ) && 
				(targetcaret.key >= 0) && 
				(targetcaret.thingy instanceof YOURX.ContainerThingy); 			
	};

	AvixEditor.prototype.caretInContent = function(targetcaret){ //key numerical, positive and thingy is content
		if(arguments.length === 0) targetcaret = this.caret;
		return 	(!isNaN(targetcaret.key)) && 
				(targetcaret.key >= 0) && 
				(targetcaret.thingy instanceof YOURX.ContentThingy); 			
	};

	AvixEditor.prototype.caretInAttributes = function(targetcaret){ //key is a string
		if(arguments.length === 0) targetcaret = this.caret;
		return isNaN(targetcaret.key);
	};

	AvixEditor.prototype.precedingDescendantKey = function(targetcaret){
		if(targetcaret.key > 0){
			return targetcaret.key - 1;
		}
		return null;
	};
	
	AvixEditor.prototype.followingDescendantKey = function(targetcaret){
		if(targetcaret.thingy.getChildren().length > targetcaret.key){
			return targetcaret.key + 1;
		}
		return null;
	};
	
	AvixEditor.prototype.precedingNameKey = function(targetcaret){
		if(targetcaret.key >= - targetcaret.thingy.getName().length){
			return targetcaret.key - 1;
		}
		return null;
	};

	AvixEditor.prototype.followingNameKey = function(targetcaret){
		if(targetcaret.key < -1){
			return targetcaret.key + 1;
		}
		return null;
	};

	AvixEditor.prototype.precedingContentKey = function(targetcaret){
		if(targetcaret.key > 0){
			return targetcaret.key - 1;
		}
		return null;
	};

	AvixEditor.prototype.followingContentKey = function(targetcaret){
		if(targetcaret.key < targetcaret.thingy.getValue().length){
			return targetcaret.key + 1;
		}
		return null;
	};

	AvixEditor.prototype.precedingAttributeKey = function(targetcaret){
		var attnames = this.orderedAttributeNames(targetcaret.thingy);
		var attpos = attnames.indexOf(targetcaret.key) - 1;
		if(attpos > 0){
			return attnames[attpos];
		}
		return null;
	};

	AvixEditor.prototype.followingAttributeKey = function(targetcaret){
		var attnames = this.orderedAttributeNames(targetcaret.thingy);
		var attpos = attnames.indexOf(targetcaret.key) + 1;
		if(attpos < attnames.length){
			return attnames[attpos];
		}
		return null;
	};
	
	AvixEditor.prototype.leftmostKey = function(thingy){
		if(thingy instanceof YOURX.ElementThingy || thingy instanceof YOURX.AttributeThingy){ //start of name
			return -1 - thingy.getName().length; 
		}
		else if(thingy instanceof YOURX.RootThingy || thingy instanceof YOURX.TextThingy){ //start of content/children
			return 0;
		}
		else{
			throw new Error("Unexpected thingy type");
		}
	};

	AvixEditor.prototype.rightmostKey = function(thingy){
		if(thingy instanceof YOURX.ElementThingy || thingy instanceof YOURX.RootThingy){ //end of children
			return thingy.getChildren().length;
		}
		else if(thingy instanceof YOURX.TextThingy || thingy instanceof YOURX.AttributeThingy){ //end of content 
			return thingy.getValue().length;
		}
		else{
			throw new Error("Unexpected thingy type");
		}
	};
	
	AvixEditor.prototype.getPrecedingCaret = function(targetcaret){

		//if no caret specified then use current editor caret
		if(arguments.length == 0){
			targetcaret = this.caret;
		}
				
		/*identify which type caret has*/
		var inname = this.caretInName(targetcaret);
		var incontent = (inname) ? false : this.caretInContent(targetcaret);
		var indescendants = (inname || incontent) ? false : this.caretInAttributes(targetcaret);
		var inattributes = (inname || incontent || indescendants) ? false : this.caretInAttributes(targetcaret);
		
		/*try to get preceding key of current caret type where applicable */
		var newkey = null, newthingy = null; 
		if (inname) { newkey = this.precedingNameKey(targetcaret); }
		else if (incontent) { newkey = this.precedingContentKey(targetcaret); }
		else if (inattributes) { newkey = this.precedingAttributeKey(targetcaret); }
		else if (indescendants) { newkey = this.precedingDescendantKey(targetcaret);}

		if(newkey !== null){ //preceding key is found at current level
			if(inname || incontent){ //caret has same scope, use key within existing scope
				return {thingy:targetcaret.thingy,key:newkey};
			}
			else if(inattributes || indescendants){ //caret has new scope, use key to retrieve it
				var newthingy = targetcaret.thingy.getThingy(newkey);
				return {thingy:newthingy,key:this.rightmostKey(thingy)};
			}
		}
		else { //handle cases where key range is exhausted
			if(	inname || //at start of attribute or element name
				(incontent && targetcaret.thingy instanceof YOURX.TextThingy)){ //at start of text content
				//step up to child's position within parent
				return {thingy:this.getParent(targetcaret.thingy),key:this.getPosition(targetcaret.thingy)}; //ascend to parent
			}
			else if( incontent && targetcaret.thingy instanceof YOURX.AttributeThingy){ //at start of attribute content
				//go to end of name
				return {thingy:targetcaret.thingy, key:-1}; 
			}
			else if( indescendants ){ //at start of element children
				var numatts = targetcaret.thingy.getAttributes().length;
				if(numatts > 0){ //get last attribute
					var attname = this.orderedAttributeNames(targetcaret.thingy)[numatts-1];
					return rightmostCaret(targetcaret.thingy.getAttribute(attname)); //go to end of attribute content
				}
				else{//no attributes, go to end of name
					return {thingy:targetcaret.thingy,key:-1}; 
				}				
			}			
		}
		
		return null; //if none of the above can find a preceding caret, then give up
	};
	
	AvixEditor.prototype.getFollowingCaret = function(targetcaret){
		
		//if no caret specified then use current editor caret
		if(arguments.length == 0){
			targetcaret = this.caret;
		}
				
		/*identify which type caret has*/
		var inname = this.caretInName(targetcaret);
		var incontent = (inname) ? false : this.caretInContent(targetcaret);
		var indescendants = (inname || incontent) ? false : this.caretInAttributes(targetcaret);
		var inattributes = (inname || incontent || indescendants) ? false : this.caretInAttributes(targetcaret);
		
		/*try to get preceding key of current caret type where applicable */
		var newkey; 
		if (inname) { newkey = this.followingNameKey(targetcaret); }
		else if (incontent) { newkey = this.followingContentKey(targetcaret); }
		else if (indescendants) { newkey = this.followingDescendantKey(targetcaret); }		
		else if (inattributes) { newkey = this.followingAttributeKey(targetcaret); }

		/* if corresponding key available, caret can be returned */
		if(newkey != null){
			if(inname || incontent){ //simply step forward in same field
				return {thingy:targetcaret.thingy,key:newkey};
			}
			else if(inattributes || indescendants){ //step forward into preceding attribute or descendant
				return leftmostCaret(targetcaret.thingy.getThingy(newkey));
			}
		}
		/* handle cases where current caret type is exhausted */
		else{
			if(inname){
				if(targetcaret.thingy instanceof YOURX.ElementThingy){ 
					var numatts = targetcaret.thingy.getAttributes().length;
					if(numatts > 0){
						var attname = this.orderedAttributeNames(targetcaret.thingy)[0];
						return this.leftmostCaret(targetcaret.thingy.getAttribute(attname)); //step into first attribute
					}
					else{
						return {thingy:targetcaret.thingy, key:0}; //descend to first child 
					}
				}
				else if (targetcaret.thingy instanceof YOURX.AttributeThingy) {
					return {thingy:targetcaret.thingy, key:0}; //step over to start of content
				} 
			}
			//TODO CH work out conditions for ascending/descending
			//descend when
			//		at end of element name or last attribute
			//		...
			
		}
		
		return null; //if none of the above can find a preceding caret, then give up
	};	
	
	AvixEditor.prototype.getFieldText = function(targetcaret){
		if(arguments.length == 0) targetcaret = this.caret;		
		if(this.caretInName(targetcaret)){
			return targetcaret.thingy.getName();
		}
		else if(this.caretInContent(targetcaret)){
			return targetcaret.thingy.getValue();
		}
		else if(this.caretInDescendants(targetcaret) || this.caretInAttributes(targetcaret)){
			return ""; //only a placeholder
		}
		else throw new Error("Unexpected caret status");
	};

	/** N.B. This does not cause the caret to be updated, so it may be at an 
	 * invalid value after the content is changed.
	 * @param newtext
	 * @param targetcaret
	 */
	AvixEditor.prototype.setFieldText = function(newtext, targetcaret){
		if(arguments.length === 1) var targetcaret = this.caret;
		if(this.caretInName(targetcaret)){
			var parentelement = (targetcaret.thingy instanceof YOURX.AttributeThingy ? this.getParent(targetcaret.thingy) : null);
			if(parentelement){ //handle case that attribute is parented and name table needs updating
				parentelement.renameAttribute(targetcaret.thingy.getName(),newtext);
			}
			else{ //just rename directly
				targetcaret.thingy.setName(newtext);
			}
		}
		else if(this.caretInContent(targetcaret)){
			targetcaret.thingy.setValue(newtext);
		}
		else if(this.caretInDescendants(targetcaret) || this.caretInAttributes(targetcaret)){
			if(newtext != ""){
				throw new Error("Cannot assign text directly to a container");
			}
		}
		else throw new Error("Unexpected caret status");
		
	};
				
	/** Given a Thingy caret (identifying a 'focus thingy' and relative position within the ThingyTree)
	 * this creates the corresponding data structure identifying a document element 
	 * and a position within the document element where the 'contenteditable' cursor should be placed. 
	 * Currently, the cursor just provides a visual indicator to the user, as all keypresses are 
	 * intercepted and default browser behaviour (to add character content) is overridden.
	 * TODO The default behaviour could be reinstated for efficiency when updating large text blocks.
	 * @param targetcaret
	 * @return cursor
	 */
	AvixEditor.prototype.calculateCursor = function(targetcaret){
		
		//calculate new selection (element which will be contenteditable) and position (location of cursor in Range call)
		var cursor = {
			selection:null,position:null
		};
		var boundselection = this.getBoundSelection(targetcaret.thingy);
		if(this.caretInName(targetcaret)){ //position cursor in text node of the first name node
			cursor.selection = this.queryNameWrapper(boundselection).filter(":first");
			cursor.position = targetcaret.thingy.name.length + targetcaret.key + 1; //expecting negative value of key
		}	
		else if(this.caretInContent(targetcaret)){ //position cursor in text node of the content  
			cursor.selection = this.queryContentWrapper(boundselection);
			cursor.position = targetcaret.key; //expecting positive value of key
		}
		else if(this.caretInDescendants(targetcaret)){ //place cursor among descendant characters or child elements
			cursor.selection = this.queryDescendantWrapper(boundselection);
			cursor.position = targetcaret.key;				
		}
		else if(this.caretInAttributes(targetcaret)){ //place cursor after attribute
			var att = targetcaret.thingy.getAttributeThingy(targetcaret.key);
			var attselection = this.getBoundSelection(att);
			var elementselection = this.getBoundSelection(this.getParent(att));
			cursor.selection = this.queryOpenWrapper(elementselection);
			cursor.position = cursor.selection.children().index(attselection) + 1;
		}
		
		return cursor;
		
	};
			
	AvixEditor.prototype.refreshCursor = function(){
		var neweditable = this.calculateCursor(this.caret);
		
		//update to the new new selection and position
		if((neweditable.selection !== null) && (neweditable.position !== null)){

			//move selection (cursor)
			
			//choose anchor node
			var anchornode;
			var contentsq = neweditable.selection.contents();
			if(contentsq.size()==0){
				anchornode = neweditable.selection.get(0);
			}
			else{
				anchornode = contentsq.get(0);
			}

			/*
			// CH do we need this distinction, or can we always use neweditable.selection[0] ?
			var anchornode = null; 
			if(this.caretInName() || this.caretInContent()){ //character position in first DOM child (text node)
				anchornode = neweditable.selection.contents()[0];
			}
			if(this.caretInDescendants() || this.caretInAttributes()){ //child position in parent DOM element 
				anchornode = neweditable.selection[0];
			}
			*/
			
		/** Note this from http://www.w3.org/TR/2000/REC-DOM-Level-2-Traversal-Range-20001113/ranges.html
		 * It is also possible to set a Range's position relative to nodes in the tree:
		 *   void setStartBefore(in Node node); raises(RangeException);
		 *   void setStartAfter(in Node node); raises(RangeException);
		 *   void setEndBefore(in Node node); raises(RangeException);
		 *   void setEndAfter(in Node node); raises(RangeException);
		 */
			
			//TODO: Below implementation dependent on W3C - will break in IE
			
			//position cursor
			
			//create a new range
			var winselection = window.getSelection();
			var range = document.createRange();
			
			//configure the range
			range.setStart(anchornode, neweditable.position);
			range.collapse(true);
			/** CH looks like the above is equivalent according to https://developer.mozilla.org/en/DOM/range.collapse
			range.setEnd(anchornode, neweditable.position);
			*/
						
			//control which elements are editable and force focus change
			var EDITABLEATTR = "contenteditable";
			
			//reset contenteditable flags in the editor tree
			var rootselection = this.getBoundSelection(this.getRoot(this.caret.thingy));
			rootselection.find(EDITABLEATTR).removeAttr(EDITABLEATTR);
			rootselection.attr(EDITABLEATTR,"true"); //elements below inherit by default

			//TODO can avoid this if selections are equal
			if(this.editable && this.editable.selection){
				//this.editable.selection.children().andSelf().removeAttr(EDITABLEATTR); //strip old assignments from self and children
				this.editable.selection.blur();
			}
			//neweditable.selection.attr(EDITABLEATTR,"true"); //ensure element editable
			//neweditable.selection.children().attr(EDITABLEATTR,"inherit"); //ensure children not editable
			
			//reset range to newly calculated range
			winselection.removeAllRanges();
			winselection.addRange(range);

			neweditable.selection.focus();

			//store new values
			this.editable = neweditable;
		}
	};
	
	//TODO consider use of CTRL to override non-empty protection
	//TODO consider use of ranges to indicate staged deletions arising
	//(deleting element means deleting children and attributes)
	//TODO simplify using preceding/following/sibling caret logic
	AvixEditor.prototype.deleteCaret = function(targetcaret){
		
		var newcaret = null;
				
		//if no caret specified then use current editor caret
		if(arguments.length == 0){
			targetcaret = this.caret;
		}
				
		
		if(this.caretInName(targetcaret) || this.caretInContent(targetcaret)){
			//it's an editable character field
			var targeteditable = this.calculateCursor(targetcaret);
			//remove a character from the text
			var oldtext = this.getFieldText(targetcaret);
			var newtext = oldtext.slice(0,targeteditable.position) + oldtext.slice(targeteditable.position+1, oldtext.length);
			//update the field text to match
			this.setFieldText(newtext, targetcaret);
		}
		
		//if caret not in a field, or if text field has been made empty
		//then remove thingy from tree
		if(	this.caretInAttributes(targetcaret) || 
			this.caretInDescendants(targetcaret) ||
			((targetcaret.thingy instanceof YOURX.TextThingy) && (this.getFieldText(targetcaret).length === 0))){
			//work out new caret position and delete item at old position
			newcaret = this.getPrecedingCaret(targetcaret); 
			this.getParent(targetcaret.thingy).removeThingy(targetcaret.thingy); 
		}

		//lazy populate newcaret
		if(newcaret === null){
			if(this.caretInName(targetcaret)){
				//field is one character shorter
				//negatively-indexed name carets will reduce by one
				newcaret = this.getFollowingCaret(targetcaret)
			}
			else{
				//fall through to default caret
				newcaret = targetcaret;
			}
		}
		
		return newcaret;

	}

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
				if(this.caretInContent()){ 
					//content field has been extended
					this.setCaret(this.caret.thingy, this.caret.key + growth); 
				}
				else{
					// caretInName() reverse numbered so caret unchanged, 
					// but cursor in dom needs refresh anyway
					//this.refreshCursor();
					this.setCaret(this.caret);
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
					"[^<>]": function(match){ //also allow text in an element tag
						//try to find text node first
						var children,textchild;
						if((children=this.caret.thingy.getChildren()).length > 0 && 
							children[this.caret.key] instanceof YOURX.TextThingy){
							//if text node exists use it
							textchild = children[this.caret.key];
						}
						else{
							//create a new blank text thingy
							textchild = new YOURX.TextThingy("");
							this.caret.thingy.addThingy(textchild,this.caret.key);
						}
						//insert matched character and place caret after
						textchild.setValue(match + textchild.getValue());
						this.setCaret(textchild, 1);
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

		var nav = { //handlers for symbolically named operations on the document
			left:{
				name:"Arrow Left",
				action:function(){ 
					var newcaret = this.getPrecedingCaret();
					if(newcaret !== null ) {
						this.setCaret(newcaret); 
					}
				}
			},
			right:{
				name:"Arrow Right",
				action:function(){ 
					var newcaret = this.getFollowingCaret();
					if(newcaret !== null ) {
						this.setCaret(newcaret); 
					}
				}
			},
			up:{
				name:"Arrow Up",
				action:function(){ 
					var newcaret = this.getPrecedingSiblingCaret();
					if(newcaret !== null ) {
						this.setCaret(newcaret); 
					}
				}
			},
			down:{
				name:"Arrow Down",
				action:function(){ 
					var newcaret = this.getFollowingSiblingCaret();
					if(newcaret !== null ) {
						this.setCaret(newcaret); 
					}
				}
			},
			backspace:{
				name:"Backspace",
				action:function(){
					var precedingcaret = this.getPrecedingCaret(this.caret);
					if(precedingcaret !== null){
						var newcaret = this.deleteCaret(precedingcaret);
						if(newcaret !== null){
							this.setCaret(newcaret);
						}
						else{
							throw new Error("No caret returned by deleteCaret()");
						}
					}
					else{
						throw new Error("No caret returned by getPrecedingCaret()");
					}
				}
			},
			del:{
				name:"Delete",
				action:function(){
					var newcaret = this.deleteCaret(this.caret); 
					if(newcaret !== null){
						this.setCaret(newcaret);
					}
					else{
						throw new Error("No caret returned by deleteCaret()");
					}
				}
			},
			tab:{name:"Tab"},enter:{name:"Enter"},shift:{name:"Shift"},ctrl:{name:"Control"},alt:{name:"Alt"},escape:{name:"Escape"},
			pageup:{name:"Page Up"},pagedown:{name:"Page Down"},end:{name:"End"},home:{name:"Home"},
			f1:{name:"F1"},f2:{name:"F2"},f3:{name:"F3"},f4:{name:"F4"},f5:{name:"F5"},f6:{name:"F6"},
			f7:{name:"F7"},f8:{name:"F8"},f9:{name:"F9"},f10:{name:"F10"},f11:{name:"F11"},f12:{name:"F12"}
		};
		
		//mapping from keycodes to symbolic editing operations
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

	/** Only keydown events are issued for control keys by at least some browsers, 
	 * meaning this logic cannot be in handleKeypress.
	 */
	AvixEditor.prototype.handleKeydown = function(evt){
		if (evt.keyCode in this.navkeys) { //found handler for special key
			var handler = this.navkeys[evt.keyCode]; 
			if("action" in handler){
				//key has been handled - suppress browser behaviour (appending characters)
				evt.stopPropagation();
				evt.preventDefault();
				//trigger handling behaviour
				handler["action"].apply(this);
			}
		}
	};
		
	AvixEditor.prototype.handleKeypress = function(evt){

		//update the field text

		//calculate field after character added
		var charpressed = String.fromCharCode(evt.which);
		var oldtext = this.getFieldText();
		var newtext;
		if(oldtext && oldtext != ""){ //insert in existing text
			newtext = oldtext.slice(0,this.editable.position) + charpressed + oldtext.slice(this.editable.position, oldtext.length);
		}
		else{ //no existing text
			newtext = charpressed;
		}

		//get the patterns which can handle keys on these types of element
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
		
		if(patterns !== null){

			//key expected to be handled - suppress browser behaviour (appending characters)
			evt.stopPropagation();
			evt.preventDefault();

			//keys are regexp matches, values are functions 
			for(var pattern in patterns){ //trigger function against first matching pattern and return
				var regexp = new RegExp(pattern);
				var matches = newtext.match(regexp);
				if(matches && matches.length > 0){
					
					
					//execute matching function
					patterns[pattern].apply(this,[matches[0]]); 

					//pattern found so terminate
					return;
				}
			} 
			
			//fallthrough to error condition
			throw new Error("Invalid character inserted, no matches available.");
			
		}
		else{
			throw new Error("No patterns available");
		}
		
	};

	return eval(YOURX.writeScopeExportCode([
		'OperationCaret','ThingyOperation','ThingyAddition','ThingyDeletion','AvixEditor'
	]));	
	
}();
