/*
 * Various functions defined in a a private scope, 
 * with public functions served under the ALLY namespace.
 */
YOURX.copyProperties(
	(function(){	
	
		function Editor(){}
		Editor.prototype.bindThingy = function(thingy,elq){
			throw new YOURX.UnsupportedException("The bindThingy() function must be overriden to implement an ALLY.Editor");				
		}
		
		function RecursiveEditor(){
			Editor.apply(this,arguments);
		}
		RecursiveEditor.prototype = new Editor();
		RecursiveEditor.prototype.getMarkup = function(thingy,descend){
			throw new YOURX.UnsupportedException("The getMarkup() function must be overriden to implement an ALLY.RecursiveEditor");
		}
		RecursiveEditor.prototype.getContentMarkup = function(contentthingy){
			throw new YOURX.UnsupportedException("The getContentMarkup() function must be overriden to implement an ALLY.RecursiveEditor");			
		}
		RecursiveEditor.prototype.bindThingy = function(thingy, elq){
			var thiseditor = this;
			if(thingy instanceof YOURX.ContainerThingy){
				if(thingy instanceof YOURX.ElementThingy){					
					//add as listener to attributes, traversing existing
					var attelqs = {};
					thingy.getAttributes(
						function(parentthingy,attthingy){
							var attelq;
							attthingy.getValue(function(thingy,newvalue,oldvalue){
								if(attthingy.name in attelqs){
									attelqs[attthingy.name].remove();
								}
								attelqs[attthingy.name] = $(thiseditor.getMarkup(attthingy,false));
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
				//add as listener to children, traversing existing
				var childelqs = [];
				thingy.getChildren(
					function(parentthingy, childthingy,childidx){ //child appeared
						//attach new dom element
						var childmarkup = thiseditor.getMarkup(childthingy,false);
						var childelq = $(childmarkup);
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
					elq.html(thiseditor.getContentMarkup(thingy));
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
		DivEditor.prototype.getMarkup = function(thingy,descend){
			var annotationmarkup = "";
			var rule = thingy.getRule();
			if(rule){ //skip annotation if no schema info
				var force = true;
				ALLY.getAnnotationNames().forEach(function(item){
					var value = rule.getAnnotation(item);
					annotationmarkup += (value || force) ? ' ' + name + '="' + value + '"' : "";		
				});
			}
			
			var innermarkup;
			if(thingy instanceof YOURX.ContainerThingy){
				innermarkup = "";
				if(descend){
					this.getAllyDescendants().forEach(function(item){
						innermarkup += this.getMarkup(item);
					});
				}
			}
			else if(thingy instanceof YOURX.ContentThingy){
				innermarkup = this.getContentMarkup(thingy);
			}
		
			return '<div class="' + this.getClasses(thingy) + '"' + annotationmarkup + '>' + innermarkup + '</div>';
		}
		DivEditor.prototype.getContentMarkup = function(contentthingy){
			return '<div class="xcontent">' + contentthingy.getValue() + '</div>'
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
		
		function ContentEditableEditor(){
			RecursiveEditor.apply(this,arguments);
		}
		ContentEditableEditor.prototype = new RecursiveEditor();
		ContentEditableEditor.prototype.getMarkup = function(thingy,descend){			
			
		}
		
	
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
		
		return eval(YOURX.writeScopeExportCode([
			'getAnnotationNames', 'RecursiveEditor', 'DivEditor']
		));	
		
	}()),
	'ALLY'
);