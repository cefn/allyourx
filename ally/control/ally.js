/*
 * Various functions defined in a a private scope, 
 * with public functions served under the ALLY namespace.
 */
YOURX.copyProperties(
	(function(){	
	
		function Editor(){}
		/** Binds a thingy to the element identified by the JQuery selection. 
		 * The contents of this element will henceforth be updated according to Thingy events indicating a change of state or relationships.
		 * @param {Object} thingy The thingy to bind
		 * @param {Object} elq A JQuery selection to bind to
		 */
		Editor.prototype.bindThingyTreeBelow = function(thingy,elq){
			throw new YOURX.UnsupportedException("The bindThingyTreeBelow() function must be overriden to implement an ALLY.Editor");				
		}
		
		function RecursiveEditor(){
			Editor.apply(this,arguments);
		}
		RecursiveEditor.prototype = new Editor();
		/** Creates a new set of DOM elements, representing a Thingy in the Editor.
		 * @param {Object} thingy The thingy to create elements for
		 * @param {Object} descend Whether child content should be included
		 * @return A JQuery set of elements not yet attached to a DOM. 
		 */
		RecursiveEditor.prototype.createThingyWrapper = function(thingy){
			throw new YOURX.UnsupportedException("The createThingyWrapper() function must be overriden to implement an ALLY.RecursiveEditor");
		}
		/** Binds a Thingy to the element identified by the JQuery selection. 
		 * As it recurses, it creates new elements from attributes, child elements, and child text nodes,
		 * as constructed from the createThingyWrapper() and managed by the query*Wrapper functions, 
		 * which provide Editor-specific retrieval from the ThingyWrapper of structural subsections. 
		 * These are recursively bound in turn.
		 * @param {Object} thingy
		 * @param {Object} elq
		 */
		RecursiveEditor.prototype.bindThingyTreeBelow = function(thingy, elq){
			var thiseditor = this;
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){					
					//or just elements add as listener to attributes, traversing existing
					var attelqs = {};
					var openelq = thiseditor.queryOpenWrapper(elq);
					thingy.getAttributes(
						function(parentthingy,attthingy){
							var attelq;
							attthingy.getValue(function(thingy,newvalue,oldvalue){
								if(attthingy.name in attelqs){
									attelqs[attthingy.name].remove();
								}
								attelqs[attthingy.name] = thiseditor.createThingyWrapper(attthingy);
								openelq.append(attelqs[attthingy.name]);
							});
						},
						function(parentthingy,attthingy){
							if(attthingy.name in attelqs){
								attelqs[attthingy.name].remove();
							}
							delete attelqs[attthingy.name];
						}
					);
				}
				//for all containers add as listener to children, traversing existing
				var childelqs = [];
				var descendelq = thiseditor.queryDescendWrapper(elq);
				thingy.getChildren(
					function(parentthingy, childthingy,childidx){ //child appeared
						//attach new dom element
						var childelq = thiseditor.createThingyWrapper(childthingy);
						descendelq.append(childelq);
						childelqs[childidx] = childelq;
					},
					function(parentthingy,childthingy,childidx){ //child disappeared
						childelqs.splice(childidx, 1)[0].remove(); //remove previously added	
					}
				);
			}
			else if(thingy instanceof YOURX.ContentThingy){
				thingy.getValue(function(item,value){
					thiseditor.queryContentWrapper(elq).text(value);
				});
			}
		}
		RecursiveEditor.prototype.getDescendants = function(thingy){
			if(thingy instanceof ElementThingy){
				return thingy.getAttributes().concat(thingy.getChildren());
			}
			else if(thingy instanceof ContainerThingy){
				return this.getChildren();
			}
			throw new Error("Unexpected Thingy class encountered in getDescendants()");			
		}
		
		function SpanEditor(){
			RecursiveEditor.apply(this,arguments);
		}
		SpanEditor.prototype = new RecursiveEditor();
		SpanEditor.prototype.createThingyWrapper = function(thingy){
			var elq = $("<span/>");
										
			//bind thingy and add structural elements
			elq.data("xthingy",thingy);

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
					this.queryOpenWrapper(superq).before("&lt;" + thingy.getName());					
					this.queryOpenWrapper(superq).after("&gt;");					
					this.queryCloseWrapper(superq).before("&lt;" + thingy.getName());					
					this.queryCloseWrapper(superq).after("/&gt;");
				}					
			}
			else if (thingy instanceof YOURX.ContentThingy){
				this.queryContentWrapper(superq).attr("contentEditable",true);
				if(thingy instanceof YOURX.AttributeThingy){
					this.queryContentWrapper(superq).before(' ' + thingy.getName() + '="');
					this.queryContentWrapper(superq).after('"');
				}
			}
			return superq;
		}
	
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
		
		return eval(YOURX.writeScopeExportCode([
			'getAnnotationNames', 'RecursiveEditor', 'SpanEditor', 'RawEditor']
		));	
		
	}()),
	'ALLY'
);