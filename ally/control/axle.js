/** AXLE provides the Controller complementing the Model (YOURX) and View (ALLY)
 * It's coupled to the YOURX.OperationCaret, YOURX.ThingyTree and ALLY.Editor implementations.
 * 
 */
YOURX.copyProperties(
	(function(){	
	
		/** The Controller is wired into keyboard eventing and determines what changes to the ThingyTree
		 * and what navigation operations in the Editor should be triggered by given characters depending
		 * where the caret and cursor is.  
		 * 
		 */ 
		function Controller(editor){
			this.editor = editor;
		};
						
		/** Handles a new key pressed in the context of a given...
		 * @param {Object} opcaret (focused thingy and validation rule)
		 * @param {Object} fieldcaret (start and end of selection range in the thingy's field)
		 * @param {Object} whichkey the key to handle
		 * @return The thingy which should acquire focus, or null if no focus
		 */
		Controller.prototype.handleKeyPressed = function(opcaret,fieldcaret,whichkey){
			var tracker = editor.getTracker();
			//TODO : wire into operation caret's list of available operations
			switch(whichkey){
				case '<': //beginning of open tag
					if(opcaret.thingy instanceof YOURX.TextThingy){
						//add element after textthingy
						var parent = tracker.getParent(opcaret.thingy); 
						var pos = tracker.getPosition(opcaret.thingy);
						var newthingy = new YOURX.ElementThingy("");
						parent.addChild(pos + 1);
						return newthingy;
					}
					else{
						//set focus on next element 
						return tree.traverseDocumentOrder(opcaret.thingy, function(totest){
							return totest instanceof YOURX.ElementThingy ? totest : false;
						});
					}
				break;
				case '>':
					//traverse list (including focus item) to find element 
					var parent = tree.traverseDocumentOrder(opcaret.thingy, function(totest){
						return totest instanceof YOURX.ElementThingy ? totest : false;						
					});
					if(parent){
						if(parent.getChild(0) instanceof YOURX.TextThingy){
							//focus on text thingy child
							return parent.getChild(0);
						}
						else{
							//add textthingy as first child and focus there				
							var newthingy = new YOURX.TextThingy("");
							parent.addChild(newthingy,0);
							return newthingy;
						}
					}
				break;
				default:
					if(opcaret.thingy instanceof ContentThingy){
						return opcaret.thingy;
					}
				break;
				throw new Error("Character '" + whichkey + "' unhandled by any Controller case. Should have returned by now." );
			}
		}
	
		return eval(YOURX.writeScopeExportCode([
			'Controller']
		));	
		
	}()),
	'AXLE'
);