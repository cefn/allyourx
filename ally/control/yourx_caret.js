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
		 * their own level; evaluated with nodescend=false).

		 * Operations are expansions or contractions of the tree which must or can be executed 
		 * at a given position and which create or maintain a tree which will pass shallow validation.

		 * The OperationCaret monitors changing rule assignment attribute and child assignment to that Thingy
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
		 * ThingyAdditions and ThingyDeletions are deterministic enough to proceed without any user input, introducing or removing
		 * ElementThingy,AttributeThingy and TextThingy objects to the tree. 
		 * 
		 * ThingyEdits on the other hand require the user to make a selection, or provide a value before they can proceed.
		 * 
		 * The getInvoluntaryOperation() function will return operations until the Tree passes shallow validation. If no  
		 * further operations are required to satisfy validation then it will return null;
		 * 
		 * The getVoluntaryOperation() function will return operations only if the Tree has already passed shallow validation, 
		 * and may throw an exception if this is not the case. If all production rules are finite and already satisfied, 
		 * then it will return null;
		 * 
		 * 
		 * @projectDescription Scenarios to note. Sequences of zeroOrMore element with no matching children
		 * are effectively active in parallel. Attribute rules are effectively active in parallel. Any child rules of 
		 * an Interleave structure are active in parallel. Highly parallel expansions can creat ThingyEdits with a 
		 * very large number of alternatives.
		 * 
		 */
		function OperationCaret(parentthingy, parentrule){
			this.parentthingy = parentthingy;
			this.parentrule = parentrule;
		}
		OperationCaret.prototype.getParentThingy = function(){
			return this.parentthingy;
		}
		OperationCaret.prototype.getParentRule = function(){
			return this.parentrule;
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
		OperationCaret.prototype.getInvoluntaryOperation = function(caretpos){
			var childthingyarray = this.parentthingy.getChildren();

			if(caretpos === null ||  typeof caretpos === 'undefined'){
				//if caretpos unspecified recurse through all possible caretpos in series for any involuntary operation

				var rules = this.parentrule.getChildren();
				
				var op = null;
				
				//examine attribute axis only if required
				if(this.parentthingy instanceof ElementThingy){
					var attrules = rules.filter(function(item){return item instanceof YOURX.AttributeThingyRule});				
					if(attrules.length > 0 ){
						//if attributerule exists
						op = this.getInvoluntaryOperation(-1);
						if(op !== null){ return op; }
					}
					else{
						// if attributethingy exists
						for(name in this.parentthingy.getAttributes()){
							op = this.getInvoluntaryOperation(-1);
							if(op !== null){ return op; }
							break;
						}
					}					
				}
				
				//examine child axis only if required
				if(this.parentthingy instanceof ContainerThingy){
					var childrules = rules.filter(function(item){return item instanceof YOURX.ElementThingyRule || item instanceof YOURX.TextThingyRule});
					if(childrules.length > 0 || childthingyarray.length > 0){
						//seek through involuntary ops for every possible caretpos amongst existing children
						var childidx;
						for(childidx = 0;childidx <= childthingyarray.length;childidx++){
							op = this.getInvoluntaryOperation(childidx);
							if(op !== null){ return op; }						
						}
					}
				}
				
				return null; //if got this far then no involuntary operation was found
				
			}
			else if(caretpos === -1){
				//attribute caretpos is being considered
				
			}
			else {
				//child caretpos is being considered
				
			}
			
		}
		
		/**
		 * @param {Thingy} parentthingy The thingy which matched the parent rule 
		 * @param {integer} caretpos The child position for the expansion 
		 * If caretpos is -1, then query addresses the attribute axis, not the child axis.
		 */
		OperationCaret.prototype.getVoluntaryOperations = function(rule, caretpos){
			if(caretpos == -1){
				if(rule instanceof YOURX.AttributeThingyRule){ //editing attribute values is a voluntary operation
					return [new ThingyEdit(rule)];
				}		
			}
			else if(caretpos <= parentthingy.getChildren().length){
				if(rule instanceof YOURX.ElementThingyRule){ //all operations involuntary; implicitly required with no user input 
					return [];
				}		
			}
			throw new YOURX.UnsupportedOperationError("getVoluntaryOperations() does not (yet) support this rule.");	
		}
		
		function ThingyOperation(rule, msg){
			this.rule = rule;
			this.msg = msg;
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
			throw new YOURX.UnsupportedOperationError("isDeterministic() is not yet implemented for this Operation");
		}
		
		function ThingyOperationSet(rule, msg, operations){
			ThingyOperation.apply(this,arguments);
			this.operations = operations;
		}
		ThingyOperationSet.prototype = new ThingyOperation();
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
		ThingyOperation.prototype.isInteractive = function(){
			return false;
		}
		ThingyDeletion.prototype.operate = function(parentthingy, caretpos){
			parentthingy.removeChild(caretpos);
			caretpos -= 1;
			return caretpos;
		}
		
		/** @param {ThingyRule} rule The rule which this Expansion is trying to satisfy */
		function ThingyAddition(rule, msg){
			ThingyOperation.apply(this,arguments);
		}
		ThingyAddition.prototype = new ThingyOperation();
		ThingyOperation.prototype.isInteractive = function(){
			return false;
		}
		/**
		 * @param {Thingy} parentthingy The thingy which matched the parent rule 
		 * @param {integer} caretpos The child position for the expansion 
		 */
		ThingyAddition.prototype.operate = function(parentthingy, caretpos){
			if(this.rule instanceof YOURX.ElementThingyRule){
				if(caretpos <= parentthingy.getChildren().length){
					parentthingy.addChild(new ElementThingy(this.rule.getName()), caretpos);
					caretpos += 1;
				}
				else{
					throw new YOURX.ThingyRuleError('Attempted expansion beyond the bounds of the tree');
				}
			}
			else if(this.rule instanceof YOURX.AttributeThingyRule){
				if(typeof caretpos != 'undefined' && caretpos !== null && caretpos != -1 ){
					parent.addAttribute(new AttributeThingy(this.rule.getName()));
					return caretpos;
				}
				else{
					throw new YOURX.ThingyRuleError('Attributes cannot be inserted at a specific child position');
				}
			}
			else{
				throw new YOURX.UnsupportedOperationError('expandThingyRule() cannot (yet) handle this ThingyRule type');
			}
		}
		
		/**
		 * @classDescription ThingyEdits implement interactive operations, 
		 * such as filling in an unknown, but required, value. 
		 * Typically these grab focus during a validation traversal since completion 
		 * requires the users attention.
		 * 
		 * @param {ThingyRule} rule
		 */
		function ThingyEdit(rule, msg){
			ThingyOperation.apply(this,arguments);
		}
		ThingyEdit.prototype = new ThingyOperation();
		ThingyOperation.prototype.isInteractive = function(){
			return true;
		}
		ThingyEdit.prototype.operate = function(parentthingy,caretpos){
			throw new YOURX.UnsupportedOperationError('ThingyEdit#operate(...) not yet implemented');	
		}
		
		
		return eval(YOURX.writeScopeExportCode([
			'OperationCaret','ThingyOperation','ThingyAddition','ThingyDeletion','ThingyEdit'
		]));
		
	}()),
	'YOURX'
);
