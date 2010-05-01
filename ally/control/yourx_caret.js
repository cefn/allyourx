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

		OperationCaret.prototype.setParentThingy = function(parentthingy){
			if(this.parentthingy){ //already a previous parentthingy - unbind events
				if("getChildren" in this.parentthingy){
					this.parentthingy.unbind('childadded',this.updateOperationCache);
					this.parentthingy.unbind('childremoved',this.updateOperationCache);
				}
				if("getAttributes" in this.parentthingy){				 
					this.parentthingy.unbind('attributeadded',this.updateOperationCache);
					this.parentthingy.unbind('attributeremoved',this.updateOperationCache);
				}				
			}
			this.parentthingy = parentthingy;
			if(this.parentthingy){
				if("getChildren" in this.parentthingy){
					this.parentthingy.bind('childadded',this.updateOperationCache);
					this.parentthingy.bind('childremoved',this.updateOperationCache);
				}
				if("getAttributes" in this.parentthingy){				 
					this.parentthingy.bind('attributeadded',this.updateOperationCache);
					this.parentthingy.bind('attributeremoved',this.updateOperationCache);
				}
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
		
		OperationCaret.prototype.nextInvoluntaryOperation = function(){
			var key;
			for(key in this.involuntaryoperations){
				return this.involuntaryoperations[key];
			}
			return null;
		}
		
		OperationCaret.prototype.nextInvoluntaryKey = function(){
			var key;
			for(key in this.involuntaryoperations){
				return key;
			}
			return null;			
		}
		
		OperationCaret.prototype.doInvoluntaryOperation = function(){
			var key;
			for(key in this.involuntaryoperations){
				var op = this.involuntaryoperations[key];
				op.operate(this.parentthingy,key);
			}
			return null;			
		}
		
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
		/** This function will trigger interactive requests to get user input until 
		 * sufficient unknowns have been provided to proceed with the operation. 
		 * Operations which represent a compound set may pass the user object to their component ThingyEdits.
		 * @param {YOURX.User} user
		 */
		ThingyOperation.prototype.interactWithUser = function(user){
			throw new YOURX.UnsupportedOperationError("interactWithUser() is not yet implemented for this Operation");
		}
				
		/** @param {ThingyRule} rule The rule which this Deletion is trying to satisfy */
		function ThingyDeletion(rule){
			ThingyOperation.apply(this,arguments);
		}
		ThingyDeletion.prototype = new ThingyOperation();
		ThingyDeletion.prototype.isInteractive = function(){
			return false; //all scenarios for v001 are non-interactive
		}
		ThingyDeletion.prototype.operate = function(parentthingy, key){
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
		ThingyAddition.prototype.operate = function(parentthingy, key){
			if(this.rule instanceof YOURX.ElementThingyRule){
				if(typeof(key) === "number"){
					parentthingy.addChild(new ElementThingy(this.rule.getName()), key);
				}
				else{
					throw new Error("Key should be an integer number");
				}					
			}
			else if(this.rule instanceof YOURX.AttributeThingyRule){
				if(typeof(key) === "string"){
					parent.addAttribute(new AttributeThingy(key));
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
