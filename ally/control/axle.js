/** AXLE is the future home for the coordinating components like the OperationCaret and CompletionEditor. 
 * These complementing core Model (YOURX) and View (ALLY) libraries. AXLE objects define smart behaviours for
 * ALLY.Editor implementations and draw heavily on YOURX.ThingyTree storage structures. They define conventions
 * for representing focus in ThingyTrees
 */
YOURX.copyProperties(
	(function(){	
	
		/** The Controller is wired into keyboard eventing and determines what changes to the ThingyTree
		 * and what navigation operations in the Editor should be triggered by given characters depending
		 * where the caret and cursor is.  
		 * 
		 */ 
		return eval(YOURX.writeScopeExportCode([]));	
		
	}()),
	'AXLE'
);