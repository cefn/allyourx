YOURX.copyProperties(
	(function(){		
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
		 * Operations are expansions or contractions of the tree which can or must be executed  at a given position, creating
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
		 * parallel expansions can creat ThingyOperations which embody a very large number of alternative sub-operations.
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
		
		/** TODO, should be implemented to unbind all listeners and dispose of all returning references to this object which it
		 * has put in place to ensure it is garbage collected.
		 */
		OperationCaret.prototype.dispose = function(){
			
		}
				
		/** Binds changes in the thingy to a refresh of the operation cache. */
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
				
				//test to see if tree is not valid - i.e. involuntary operations are required
				
				//create ElementWalker which caches operations required at this level
				var caretwalker = new YOURX.ElementWalker();
				var opfound = {};
				caretwalker.nameAccepted=function(name,rule){ /* do nothing */}
				caretwalker.nameRejected=function(name,rule){ 
					caretthis.involuntaryoperations[name] = new YOURX.ThingyDeletion(rule); 
					throw opfound;
				}
				caretwalker.nameRequired=function(name,rule){ 
					caretthis.involuntaryoperations[name] = new YOURX.ThingyAddition(rule); 
					throw opfound;
				}
				caretwalker.posAccepted=function(pos,rule){ /* do nothing */}
				caretwalker.posRejected=function(pos,rule){ 
					caretthis.involuntaryoperations[pos] = new YOURX.ThingyDeletion(rule); 
					throw opfound;
				}
				caretwalker.posRequired=function(pos,rule){ 
					caretthis.involuntaryoperations[pos] = new YOURX.ThingyAddition(rule); 
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
			throw new YOURX.UnsupportedOperationError("isDeterministic() is not yet implemented for this Operation");
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
		
		return eval(YOURX.writeScopeExportCode([
			'OperationCaret','ThingyOperation','ThingyAddition','ThingyDeletion'
		]));
		
	}()),
	'YOURX'
);
