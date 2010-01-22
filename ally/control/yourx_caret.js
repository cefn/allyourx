YOURX.copyProperties(
	(function(){		
		/** 
		 * @param {Thingy} parentthingy A parent thingy already satisfying its corresponding ThingyRule in the grammar hierarchy.
		 * 
		 * @classDescription  An OperationCaret applies to the attributes and children of one Thingy in an existing tree, 
		 * represented by 'parentthingy'. It monitors changing rule assignment and child assignment to that Thingy
		 * and updates its estimate of available Operations accordingly.
		 *  
		 * The OperationCaret may provide expansions or contractions of the tree which can or must be executed 
		 * at a given position, in order to create a valid tree.
		 * Unless all production rules are finite and already satisfied,
		 * 
		 * More formally OperationCaret reports two different sets of operations. 
		 * An individual operation from the 'voluntary' set can be executed electively without compromising validity. 
		 * An individual operation from the 'involuntary' set is <i>required</i> to progress towards validity. 
		 * Each set may have to be re-evaluated after a change to the Thingy tree, including the changes applied 
		 * by applying an Expansion, so these results should not be cached.
		 * 
		 * An Expansion adds one or more AttributeThingy to the parent, and/or one or more 
		 * child ElementThingy to meet the contract of one or more ThingyRules applying to this caret position.
		 * A Contraction removes one or more AttributeThingy from the parent, and/or one or more 
		 * child ElementThingy to meet the contract of one or more ThingyRules applying to this caret position.
		 * An Operation is the more general superclass. 
		 * 
		 * CompoundOperations can combine Expansions, Contractions and further CompoundOperations.
		 * 
		 * @projectDescription Scenarios to note. Sequences of zeroOrMore element with no matching children
		 * are effectively active in parallel similarly to the implications of an interleave on rules in general. 
		 * Although neither is currently implemented in v001 the logic of this class permits this to be expressed
		 * in future implementations.
		 * 
		 */
		function OperationCaret(parentthingy){
			this.parentthingy = parentthingy;
		}
		OperationCaret.prototype.getParentThingy = function(){
			return this.parentthingy;
		}
		/** @param {integer} pos The caret position being queried for expansion. 
		 * If this value is -1, then the caret position being queried is in the attribute axis, not the child axis.
		 */
		OperationCaret.prototype.getInvoluntaryOperations = function(rule, caretpos){
			if(typeof caretpos === 'undefined'){
				caretpos = 0;
			}
			var rls = null, ths = null;
			if(rule instanceof YOURX.ElementThingyRule){
				var rls = [rule];
				var ths = [this.parentthingy.getChildren()[caretpos]];
				try{
					var consumed = YOURX.ThingyUtil.greedyConsumeSequence(rls, ths, false, true);
					if (consumed.length === 1) { 
						//rule is satisfied and nothing needs doing
						return [];
					}					
				}
				catch(e){
					if(! e instanceof YOURX.ThingyRuleError){
						throw e;
					}
				}
				//new element needs adding
				return [ new ThingyAddition(rule) ];
			}
			else if( rule instanceof YOURX.AttributeThingyRule){
				var candidate;
				if ((candidate = this.parentthingy.getAttributeThingy(rule.name)) instanceof AttributeThingy){
					if(YOURX.ThingyUtil.greedyConsumeSequence([rule], [candidate]).length == 1){
						return [];			
					}
					else{ //attribute needs populating, either by adding a blank attribute or prompting the user to edit
						return [new ThingyAddition(rule),new ThingyEdit(rule)];
					}
				}
				else {
					return [new ThingyAddition(rule)];
				}				
			}
			throw new YOURX.UnsupportedOperationError("OperationCaret does not yet support this caret request");
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
		
		function ThingyOperation(rule){
			this.rule = rule;
		}
		/** @return {String} The text label which should be shown to describe this expansion */
		ThingyOperation.prototype.getLabel = function(){
			throw new YOURX.UnsupportedOperationError("getLabel() is not yet implemented for this Operation");	
		}
		
		function CompoundThingyOperation(rule, operations){
			this.operations = operations;
			ThingyOperation.apply(this,[rule]);
		}
		CompoundThingyOperation.prototype = new ThingyOperation();
		CompoundThingyOperation.prototype.operate = function(parentthingy, caretpos){
			operations.forEach(function(operation){
				caretpos = operation.operate(parentthingy,caretpos);
			});
		}
		
		
		/** @param {ThingyRule} rule The rule which this Contraction is trying to satisfy */
		function ThingyDeletion(rule){
			ThingyOperation.apply(this,[rule]);
		}
		ThingyDeletion.prototype = new ThingyOperation();
		ThingyDeletion.prototype.operate = function(parentthingy, caretpos){
			parentthingy.removeChild(caretpos);
			caretpos -= 1;
			return caretpos;
		}
		
		/** @param {ThingyRule} rule The rule which this Expansion is trying to satisfy */
		function ThingyAddition(rule){
			ThingyOperation.apply(this,[rule]);
		}
		ThingyAddition.prototype = new ThingyOperation();
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
		function ThingyEdit(rule){
			ThingyOperation.apply(this,[rule]);
		}
		ThingyEdit.prototype = new ThingyOperation();
		ThingyEdit.prototype.operate = function(parentthingy,caretpos){
			throw new YOURX.UnsupportedOperationError('ThingyEdit#operate(...) not yet implemented');	
		}
		
		
		return eval(YOURX.writeScopeExportCode([
			'OperationCaret','ThingyOperation','ThingyAddition','ThingyDeletion','ThingyEdit'
		]));
		
	}()),
	'YOURX'
);
