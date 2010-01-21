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
		Editor.prototype.bindThingy = function(thingy,elq){
			throw new YOURX.UnsupportedException("The bindThingy() function must be overriden to implement an ALLY.Editor");				
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
		RecursiveEditor.prototype.createThingyQuery = function(thingy,descend){
			throw new YOURX.UnsupportedException("The createThingyQuery() function must be overriden to implement an ALLY.RecursiveEditor");
		}
		/** Creates a new set of DOM elements, representing the content of a ContentThingy in the Editor.
		 * @param {Object} contentthingy The contentthingy to create elements for
		 * @return A JQuery set of elements not yet attached to a DOM. 
		 */
		RecursiveEditor.prototype.createContentQuery = function(contentthingy){
			throw new YOURX.UnsupportedException("The createContentQuery() function must be overriden to implement an ALLY.RecursiveEditor");			
		}
		/** Binds a Thingy to the element identified by the JQuery selection. 
		 * As it recurses, it creates new elements from attributes, child elements, and child text nodes,
		 * as constructed from the createThingyQuery() and createContentQuery() functions. 
		 * These are recursively bound in turn.
		 * @param {Object} thingy
		 * @param {Object} elq
		 */
		RecursiveEditor.prototype.bindThingy = function(thingy, elq){
			var thiseditor = this;
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){					
					//or just elements add as listener to attributes, traversing existing
					var attelqs = {};
					thingy.getAttributes(
						function(parentthingy,attthingy){
							var attelq;
							attthingy.getValue(function(thingy,newvalue,oldvalue){
								if(attthingy.name in attelqs){
									attelqs[attthingy.name].remove();
								}
								attelqs[attthingy.name] = thiseditor.createThingyQuery(attthingy,false);
								elq.append(attelqs[attthingy.name]);
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
				thingy.getChildren(
					function(parentthingy, childthingy,childidx){ //child appeared
						//attach new dom element
						var childelq = thiseditor.createThingyQuery(childthingy,false);
						elq.append(childelq);
						childelqs[childidx] = childelq;							
						//bind on children
						thiseditor.bindThingy(childthingy,childelq);
					},
					function(parentthingy,childthingy,childidx){ //child disappeared
						childelqs.splice(childidx).remove(); //remove previously added	
					}
				);
			}
			else if(thingy instanceof YOURX.ContentThingy){
				thingy.getValue(function(item,value){
					elq.html(thiseditor.createContentQuery(thingy));
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
		
		function DivEditor(){
			RecursiveEditor.apply(this,arguments);
		}
		DivEditor.prototype = new RecursiveEditor();
		DivEditor.prototype.createThingyQuery = function(thingy,descend){
			//create div with defined classes
			var elq = $("<div/>");
			elq.addClass(this.getClasses(thingy));
			
			//handle Containers vs Content
			if(thingy instanceof YOURX.ContainerThingy){
				//add attributes and child elements and text
				if(descend){
					this.getAllyDescendants().forEach(function(item){
						elq.append(this.createThingyQuery(item));
					});
				}
			}
			else if(thingy instanceof YOURX.ContentThingy){
				//add the content div
				elq.append(this.createContentQuery(thingy));
			}

			return elq;
		}
		DivEditor.prototype.createContentQuery = function(contentthingy){
			return $('<div class="xcontent">' + contentthingy.getValue() + '</div>');
		}
		DivEditor.prototype.getClasses = function(thingy){
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){
					return "xelement";
				}
				else{
					return "xcontainer";					
				}
			}
			else if(thingy instanceof YOURX.ContentThingy){
				if(thingy instanceof YOURX.AttributeThingy){
					return "xattribute";
				}
				else if(thingy instanceof YOURX.TextThingy){
					return "xtext";
				}
			}
			throw new Error("Unexpected Thingy class encountered in getClasses()");			
		}
		
		function RawEditor(){
			DivEditor.apply(this,arguments);
		}
		RawEditor.prototype = new DivEditor();
		RawEditor.prototype.createThingyQuery = function(thingy,descend){			
				var superq = DivEditor.prototype.createThingyQuery.apply(this,arguments);
				superq.addClass("xraw");
				return superq;
		}
		RawEditor.prototype.createContentQuery = function(thingy,descend){			
				var superq = DivEditor.prototype.createContentQuery.apply(this,arguments);
				superq.attr("contentEditable",true);
				return superq;
		}
	
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
		
		return eval(YOURX.writeScopeExportCode([
			'getAnnotationNames', 'RecursiveEditor', 'DivEditor', 'RawEditor']
		));	
		
	}()),
	'ALLY'
);