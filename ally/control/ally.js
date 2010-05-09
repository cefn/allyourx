/*
 * Various functions defined in a a private scope, 
 * with public functions served under the ALLY namespace.
 */
YOURX.copyProperties(
	(function(){	
	
		/** Abstract definition of an editor, which coordinates between an in-memory
		 * Thingy tree, and an in-page DOM based representation. The definition relies 
		 * on the Sizzle engine to define sets of page resources which are bound
		 * to subtrees (provided through JQuery sets for convenience). 
		 */
		function Editor(){}
		
		/** Acquire listener implementations from YOURX.Thingy */
		Editor.prototype.bind = YOURX.Thingy.prototype.bind;
		Editor.prototype.unbind = YOURX.Thingy.prototype.unbind;

		
		/** Binds a thingy to the element identified by the JQuery selection. 
		 * The contents of the element will then be updated according to Thingy
		 * events which indicating a change of state or relationships in the tree.
		 * @param {Object} thingy The thingy to bind
		 * @param {Object} elq A JQuery selection to bind to
		 */
		Editor.prototype.bindThingyTreeBelow = function(thingy,elq){
			throw new YOURX.UnsupportedException("The bindThingyTreeBelow() function must be overriden to implement an ALLY.Editor");
		}
		
		/** Abstract definition for any editor which monitors a tree node for changes, 
		 * keeping its DOM structures in sync. Recursively subscribes to events 
		 * from all new descendant nodes as subtrees appear. This implementation triggers 
		 * factory methods to create new DOM structures, which should be overridden by subclasses.
		 */
		function RecursiveEditor(){
			Editor.apply(this,arguments);
		}
		RecursiveEditor.prototype = new Editor();
		/** Creates a new set of DOM elements to represent the specified Thingy in the Editor.
		 * @param {Thingy} thingy The thingy to create elements for
		 * @return A JQuery set of elements not yet attached to a DOM. 
		 */
		RecursiveEditor.prototype.createThingyWrapper = function(thingy){
			throw new YOURX.UnsupportedException("The createThingyWrapper() function must be overriden to implement an ALLY.RecursiveEditor");
		}
		/** Binds a Thingy to the element identified by the JQuery selection. 
		 * It recurses through descendants, creating new elements from attributes, 
		 * child elements, and child text nodes, as constructed from the 
		 * createThingyWrapper() and managed by the query*Wrapper functions, 
		 * which provide Editor-specific retrieval from the ThingyWrapper of 
		 * structural subsections. These are recursively bound in turn.
		 * @param {Object} thingy
		 * @param {Object} elq
		 */
		RecursiveEditor.prototype.bindThingyTreeBelow = function(thingy, elq){
			var thiseditor = this;
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){	//just for elements
					//identify 'open tag' wrapper to insert attributes 
					var openelq = thiseditor.queryOpenWrapper(elq);
					//bind new attribute wrappers in 'open tag' wrapper for all current and future attributes
					var attelqs = {};
					thingy.getAttributes(
						function(parentthingy,attthingy){ //attribute appeared
							var attelq;
							attthingy.getValue(function(thingy,newvalue,oldvalue){
								if(attthingy.name in attelqs){
									attelqs[attthingy.name].remove();
								}
								attelqs[attthingy.name] = thiseditor.createThingyWrapper(attthingy);
								openelq.append(attelqs[attthingy.name]);
							});
						},
						function(parentthingy,attthingy){ //attribute disappeared
							if(attthingy.name in attelqs){
								attelqs[attthingy.name].remove();
							}
							delete attelqs[attthingy.name];
						}
					);
				}
				//for all containers
				//identify 'descendant' wrapper to insert children
				var descendelq = thiseditor.queryDescendWrapper(elq);
				// bind new child wrappers in 'descendant' wrapper for all current and future children
				var childelqs = [];
				thingy.getChildren(
					function(parentthingy, childthingy,childidx){ //child appeared - create and attach wrapper
						var childelq = thiseditor.createThingyWrapper(childthingy);
						descendelq.append(childelq);
						childelqs[childidx] = childelq;
					},
					function(parentthingy,childthingy,childidx){ //child disappeared - remove wrapper
						childelqs.splice(childidx, 1)[0].remove(); 	
					}
				);
			}
			else if(thingy instanceof YOURX.ContentThingy){ //for all content items
				thingy.getValue(function(item,value){ //value notified - update 'content' wrapper
					thiseditor.queryContentWrapper(elq).text(value);
				});
			}
		}
		/** The descendants of a Thingy can comprise elements, text nodes and attributes or more.
		 * This method returns all descendants acknowledged by the Editor. 
		 * @param {Object} thingy
		 */
		RecursiveEditor.prototype.getDescendants = function(thingy){
			if(thingy instanceof ElementThingy){
				return thingy.getAttributes().concat(thingy.getChildren());
			}
			else if(thingy instanceof ContainerThingy){
				return this.getChildren();
			}
			throw new Error("Unexpected Thingy class encountered in getDescendants()");			
		}
		
		/** A RecursiveEditor whose factory methods create class-annotated spans
		 * as the structural elements corresponding with individual Thingies in the DOM.
		 */
		function SpanEditor(){
			RecursiveEditor.apply(this,arguments);
		}
		SpanEditor.prototype = new RecursiveEditor();
		/** Constructs nested spans with class annotations representing 
		 * the type of the specified Thingy, then recursively constructs required
		 * spans for all descendants.
		 * @param {Object} thingy
		 */
		SpanEditor.prototype.createThingyWrapper = function(thingy){
			var elq = $("<span/>");
			
			/** //OperationCaret  should be stored in place of the thingy directly		
			elq.data("xthingy",thingy);
			**/

			//bind thingy and add structural elements

			//assign classes depending on Thingy type
			if(thingy instanceof YOURX.ContainerThingy){
				elq.addClass("xcontainer");
				if(thingy instanceof YOURX.ElementThingy){
					elq.addClass("xelement");
				}
			}
			else if(thingy instanceof YOURX.ContentThingy){
				if(thingy instanceof YOURX.AttributeThingy){
					elq.addClass("xattribute");
				}
				else if(thingy instanceof YOURX.TextThingy){
					elq.addClass("xtext");
				}
			}
			
			if(thingy instanceof YOURX.ContainerThingy){
				//add structural spans for start, end and descendants
				elq.append('<span class="xdescend"/>');
				if(thingy instanceof YOURX.ElementThingy){
					elq.prepend('<span class="xopen" />');
					elq.append('<span class="xclose" />');
				}
			}
			if(thingy instanceof YOURX.ContentThingy){
				//add a separate content span
				var contentq = $('<span class="xcontent">' + thingy.getValue() + '</span>');
				elq.append(contentq);
			}			
			
			//creates and binds new DOM elements matching
			//attributes, child elements and text nodes below 
			//this Thingy in the heirarchy
			this.bindThingyTreeBelow(thingy,elq);

			return elq;
		}
		
		SpanEditor.prototype.queryContentWrapper = function(elq){
			return elq.children().filter(".xcontent");
		}
		SpanEditor.prototype.queryDescendWrapper = function(elq){
			return elq.children().filter(".xdescend");
		}
		SpanEditor.prototype.queryOpenWrapper = function(elq){
			return elq.children().filter(".xopen");
		}
		SpanEditor.prototype.queryCloseWrapper = function(elq){
			return elq.children().filter(".xclose");
		}
		
		function RawEditor(){
			SpanEditor.apply(this,arguments);
		}
		RawEditor.prototype = new SpanEditor();
		/** Add xraw class and contentEditable behaviour to content elements
		 * @param {Object} thingy
		 * @param {Object} descend
		 */
		RawEditor.prototype.createThingyWrapper = function(thingy){
			var superq = SpanEditor.prototype.createThingyWrapper.apply(this,arguments);
			superq.addClass("xraw");
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){
					this.queryOpenWrapper(superq).before('&lt;<span class="xname">' + thingy.getName() +'</span>');					
					this.queryOpenWrapper(superq).after("&gt;");					
					this.queryCloseWrapper(superq).before("&lt;" + thingy.getName());					
					this.queryCloseWrapper(superq).after("/&gt;");
				}					
			}
			else if (thingy instanceof YOURX.ContentThingy){
				this.queryContentWrapper(superq).attr("contentEditable",true);
				if(thingy instanceof YOURX.AttributeThingy){
					this.queryContentWrapper(superq).before(' <span class="xname">' + thingy.getName() +'</span>="');
					this.queryContentWrapper(superq).after('"');
				}
			}
			return superq;
		}
			
		/*
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
		*/
		
		return eval(YOURX.writeScopeExportCode([
			'RecursiveEditor', 'SpanEditor', 'RawEditor']
		));	
		
	}()),
	'ALLY'
);