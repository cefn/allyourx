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
		 * or provide a value before they can proceed. Calling interactWithUser on such a ThingyOperation triggers callbacks
		 * on the user object to get information.
		 * 
		 * The getInvoluntaryOperation() function will return operations until the Tree passes shallow validation. If no 
		 * further operations are required to satisfy validation then it will return null;
		 * 
		 * The getVoluntaryOperation() function may return operations only if the Tree has already passed shallow validation,
		 * and may throw an exception if this is not the case. If all production rules are finite and already satisfied, 
		 * then it will return null;
		 * 
		 * @projectDescription Scenarios to note. Sequences of zeroOrMore element with no matching children
		 * are effectively active in parallel at the same caret position. Attribute rules are effectively 
		 * active in parallel. Any child rules of an Interleave structure are active in parallel. Highly 
		 * parallel expansions can creat ThingyEdits with a very large number of alternatives.
		 * 
		 */
		function OperationCaret(parentthingy, parentrule){
			this.setParentThingy(parentthingy);
			this.setParentRule(parentrule);
		}
		OperationCaret.prototype.setParentRule = function(parentrule){
			this.parentrule = parentrule;
			
			this.updateOperationCache();

		}
		OperationCaret.prototype.getParentThingy = function(){
			return this.parentthingy;
		}
		OperationCaret.prototype.getParentRule = function(){
			return this.parentrule;
		}
		OperationCaret.prototype.updateOperationCache(){
			
			//First establish if an involuntary operation is needed 
			
			//create ElementWalker which caches operations required at this level
			
			var involuntaryops = {};
			var termination = {};
			
			var involuntarywalker = new YOURX.CachingWalker();
			involuntarywalker.nameAccepted=function(name,rule){ /* do nothing */}
			involuntarywalker.nameRejected=function(name,rule){ involuntaryops[name] = new ThingyDeletion(rule); throw termination;}
			involuntarywalker.nameRequired=function(name,rule){ involuntaryops[name] = new ThingyAddition(rule); throw termination;}
			involuntarywalker.posAccepted=function(name,rule){ /* do nothing */}
			involuntarywalker.posRejected=function(name,rule){ involuntaryops[pos] = new ThingyDeletion(rule); throw termination;}
			involuntarywalker.posRequired=function(name,rule){ involuntaryops[pos] = new ThingyAddition(rule); throw termination;}
			
			
			
			//Then establish what voluntary operations are available at the various caret positions

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
		
		/** 
		 * @param {integer} pos The caret position being queried for expansion. 
		 * If this value is -1, then the caret position being queried is in the attribute axis, not the child axis.
		 */
		
		/** In order to complete a valid tree at this level (by manipulating the children and attributes of the parentthingy)
		 * a series of involuntary operations may be needed. Keep requesting and executing operations until this method
		 * returns null, and the tree should have shallow validity.
		 * 
		 * @param {Object} rule The childrule which is being evaluated at the given position.
		 * If null or undefined, it is assumed that all rules with satisfied precedents should be evaluated in parallel.
		 * @param {Object} caretpos The child position at which the operations are to be executed, -1 indicates the attribute axis. 
		 * If null or undefined, it is assumed that all caret positions with satisfied precedents should be evaluated in parallel.
		 */
		OperationCaret.prototype.getInvoluntaryOperation = function(key){
			var childthingyarray = this.parentthingy.getChildren();

			if(key === null ||  typeof key === 'undefined'){
				//if key unspecified recurse through all possible keys in series for any involuntary operation
				
				//get all keys from attribute thingies
				
				//get all keys from attribute rules
				
				//get all positions of existing children, plus the final position - space for a missing child?				
				
			}
			else if(key === -1){
				//if key is -1 results should be limited to the attribute axis
			}
			else{
				if(this.parentthingy instanceof ContainerThingy){
																			
					if(typeof key === "string"){
						//key can be interpreted as name (mapping to attributes)
						this.parentrule.walkAttributes(this.parentthingy,cachingwalker);
						var name;
						for(name in cachingwalker.mapsbyname["rejected"]){
							return 
						}						
					}
					else if(typeof key === "number"){
						//key can be interpreted as position (mapping to children)
					}
					else{
						throw new Error("Unexpected key type passed to OperationCaret#getInvoluntaryOperation()");
					}
					
				}
				
			}
			
		}
		
		/**
		 * @param {Thingy} parentthingy The thingy which matched the parent rule 
		 * @param {integer} caretpos The child position for the expansion 
		 * If caretpos is -1, then query addresses the attribute axis, not the child axis.
		 */
		OperationCaret.prototype.getVoluntaryOperations = function(rule, caretpos){
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
		 * Calling this function on Operations which are not interactive may throw an exception.
		 * Operations which represent a compound set may pass the user object to their component ThingyEdits.
		 * @param {YOURX.User} user
		 */
		ThingyOperation.prototype.interactWithUser = function(user){
			throw new YOURX.UnsupportedOperationError("interactWithUser() is not yet implemented for this Operation");
		}
		
		function ThingyOperationSet(rule, msg, operations){
			ThingyOperation.apply(this,arguments);
			this.operations = operations;
		}
		ThingyOperationSet.prototype = new ThingyOperation();
		ThingyOperationSet.prototype.getLabel = function(){
			var label = "[ ";
			var idx;
			
			for(idx = 0;idx < this.operations.length; idx++){
				label += "[ " + this.operations[idx].getLabel() + " ]";
			}
			label += " ]";
			return label;
		}		
		ThingyOperationSet.prototype.isInteractive = function(){
			var idx;
			for(idx = 0;idx < this.operations.length; idx++){
				if(this.operations[idx].isInteractive()){
					return true;
				}
			}
			return false;
		}
		ThingyOperationSet.prototype.operate = function(parentthingy, caretpos){
			operations.forEach(function(operation){
				caretpos = operation.operate(parentthingy,caretpos);
			});
		}
		
		/** @param {ThingyRule} rule The rule which this Contraction is trying to satisfy */
		function ThingyDeletion(rule, msg){
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
					throw new Error("Key should be an integer number");
				}					
			}
			else if(this.rule instanceof YOURX.AttributeThingyRule){
				if(typeof(key) === "string"){
					parent.removeAttribute(key);
				}
				else{
					throw new YOURX.ThingyRuleError("Attribute key should be a text string");
				}
			}
			else{
				throw new YOURX.UnsupportedOperationError('ThingyDeletion cannot (yet) handle this ThingyRule type');
			}
		}
		
		/** @param {ThingyRule} rule The rule which this Expansion is trying to satisfy */
		function ThingyAddition(rule, msg){
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
