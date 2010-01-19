YOURX.Thingy.prototype.getAllyMarkup = function(descend){
	var annotationmarkup = "";
	var rule = this.getRule();
	if(rule){ //skip annotation if no schema info
		var force = true;
		ALLY.getAnnotationNames().forEach(function(item){
			var value = rule.getAnnotation(item);
			annotationmarkup += (value || force) ? ' ' + name + '="' + value + '"' : "";		
		});
	}

	return '<div class="' + this.getAllyName() + '"' + annotationmarkup + '>' +
		this.getAllyInnerMarkup(descend) +
	'</div>';
}
YOURX.Thingy.prototype.getAllyInnerMarkup = function(descend){
	return "";
}

/** Augment Yourx objects with methods generating Ally compliant markup. */ 
YOURX.ContainerThingy.prototype.getAllyName = function(){ return "xcontainer";}
YOURX.ElementThingy.prototype.getAllyName = function(){ return "xelement";}
YOURX.AttributeThingy.prototype.getAllyName = function(){ return "xattribute";}
YOURX.TextThingy.prototype.getAllyName = function(){ return "xtext";}

/** Markup for container nodes storing child values, specialised for elements (xml infoset). */
YOURX.ContainerThingy.prototype.getAllyInnerMarkup = function(descend){
	var innermarkup = "";
	if(descend){
		this.getAllyDescendants().forEach(function(item){
			innermarkup += item.getAllyMarkup();
		});
	}
	return innermarkup;
}

YOURX.ContainerThingy.prototype.getAllyDescendants = function(){
	return this.getChildren();
}

YOURX.ElementThingy.prototype.getAllyDescendants = function(){
	return this.getAttributes().concat(this.getChildren());
}

YOURX.ContentThingy.prototype.getAllyInnerMarkup = function(descend){
	return '<div class="xcontent">' + this.getValue() + '</div>';
}

/*
 * Various functions defined in a a private scope, 
 * with public functions served under the ALLY namespace.
 */
YOURX.copyProperties(
	(function(){	
	
		function getAnnotationNames(){
			return ['a:name','a:title','a:type'];
		}
	
		function bindThingy(thingy, elq){
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
								attelqs[attthingy.name] = $(attthingy.getAllyMarkup(false));
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
						var childmarkup = childthingy.getAllyMarkup(false);
						var childelq = $(childmarkup);
						elq.append(childelq);
						childelqs[childidx] = childelq;
						//bind on children
						ALLY.bindThingy(childthingy,childelq);
					},
					function(parentthingy,childthingy,childidx){ //child disappeared
						childelqs.splice(childidx).remove(); //remove previously added
					}
				);
			}
			else if(thingy instanceof YOURX.ContentThingy){
				thingy.getValue(function(item,value){
					elq.html(thingy.getAllyInnerMarkup());
				});
			}
		}
		
		return eval(YOURX.writeScopeExportCode([
			'bindThingy', 'getAnnotationNames']
		));	
		
	}()),
	'ALLY' //(typeof(ALLY)!='undefined'?ALLY:ALLY={})
);