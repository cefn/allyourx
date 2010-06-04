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
						
	
		return eval(YOURX.writeScopeExportCode([
			'Controller']
		));	
		
	}()),
	'AXLE'
);