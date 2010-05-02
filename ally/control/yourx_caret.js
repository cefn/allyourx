YOURX.copyProperties(
	(function(){		
		/** 
		 * @param {Thingy} parentthingy A parent thingy which, along with all ancestors and preceding siblings, shallow-validates 
		 * against the corresponding ThingyRule in the grammar.
		 * @param {ThingyRule} parentrule The corresponding ThingyRule which parentthingy statisfies.
		 * 
		 * @classDescription  An OperationCaret applies to the attributes and children of one Thingy in an existing tree, 
		 * represented by 'parentthingy'. For the proper functioning of the OperationCaret it is assumed that all ancestors
		 * including the parentthingy, and all preceding sibling thingies have passed shallow validation (validation only at 
		 * their own level; e.g. rule#matchThingy(thingy, shallow=true) ).
		 * 
		 * Operations are expansions or contractions of the tree which can or must be executed 
		 * at a given position and which create or maintain a tree which will pass shallow validation for all attributes 
		 * and children of the parentthingy.
		 * 
		 * The OperationCaret monitors changing rule, attribute and child assignment to that Thingy
		 * and updates its estimate of available Operations accordingly.
		 *  
		 * You can use the OperationCaret to automatically construct one of two Operations for you.
		 * 
		 * The 'involuntary' operation will execute a set of changes which MUST be applied to a partially invalid tree in 
		 * order to make the tree pass shallow validation.
		 * 
		 * The 'voluntary' operation will execute a set of changes which MAY be applied to a valid tree
		 * such that it will still pass shallow validation.  
		 * 
		 * Each operation may have to be re-evaluated after a change to the Thingy tree, including the changes applied 
		 * by applying an Operation, so these results should not be cached.
		 * 
		 * Operations are composed from atomic ThingyAdditions, ThingyDeletions, and ThingyEdits, and may be aggregated
		 * using specialised subclasses of ThingyOperation representing a compound set.
		 * 
		 * ThingyOperations for which #isInteractive() returns false are deterministic enough to proceed
		 * without any user input, introducing or removing ElementThingy,AttributeThingy and TextThingy objects to the tree.
		 * 
		 * ThingyOperations for which #isInteractive() returns true require the user to make a selection, 
		 * or provide a value before they can proceed. Passing a user object into ThingyOperation's interactWithUser method 
		 * then triggers callbacks to get information.
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
		 * parallel expansions can creat ThingyEdits with a very large number of alternatives.
		 * 
		 */
		function OperationCaret(parentrule,parentthingy){
			this.setParentRule(parentrule);
			this.setParentThingy(parentthingy);
		}
		
		OperationCaret.prototype.nextInvoluntaryKey = function(){
			var key;
			for(key in this.involuntaryoperations){
				return key;
			}
			return null;
		};


		OperationCaret.prototype.nextInvoluntaryOperation = function(){
			var key = this.nextInvoluntaryKey();
			if(key){
				return this.involuntaryoperations[key];
			}
			else{
				return null;				
			}
		};
		
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
		
		OperationCaret.prototype.dispose = function(){
			
		}
		
		OperationCaret.prototype.getRecacheFunction = function(){
			//lazy create a function which causes 'this' to update operation cache
			//this is executed on any local change to the tree
			//future implementations can update operation cache more smartly
			var caretthis = this; //allows use of this in function closure
			return (this.refreshFunction ? this.refreshFunction : (this.refreshFunction = function(){caretthis.updateOperationCache();}));
		};
		
		OperationCaret.prototype.startListeningTo = function(thingy){
			var listener = this.getRecacheFunction();
			if("getChildren" in thingy){
				thingy.bind('childadded',listener);
				thingy.bind('childremoved',listener);
			}
			if("getAttributes" in thingy){				 
				thingy.bind('attributeadded',listener);
				thingy.bind('attributeremoved',listener);
			}
		};

		OperationCaret.prototype.stopListeningTo = function(thingy){
			var listener = this.getRecacheFunction();
			if("getChildren" in thingy){
				thingy.unbind('childadded',listener);
				thingy.unbind('childremoved',listener);
			}
			if("getAttributes" in thingy){				 
				thingy.unbind('attributeadded',listener);
				thingy.unbind('attributeremoved',listener);
			}				
		};

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
		OperationCaret.prototype.setParentRule = function(parentrule){
			this.parentrule = parentrule;
			if(this.parentrule){
				this.updateOperationCache();		
			}
			else{
				throw new Error("null parentrule set in OperationCaret");
			}
		}
		OperationCaret.prototype.getParentThingy = function(){
			return this.parentthingy;
		}
		OperationCaret.prototype.getParentRule = function(){
			return this.parentrule;
		}
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
				//terminate early when first operation is found
				try{
					YOURX.ThingyUtil.walkBelow(this.parentrule,this.parentthingy, caretwalker);
					
					//if this line is reached then there are no involuntary operations, 
					//can proceed to assess voluntary ones
	
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
		
		/** Gets an involuntary operation at a given position
		 * @param {integer,string} key The key for the operation, which may be an 
		 * attribute name (string) or an child position (integer) 
		 */
		OperationCaret.prototype.getInvoluntaryOperation = function(key){
			return this.involuntaryoperations[key];
		}
		
		OperationCaret.prototype.involuntaryKeys = function(filterfun){
		   var keys = [];
		   for(var key in this.involuntaryoperations){
		      if(!filterfun || filterfun(key)){
			      keys.push(key);
			  }
		   }
		   return keys;
		};

		OperationCaret.prototype.involuntaryAttributeKeys = function(){
			return this.involuntaryKeys(function(key){return isNaN(key);});
		};

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

		
		function ThingyOperation(rule){
			this.rule = rule;
		}
		/** @return {String} The text label which should be shown to describe this expansion */
		ThingyOperation.prototype.getLabel = function(){
			throw new YOURX.UnsupportedOperationError("getLabel() is not yet implemented for this Operation");	
		}		
		/** @return {boolean} Whether this operation needs user input to proceed*/
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
		/**
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
