YOURX.copyProperties(
	(function(){
					
		/** Utility methods in a 'static' library object */		
		var ThingyUtil = { //TODO consider reusing single static DOMParser and XMLSerializer
			log:function(msg){$(function(){$('body').prepend(msg + "<br/>")});},
			xml2e4x:function(xml){ return new XML(ThingyUtil.xmlStripComments(xml));},
			xml2dom:function(xml){ return (new DOMParser()).parseFromString(xml,"text/xml");},
			e4x2xml:function(e4x){ return e4x.toXMLString();},
			e4x2dom:function(e4x){ return ThingyUtil.xml2dom(ThingyUtil.e4x2xml(e4x));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
			dom2e4x:function(dom){ return new XML(ThingyUtil.dom2xml(dom));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
			dom2xml:function(dom){ return (new XMLSerializer()).serializeToString(dom);},
			dom2thingy:function(node) {
				if(node instanceof Document){
					return new RootThingy(node);		
				}
				else if(node instanceof Element){
					return new ElementThingy(node);
				}
				else if(node instanceof Attr){
					if (node.name.search(/^xmlns:/) === -1) { //ignore namespace attributes
						return new AttributeThingy(node);
					}
					else {
						return null;
					}
				}
				else if(node instanceof Text){
					return new TextThingy(node);
				}
				else if(node instanceof ProcessingInstruction){
					//ignore for now, although schema instruction will be read eventually
					return null;
				}
				else{
					throw new Error("Unexpected node type when parsing XML");					
				}
			},
			dom2rule:function(node) {
				if(node instanceof Document){
					return new ThingyGrammar(node);
				}
				else if(node instanceof Element){
					var name = node.nodeName;
					if(name=="element"){
						return new ElementThingyRule(node);
					}
					else if(name=="attribute"){
						return new AttributeThingyRule(node);
					}
					else{
						throw new Error("Unsupported element found when loading ThingyRules");						
					}
				}
			},
			url2node:function(url){
				var xhttp;
                if (window.XMLHttpRequest) {
                    xhttp = new XMLHttpRequest();
                }
                else // Internet Explorer 
                {
                    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
                }
                xhttp.open("GET", url, false);
                xhttp.send(null);
				ThingyUtil.domStripSpace(xhttp.responseXML);			
				return xhttp.responseXML;
			},
			url2thingy:function(url){
				return ThingyUtil.dom2thingy(ThingyUtil.url2node(url));
			},
			url2rule:function(url){
				return ThingyUtil.dom2rule(ThingyUtil.url2node(url));
			},
			domStripSpace:function(dom){
				$("*", dom).contents().filter(function(){ //identifies spurious whitespace text nodes
					if(this.nodeType == 3){ //filter for text node
						var spacematch = null;
						if((spacematch = this.data.match(/[\t\n\r ]+/g)) !== null){ //match whitespace https://developer.mozilla.org/En/Whitespace_in_the_DOM
							if(spacematch[0] == this.data){//check if whole text is whitespace
								return true; //if so, include in list to be removed
							}
						}
					}
					return false; 
				}).remove();
				return dom;
			},
			xmlStripComments:function(xml){return xml.replace(/<\?(.*?)\?>/g,"");}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
			mapWithKey:function(key,allmaps){
				var idx;
				for(idx = 0; idx < allmaps.length;idx++){
					if(key in allmaps[idx]){
						return idx;
					}
				}
				return -1;
			},
			putUniqueKey:function(targetmap, key, value,allmaps){
				if(ThingyUtil.mapWithKey(allmaps,key) === -1){
					targetmap[key] = value;
					return true;
				}
				else{
					return false;
				}
			},
			walkSequenceWithRules:function(rls,sequence,walker){ //todo consider meaningful return value
				var startidx = 0;	
				rls.forEach(function(rule){
					startidx = rule.walkSequence(sequence, walker, startidx);
				});
			},
			walkSequenceWithRulesOrReject:function(rls,sequence,walker,enforcer){
				//arrange to store walk results
				var cachingwalker = new CachingWalker();
				var compoundwalker = new CompoundWalker([walker,cachingwalker]);
				
				//walk
				ThingyUtil.walkSequenceWithRules(rls,sequence,compoundwalker);
				
				//rejected unmatched positions on behalf of the enforcing (parent?) rule
				var pos;
				for(pos = 0; pos < sequence.length; pos++){
					if(ThingyUtil.mapWithKey(pos,cachingwalker.arraysbypos) === -1){
						walker.posRejected(pos,enforcer);
					}
				}
			},
			walkMapWithRules:function(rls,map,walker){ //todo consider meaningful return value
				rls.forEach(function(rule){
					rule.walkMap(map, walker);
				});
			},
			walkMapWithRulesOrReject:function(rls, map, walker, enforcer){
				//arrange to store walk results
				var cachingwalker = new CachingWalker();
				var compoundwalker = new CompoundWalker(walker,cachingwalker);
				
				//walk
				ThingyUtil.walkMapWithRules(rls,sequence,compoundwalker);
				
				//rejected unmatched names on behalf of the enforcing (parent?) rule
				for(name in map){
					if(ThingyUtil.mapWithKey(name,cachingwalker.arraysbyname) === -1){ 
						walker.nameRejected(name, enforcer);
					}
				}				
			}
		};
		
		/** Error definitions. */
		
		function UnsupportedOperationError(message) {
		    this.name = "UnsupportedOperationError";
		    this.message = (message || "");
		}
		UnsupportedOperationError.prototype = Error.prototype;
		
		function ThingyRuleError(message) {
		    this.name = "ThingyRuleError";
		    this.message = (message || "");
		}
		ThingyRuleError.prototype = Error.prototype;
	
		function ThingyParseError(message) {
		    this.name = "ThingyRuleError";
		    this.message = (message || "");
		}
		ThingyRuleError.prototype = Error.prototype;
		
		
		/** An entity which represents the tree structure of a javascript object or XML document
		 * These have a canonical XML, E4X and DOM form, a snapshot of which can be lazily created
		 * at will when a given form of representation is needed.
		 */
		//todo use closures to protect Thingy's private member variables
		
		function Thingy(){
			this.data = {};
		}
		Thingy.prototype = {
			toString:function(){ return "Thingy"},
			serialiser:new XMLSerializer(),
			setE4X:function(e4x){
				this.data.e4x = ex4;
				this.data.xml = null;
				this.data.dom = null;
			},
			setXML:function(xml){
				this.data.e4x = null;
				this.data.xml = xml;
				this.data.dom = null;
			},
			setDOM:function(dom){
				this.data.e4x = null;
				this.data.xml = null;
				this.data.dom = dom;
			},
			asE4X:function(){
				if( ! ("e4x" in this.data)){
					if("xml" in this.data){
						this.data.e4x = ThingyUtil.xml2e4x(this.data.xml);
					}
					else if("dom" in this.data){
						this.data.e4x = ThingyUtil.dom2e4x(this.data.dom);
					}
				}
				return this.data.e4x;
			},
			asXML:function(){
				if( ! ("xml" in this.data)){
					if("e4x" in this.data){
						this.data.xml = ThingyUtil.e4x2xml(this.data.e4x);
					}
					else if("dom" in this.data){
						this.data.xml = ThingyUtil.dom2xml(this.data.dom);
					}
				}
				return this.data.xml;
			},
			asDOM:function(){
				if( ! ("dom" in this.data)){
					if("e4x" in this.data){
						this.data.dom = ThingyUtil.e4x2dom(this.data.e4x);
					}
					else if("xml" in this.data){
						this.data.dom = ThingyUtil.xml2dom(this.data.xml);
					}
				}
				return this.data.dom;
			},
			bind:function(name,fun){
				if(! ('listeners' in this)){
					this.listeners = {};
				}
				if(! (name in this.listeners)){
					this.listeners[name]=[];
				}
				this.listeners[name].push(fun);
			},
			unbind:function(name,fun){ //removes singe instance of fun from listener array named 'name' 
				var found = false;
				if('listeners' in this){
					if(name in this.listeners){
						var num_before = this.listeners[name].length;
						if(num_before){
							this.listeners[name] = this.listeners[name].filter(function(item){
								if(!found && item === fun){
									found = true;
									return false;
								}
								return true;
							});
							if(found && num_before===1){
								delete this.listeners[name]; //remove empty array
								var propname;
								for(propname in this.listeners){ 
									return found;
								}
								delete this.listeners; //remove empty object
							}
						}
					}
				}
				return found;
			},
			traverseListeners:function(name,fun){
				if('listeners' in this){
					if(name in this.listeners){
						this.listeners[name].forEach(fun);
					}
				}
			},
		}
		
		function ContainerThingy(){
			this.children = [];
			if(arguments[0] instanceof Node){ //creation from values in DOM node
				var container = this;
				YOURX.cloneArray(arguments[0].childNodes).forEach(function(item){
					var thingy = YOURX.ThingyUtil.dom2thingy(item);
					if(thingy !== null){
						container.addThingy(thingy);						
					}
				});
			}
			else{
				this.children = this.children.concat(arguments[0]);
			}
			Thingy.apply(this,[]);
		}
		ContainerThingy.prototype = new Thingy();
		ContainerThingy.prototype.getChildren = function(){
			if(arguments.length > 0 && arguments[0] instanceof Function){ //traverse and subscribe for future new children
				var onadd = arguments[0];
				this.bind('childadded',onadd);
				var parent = this;
				this.children.forEach(function(item, idx){
					onadd(parent, item, idx);
				});
			}
			if(arguments.length > 1 && arguments[1] instanceof Function){ //subscribe for future child removal
				var onremove = arguments[1];
				this.bind('childremoved',onremove);
			}
			return this.children;				
		}
		ContainerThingy.prototype.addThingy = function(thingy){
			return this.addChild(thingy);
		}
		ContainerThingy.prototype.removeThingy = function(thingy){
			return this.removeChild(thingy);
		}
		ContainerThingy.prototype.addChild = function(){
			if(arguments.length > 0){
				if(arguments[0] instanceof Thingy){
					var child = arguments[0]; 
					var childidx = this.children.push(child);
					var parent = this;
					this.traverseListeners('childadded', function(listener){
						listener(parent,child,childidx);
					});
				}
				else {
					 throw new Error("Malformed invocation of ContainerThingy#addChild()");
				}
			}
		}
		ContainerThingy.prototype.removeChild = function(){
			if(arguments.length > 0){
				if(arguments[0] instanceof Thingy){
					var child = arguments[0];
					var childidx = -1;
					this.children = this.children.filter(function(item,idx){
						if(item === child){
							childidx = idx;
							return false;
						}
						else{
							return true;
						}
					});
					if(childidx != -1){
						var parent = this;
						this.traverseListeners('childremoved', function(listener){
							listener(parent,child,childidx);
						});						
					}
				}
				else {
					 throw new Error("Malformed invocation of ContainerThingy#addChild()");
				}
			}
		}
		ContainerThingy.prototype.addNode=function(node){
			var thingy = ThingyUtil.dom2thingy(node);
			this.addChild(thingy);
		}		
		
		function ContentThingy(value){
			this.value = value;
			this.setvaluelisteners = [];
			Thingy.apply(this,[]);
		}
		ContentThingy.prototype = new Thingy();
		ContentThingy.prototype.getValue = function(){
			if(arguments.length == 1 && arguments[0] instanceof Function){
				var callback = arguments[0];
				this.bind('valuechanged',callback);
				callback(this,this.value,this.value);//common with setValue firing signature				
			}
			else{
				return this.value;
			}
		}
		ContentThingy.prototype.setValue = function(value){
			var oldvalue = this.value;
			this.value = value;
			var source = this;
			this.traverseListeners('valuechanged',function(listener){
				listener(source,source.value,oldvalue);
			});
		}
		
		function RootThingy(){
			ContainerThingy.apply(this,arguments);
		}
		RootThingy.prototype = new ContainerThingy();
		
		function ElementThingy(){
			this.attributes = {}; //hashmap for indexing AttributeThingy children
			if(arguments[0] instanceof Element){ //creation from values in DOM node
				var el = arguments[0];
				this.name = el.nodeName;
				ContainerThingy.apply(this,[el]);
				var elthingy = this;
				YOURX.cloneArray(el.attributes).forEach(function(item){
					var thingy = ThingyUtil.dom2thingy(item);
					if(thingy !== null){
						elthingy.addAttribute(thingy);						
					}
				});
				return this;
			}
			else if(arguments[0] instanceof String){ //creation from values directly
				this.name = arguments[0];
				var children;
				if(arguments[1] instanceof Array){
					children = [].concat(arguments[1]);
					ContainerThingy.apply(this,[arguments[2]]);
					return this;
				}
				else if(arguments[1] !== null && arguments[2] instanceof Array){
					ContainerThingy.apply(this,[arguments[2]]);
					for(name in arguments[1]){
						addAttribute(name,attributes[name]);
					}
					return this;
				}				
			}
			throw new Error("Malformed invocation of ElementThingy constructor");
		}
		ElementThingy.prototype = new ContainerThingy();
		ElementThingy.prototype.getName = function(){
			return this.name;
		}
		ElementThingy.prototype.addNode=function(node){
			var thingy = ThingyUtil.dom2thingy(node);
			if(thingy instanceof AttributeThingy){
				this.addAttribute(thingy);			
			}
			else{
				ContainerThingy.prototype.addNode.apply(this,arguments);
			}
		}		
		ElementThingy.prototype.addAttribute = function(){ //adds attributethingy child
			var name,value,thingy;
			if(arguments.length == 1 && 
				(thingy = arguments[0]) instanceof AttributeThingy){
				name=thingy.name;
				value=thingy.value;
			}
			else if(arguments.length == 2 && 
				(name = arguments[0]) instanceof String && 
				(value = arguments[1]) instanceof String){
				thingy = new AttributeThingy(name,value);
			}
			else{
				throw new Error("Malformed invocation to ElementThingy#addAttribute() method");
			}
			
			if(name in this.attributes){ //remove pre-existing value 
				removeAttribute(name);
			}
			this.attributes[name]=thingy; //add new thingy to hashmap
			var source = this;
			this.traverseListeners('attributeadded',function(listener){
				listener(source,thingy);
			});
		}
		ElementThingy.prototype.removeAttribute = function(){ //removes attributethingy child
			if(arguments.length == 1){
				var name;
				var oldthingy = null;
				if(arguments[0] instanceof AttributeThingy){
					oldthingy = arguments[0];
					name=oldthingy.name;
				}
				else if(arguments[0] instanceof String ){
					name = arguments[0];
				}
				else{
					throw new Error("Malformed invocation of ElementThingy#removeAttribute()");									
				}
				
				if(name in this.attributes){ //remove pre-existing value 
					if(oldthingy){
						if(oldthingy !== this.attributes[name]){
							throw new Error(oldthingy + " not an attribute of " + this);						
						}						
					} 
					else{
						oldthingy = this.attributes[name];
					}
					delete this.attributes[name]; //remove from hashmap
					var source = this;
					this.traverseListeners('attributeremoved',function(listener){
						listener(source,oldthingy);
					});
					return oldthingy;
				}
				else{
					throw new Error("No attribute named " + name + " in ElementThingy");
				}			
			}
			else{
				throw new Error("Malformed invocation of ElementThingy#removeAttribute()");				
			}
		}
		ElementThingy.prototype.getAttributeThingy = function(name){
			if(name in this.attributes){
				return this.attributes[name];				
			}
			else{
				return null;
			}
		}
		ElementThingy.prototype.hasAttribute = function(name){
			return name in this.attributes;
		}
		ElementThingy.prototype.getAttribute = function(name){
			if (name in this.attributes) {
				return this.attributes[name].value;
			}
			else {
				return null;
			}
		}
		ElementThingy.prototype.getAttributes = function(){
			if(arguments.length > 0 && arguments[0] instanceof Function){ //traverse and subscribe for future new attributes
				var onadd = arguments[0];
				this.bind('attributeadded',onadd);
				var attname;
				for(attname in this.attributes){
					onadd(this, this.attributes[attname]);					
				}
			}
			if(arguments.length > 1 && arguments[1] instanceof Function){ //subscribe for future attribute removal
				var onremove = arguments[1];
				this.bind('attributeremoved',onremove);
			}
			return this.attributes;				
		}
		ElementThingy.prototype.addThingy = function(){
			if(arguments[0] instanceof AttributeThingy){
				return this.addAttribute(arguments[0]);
			}
			else{
				return ContainerThingy.prototype.addChild.apply(this,arguments); //call superclass addChild							
			}
		}
		ElementThingy.prototype.removeThingy = function(){
			if(arguments[0] instanceof AttributeThingy){
				return this.removeAttribute(arguments[0]);
			}
			else{
				return ContainerThingy.prototype.removeChild.apply(this,arguments); //call superclass addChild							
			}
		}
		
		function AttributeThingy(){
			if(arguments.length == 1 && arguments[0] instanceof Attr){ //creation from values in DOM node
				var att = arguments[0];
				this.name = att.name;
				var value = att.value;
			}
			else if(arguments.length == 2 && arguments[0] instanceof String && arguments[1] instanceof String){ //creation from values directly
				this.name = arguments[0];
				var value = arguments[1];
			}
			else{
				throw new Error("Malformed arguments to AttributeThingy constructor");
			}

			ContentThingy.apply(this,[value]);
		}
		AttributeThingy.prototype = new ContentThingy();
		AttributeThingy.prototype.getName = function(){
			return this.name;
		}
		
		function TextThingy(){
			if(arguments.length > 0 && arguments[0] instanceof Text){  //creation from values in DOM node
				var value = arguments[0].data;
			}
			else{
				var value = arguments[0];
			}
			ContentThingy.apply(this,[value]);
		}
		TextThingy.prototype = new ContentThingy();
		
		function ThingyRule(children){
			this.children = [].concat(children);
		}
		ThingyRule.prototype = {
			toString:function(){ return "ThingyRule"},
			getChildren:function(){
				return this.children;
			},
			/** Calls back with rule-specific event notifications 
			 * if the walker has matching signature.
			 */
			walkSequence:function(ths, walker, startidx){
				throw new UnsupportedOperationError("Walk not yet implemented");
			}
		}
		
		function ContainerThingyRule(){}
		ContainerThingyRule.prototype = new ThingyRule();
		/** Walks children along with child rules.
		 * Any existing children trigger exactly one of either
		 * an posAccepted or posRejected call for their position.
		 * Any missing children can trigger a posRequired call.
		 * @param {Object} thingy
		 * @param {Object} childwalker
		 */
		ContainerThingyRule.prototype.walkChildren = function(thingy,childwalker) {
			var childths = thingy.getChildren();
			var childrls = this.getChildren().filter(function(rule){return ! rule instanceof AttributeThingyRule });
			ThingyUtil.walkSequenceOrReject(childrls,childths,childwalker,this);
		}
		ContainerThingyRule.prototype.matchThingy=function(thingy, shallow){
			try{
				if(!shallow){
					var walker = new RecursiveValidationWalker();
					var nonattributerules = this.getChildren().filter(function(child){return ! child instanceof AttributeThingyRule; })
					ThingyUtil.walkSequenceWithRulesOrReject(nonattributerules, thingy.getChildren(), walker);
					return true;
				} 
				else{
					//generic container has no properties of its own
					//validation always satisfied when shallow
					return true;
				}
			}
			catch(e){
				if(e instanceof ThingyRuleError){
					//non conformance triggered an exception
					return false;
				}
				else{
					throw e;
				}
			}
		}

		function ThingyGrammar(){
			if(arguments.length == 1 && arguments[0] instanceof Document){
				var docnoderuleq = $("grammar>start>*", arguments[0]);
				if(docnoderuleq.length == 1){
					ThingyRule.apply(this,[ThingyUtil.dom2rule(docnoderuleq.get(0))]);
				}
				else{
					throw new Error("Could not match a unique document node rule");
				}				
			}
			else{
				throw new Error("Malformed arguments to ThingyGrammar constructor");
			}
		}
		ThingyGrammar.prototype = new ContainerThingyRule();
		ThingyGrammar.prototype.walkSequence = function(sequence, walker, startidx){
			if(sequence[startidx] instanceof RootThingy){
				walker.posAccepted(startidx,this);
			}
			else{
				walker.posRequired(startidx,this);
				walker.posRejected(startidx,this);
			}
		}
				
		function TypedThingyRule(typename, children){
			this.typename = typename;
			ThingyRule.apply(this,[children]);
		}
		TypedThingyRule.prototype = new ThingyRule();
		TypedThingyRule.prototype.matchThingy = function(thingy){
			return thingy instanceof YOURX[this.typename];
		}
		
		function NamedThingyRule(name, typename, children){
			TypedThingyRule.apply(this,[typename, children]);
			this.name = name;
		}
		NamedThingyRule.prototype = new TypedThingyRule();
		NamedThingyRule.prototype.matchThingy = function(thingy){
			if(TypedThingyRule.prototype.matchThingy.apply(this, arguments)){
				return thingy.name === this.name;
			}
			return false;
		}
		
		function ElementThingyRule(){
			if(arguments[0] instanceof Element){ //creation from values in DOM node
				var el = arguments[0];
				if(el.nodeName=="element"){
					var name = el.getAttribute("name");
					if(name){
						var childrules = [];
						YOURX.cloneArray(el.childNodes).forEach(function(item){
							childrules.push(ThingyUtil.dom2rule(item));			
						});
						NamedThingyRule.apply(this,[name, "ElementThingy", childrules]);															
					}
					else{
						throw new Error("Cannot populate ElementThingyRule 'element' DOM element has no 'name' attribute");						
					}
				}
				else{
					throw new Error("Cannot populate ElementThingyRule with DOM element called " + el.nodeName);
				}
			}
			else if(arguments[0] instanceof String){
				NamedThingyRule.apply(this,[arguments[0] /*name*/, "ElementThingy", arguments[1] /*children*/]);				
			}
			else{
				throw new Error("Malformed arguments to ElementThingyRule constructor");
			}
		}
		ElementThingyRule.prototype = (function(){
			var proto = {};
			YOURX.copyProperties(NamedThingyRule.prototype, proto);
			YOURX.copyProperties(ContainerThingyRule.prototype, proto);
			return proto;
		}());
		
		/** Combines shallow matching from NamedThingyRule with recursive behaviour of Container
		 * @param {Object} thingy
		 */
		ElementThingyRule.prototype.matchThingy = function(thingy, shallow){
			if(NamedThingyRule.prototype.matchThingy.apply(this,arguments)){
				return ContainerThingyRule.prototype.matchThingy.apply(this,arguments);
			}
			return false;
		}
		
		ElementThingyRule.prototype.walkSequence = function(sequence,walker,startidx){
			if(this.matchThingy(sequence[startidx])){
				walker.posAccepted(startidx);
			}
			else{
				walker.posRejected(startidx);
				walker.posRequired(startidx);
			}
		}
		
		/** Walks an element's attributes along with attribute rules. 
		 * Each existing attribute triggers exactly one call of either
		 * nameAccepted or nameRejected for that name.
		 * Any missing attributes trigger a nameRequired call for 
		 * that name.
		 * @param {Object} element 
		 * @param {Object} attwalker
		 */
		ElementThingyRule.prototype.walkAttributes= function(thingy,attwalker) {
			var attrls = this.getChildren().filter(function(rule){return rule instanceof AttributeThingyRule;});
			ThingyUtil.walkMapWithRulesOrReject(attrls,this.getAttributes(),attwalker);
		}
				
		function AttributeThingyRule(){
			var children = []; //Attribute rules have no children - force empty child array
			if(arguments[0] instanceof Element){ //creation from values in DOM node
				var el = arguments[0];
				if(el.nodeName=="attribute"){
					var name = el.getAttribute("name");
					if(name){
						NamedThingyRule.apply(this,[name, "AttributeThingy", children]);						
					}
					else{
						throw new Error("Cannot populate AttributeThingyRule, 'attribute' DOM element has no 'name' attribute");
					}
				}
				else{
					throw new Error("Cannot populate AttributeThingyRule with DOM element called " + el.nodeName);
				}
			}
			else if(arguments[0] instanceof String){
				NamedThingyRule.apply(this,[arguments[0] /*name*/, "AttributeThingy", children]); 
			}
			else{
				throw new Error("Malformed arguments to AttributeThingyRule constructor");
			}
		}
		AttributeThingyRule.prototype = new NamedThingyRule();
		AttributeThingyRule.prototype.matchThingy = function(thingy,shallow){ //for v001 shallow is not yet relevant
			if(thingy instanceof AttributeThingy){
				return thingy.name === this.name;
			}
			return false;
		}
		AttributeThingyRule.prototype.walkMap = function(map,walker){
			if(this.name in map){ //for v001 this is the simplest validation
				var thingy = map[this.name];
				if(this.matchThingy(thingy)){
					walker.nameAccepted(this.name, this);					
				}
				else{
					walker.nameRejected(this.name, this);
				}
			} 
			else{
				walker.nameRequired(this.name, this);
			}
		}

		function TextThingyRule(){
			TypedThingyRule.apply(this,['TextThingy',[]]); //Text rules have no children - empty child array
		}
		TextThingyRule.prototype = new TypedThingyRule();
		
		function OptionalThingyRule(){
			ThingyRule.apply(this,arguments);	
		}
		OptionalThingyRule.prototype = new ThingyRule();
		
		function ZeroOrMoreThingyRule(){ /** Repeats the consumption of its child rules until they stop consuming. */
			ThingyRule.apply(this,arguments);	
		}
		ZeroOrMoreThingyRule.prototype = new ThingyRule();		
		
		function OneOrMoreThingyRule(){
			ThingyRule.apply(this,arguments);	
		}
		OneOrMoreThingyRule.prototype = new ThingyRule();
		
		/** A Walker allows pluggable exception throwing and termination behaviour
		 * for validation routines. When a schema rule requires a change to a parent node
		 * it can invoke the corresponding method on this object and, depending on the 
		 * validation scenario, the model may choose to accept the change, or terminate 
		 * immediately with it's choice of exception to flag the state to enclosing code.
		 * 
		 * In this way, match and validation routines can be stricter (immediate termination) 
		 * than autocompletion routines (which may continue to accept a sequence of required changes).  
		 * 
		 */ 
		
		function SequenceWalker(){};
		SequenceWalker.prototype.posAccepted = function(pos, rule){
			throw new UnsupportedOperationError("posAccepted() not yet implemented");
		};
		SequenceWalker.prototype.posRejected = function(pos, rule){
			throw new UnsupportedOperationError("posRejected() not yet implemented");
		};		
		SequenceWalker.prototype.posRequired = function(pos, rule){
			throw new UnsupportedOperationError("posRequired() not yet implemented");
		};		

		function MapWalker(){};
		MapWalker.prototype.nameAccepted = function(name, rule){
			throw new UnsupportedOperationError("nameAccepted() not yet implemented");
		};
		MapWalker.prototype.nameRejected = function(name, rule){
			throw new UnsupportedOperationError("nameRejected() not yet implemented");
		};
		MapWalker.prototype.nameRequired = function(name, rule){
			throw new UnsupportedOperationError("nameRequired() not yet implemented");
		};
		
		function ElementWalker(){};
		ElementWalker.prototype = (function(){
			var proto = {};
			YOURX.copyProperties(SequenceWalker.prototype,proto);
			YOURX.copyProperties(MapWalker.prototype,proto);
			return proto;
		}());
		
		function CachingWalker(){
			//child arrays indexed by position
			this.acceptedpos = {}; 
			this.rejectedpos = {};
			this.requiredpos = {};
			this.arraysbypos = [this.acceptedpos,this.rejectedpos,this.requiredpos];
			//attribute arrays indexed by name
			this.acceptedname = {};
			this.rejectedname = {};
			this.requiredname = {};
			this.arraysbyname = [this.acceptedname,this.rejectedname,this.requiredname];
		};
		CachingWalker.prototype = (function(){
			var proto = new ElementWalker();
			YOURX.copyProperties({
				posAccepted:function(pos, rule){ 
					if(!putUniqueKey(this.acceptedpos, pos, rule,this.arraysbypos)){
						throw new ThingyRuleError("Pos " + pos + " already claimed by another rule");
					}
				},
				posRejected:function(pos, rule){ 
					if(!putUniqueKey(this.rejectedpos, pos, rule,this.arraysbypos)){
						throw new ThingyRuleError("Pos " + pos + " already claimed by another rule");
					}
				},
				posRequired:function(pos, rule){ 
					if(!putUniqueKey(this.requiredpos, pos, rule, this.arraysbypos)){
						throw new ThingyRuleError("Pos " + pos + " already claimed by another rule");
					}
				},
				nameAccepted:function(name, rule){ 
					if(!putUniqueKey(this.acceptedname, name, rule,this.arraysbyname)){
						throw new ThingyRuleError("Name " + name + " already claimed by another rule");
					}
				},
				nameRejected:function(name, rule){ 
					if(!putUniqueKey(this.rejectedname, name, rule,this.arraysbyname)){
						throw new ThingyRuleError("Name " + name + " already claimed by another rule");
					}
				},
				nameRequired:function(name, rule){ 
					if(!putUniqueKey(this.requiredname, name, rule, this.arraysbyname)){
						throw new ThingyRuleError("Name " + name + " already claimed by another rule");
					}
				}
			},proto);
			return proto;
		}());
				
		function ValidationWalker(){};
		ValidationWalker.prototype = new ElementWalker();	
		ValidationWalker.prototype.nameAccepted = function(name,rule){
			//do nothing
		}
		ValidationWalker.prototype.nameRejected = function(name,rule){
			throw new ThingyRuleError("Attribute rejected");
		}
		ValidationWalker.prototype.nameRequired = function(name,rule){
			throw new ThingyRuleError("Attribute missing");
		}		
		ValidationWalker.prototype.posAccepted = function(pos,rule){
			//do nothing
		}
		ValidationWalker.prototype.posRejected = function(pos,rule){
			throw new ThingyRuleError("Thingy at pos " + pos + " rejected");
		}
		ValidationWalker.prototype.posRequired = function(pos,rule){
			throw new ThingyRuleError("Child missing");
		}
		
		function RecursiveValidationWalker(parent){
			this.parent = parent;
		};
		RecursiveValidationWalker.prototype = new ValidationWalker();
		RecursiveValidationWalker.prototype.posAccepted = function(pos,rule){
			var child = this.parent.getChildren()[pos];
			ThingyUtil.walkSequence(child.getChildren(),rule.getChildren(),new RecursiveValidationWalker(child));
		}
		
		function CompoundWalker(wrapped){
			this.wrapped = [].concat(wrapped);
		};
		CompoundWalker.prototype = new ElementWalker();
		CompoundWalker.prototype.nameAccepted = function(name,rule){
			this.wrapped.forEach(function(walker){walker.nameAccepted(name,rule);});
		}
		CompoundWalker.prototype.nameRejected = function(name,rule){
			this.wrapped.forEach(function(walker){walker.nameRejected(name,rule);});
		}
		CompoundWalker.prototype.nameRequired = function(name,rule){
			this.wrapped.forEach(function(walker){walker.nameRequired(name,rule);});
		}		
		CompoundWalker.prototype.posAccepted = function(pos,rule){
			this.wrapped.forEach(function(walker){walker.posAccepted(pos,rule);});
		}
		CompoundWalker.prototype.posRejected = function(pos,rule){
			this.wrapped.forEach(function(walker){walker.posRejected(pos,rule);});
		}
		CompoundWalker.prototype.posRequired = function(pos,rule){
			this.wrapped.forEach(function(walker){walker.posRequired(pos,rule);});
		}
		
		var toeval = YOURX.writeScopeExportCode([
			"ThingyUtil",
			"Thingy","RootThingy","ContentThingy","ElementThingy","AttributeThingy","TextThingy",
			"ThingyGrammar","ThingyRule","ElementThingyRule","AttributeThingyRule","TextThingyRule","OptionalThingyRule","ZeroOrMoreThingyRule","OneOrMoreThingyRule",
			"ThingyRuleError", "UnsupportedOperationError"
		]);
		
		//evaluate the export function in this scope	
		return eval(toeval);
			
	}()),
	'YOURX'
);