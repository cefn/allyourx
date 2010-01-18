YOURX.copyProperties(
	function(){
			
		/** Utility methods in a 'static' library object */		
		var ThingyUtil = { //TODO consider reusing single static DOMParser and XMLSerializer
			log:function(msg){$(function(){$('body').prepend(msg + <br/>.toXMLString())});},
			xml2e4x:function(xml){ return new XML(ThingyUtil.xmlStripComments(xml));},
			xml2dom:function(xml){ return (new DOMParser()).parseFromString(xml,"text/xml");},
			e4x2xml:function(e4x){ return e4x.toXMLString();},
			e4x2dom:function(e4x){ return ThingyUtil.xml2dom(ThingyUtil.e4x2xml(e4x));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
			dom2e4x:function(dom){ return new XML(ThingyUtil.dom2xml(dom));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
			dom2xml:function(dom){ return (new XMLSerializer()).serializeToString(dom);},
			dom2thingy:function(node) {
				if(node instanceof Document){
					return new ContainerThingy(node);					
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
			greedyConsumeSequence:function(rls, ths, skip) {
				var origths = ths;
				var rlidx = 0, totalconsumed = [];
				while(rlidx < rls.length){
					consumed = rls[rlidx].greedyConsume(ths, skip);
					if(consumed.length > 0){
						ths = ths.slice(consumed[consumed.length-1], ths.length);
						totalconsumed = totalconsumed.concat(consumed);
					}
					rlidx++;
				};
				return totalconsumed;
			},
			greedyMatchIndex:function(matchfun,ths,skip){
				var pos;
				for(pos = 0;(skip?pos==0:pos<ths.length);pos++){
					if(matchfun(ths[pos])){
						return pos;
					}
				}
				return -1;
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
			setRule:function(rule){
				this.rule = rule;
			},
			getRule:function(){
				return this.rule;
			},
			matchRule:function(){
				if(this.getRule()!=null){
					var matchedindices = ThingyUtil.greedyConsumeSequence([this.getRule()],[this], false);
					if(matchedindices instanceof Array){
						if(matchedindices.length == 1){
							if(matchedindices[0] == 0){
								return true;
							}
						}
					}
					return false;
				}
				else{
					throw new Error("No rule associated with thingy. Cannot match.");
				}
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
				this.children.forEach(function(item){
					onadd(parent, item);
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
					this.children.push(child);
					var parent = this;
					this.traverseListeners('childadded', function(listener){
						listener(parent,child);
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
					this.children = this.children.filter(function(item){return item != arguments[0] ? item : false;});
					var parent = this;
					this.traverseListeners('childremoved', function(listener){
						listener(parent,child);
					});
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
			autoPopulate:function(parent, caret, dryrun){ /** Populates descendants with the structural Thingys required by this rule. */
				throw new UnsupportedOperationError("No autoPopulate function has been implemented for " + typeof(this));
			},
			/**@param {Thingy[]} ths A Thingy array of candidates to match.
			 * @param {boolean} skip If true, skip non-matching items in order to find matching ones.
			 * @return {integer[]} Array containing the index of each candidate Thingy consumed by a single match to this rule. 
			 */
			greedyConsume:function(ths, skip){ /** 	@return if the rule has been satisfied the indexes of matched thingies 
												 		if the rule cannot be satisfied, should throw error */
				throw new UnsupportedOperationError("No production rule has been implemented for " + typeof(this));
			},
			getChildren:function(){
				return this.children;
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
		ThingyGrammar.prototype = new ThingyRule();
		ThingyGrammar.prototype.autoPopulate = function(parent, caret, dryrun){
			throw new UnsupportedOperationError("Not yet implemented");
			caret = (caret == 0 ? 0 : caret);
			var childnodes = YOURX.cloneArray(parent.getChildren());
			var childrules = YOURX.cloneArray(this.getChildren());
		}
		ThingyGrammar.prototype.greedyConsume=function(ths, skip){
			if(ths.length==1){ //match one node
				if(ths[0] instanceof ContainerThingy){ //match root node
					var documentnodes = ths[0].getChildren();
					if(documentnodes.length == 1){
						if(documentnodes[0] instanceof ElementThingy ){ //match singleton document node
							ThingyUtil.greedyConsumeSequence(this.getChildren(),documentnodes);
							return [0];
						}
						else{
							throw new ThingyRuleError("ThingyGrammar requires ContainerThingy to contain a singleton document ElementThingy");
						}						
					}
					else{
						throw new ThingyRuleError("ThingyGrammar requires a single document ElementThingy: " + documentnodes.length + " items provided.");
					}
				}
				else{
					throw new ThingyRuleError("ThingyGrammar requires a root ContainerThingy.");
				}
			}
			else{
				throw new ThingyRuleError("ThingyGrammar can match exactly one ContainerThingy: " + ths.length + " items provided.");
			}
		}
		
		function OptionalThingyRule(){
			ThingyRule.apply(this,arguments);	
		}
		OptionalThingyRule.prototype = new ThingyRule();
		OptionalThingyRule.prototype.greedyConsume=function(ths){
			try{
				ThingyUtil.greedyConsumeSequence(this.getChildren(),ths);
			}
			catch(e){
				if(e instanceof ThingyRuleError){ //the Optional structure is not actually there - consume nothing
					return 0;	
				}
				else{
					throw e;
				}
			}
		
		}
		
		function ZeroOrMoreThingyRule(){ /** Repeats the consumption of its child rules until they stop consuming. */
			ThingyRule.apply(this,arguments);	
		}
		ZeroOrMoreThingyRule.prototype = new ThingyRule();
		ZeroOrMoreThingyRule.prototype.greedyConsume = function(ths){
			var origths = ths, consumed = 0;
			do{
				consumed = ThingyUtil.greedyConsumeSequence(this.getChildren(),ths);
				ths = ths.slice(consumed, ths.length);
			} while((consumed > 0) &&  (ths.length > 0));
			return origths.length - ths.length; //zero consumed is allowed
		}
		
		
		function OneOrMoreThingyRule(){
			ThingyRule.apply(this,arguments);	
		}
		OneOrMoreThingyRule.prototype = new ThingyRule();
		OneOrMoreThingyRule.prototype.greedyConsume = function(ths){
			var consumed = ZeroOrMoreThingyRule.prototype.greedyConsume.apply(this,[ths]);
			if(consumed > 0){
				return consumed;
			}
			else{ //zero consumed is not allowed
				throw new ThingyRuleError("One or more rule requires at least one item");
			}
		}
		
		function TypedThingyRule(typename, children){
			this.typename = typename;
			ThingyRule.apply(this,[children]);
		}
		TypedThingyRule.prototype = new ThingyRule();
		TypedThingyRule.prototype.getTypeName = function(){
			return this.typename;
		}
		TypedThingyRule.prototype.getType = function(){
			return YOURX[this.typename]; 
		}
		TypedThingyRule.prototype.greedyConsume = function(ths, skip){
			if(ths.length > 0){
				var matchtype = this.getType();
				var matchfun = function(candidate){ return candidate instanceof matchtype;};
				var matchidx = ThingyUtil.greedyMatchIndex(matchfun, ths, skip);
				if(matchidx != -1){
					return [matchidx]; //prescribed return format; array of match indices
				}
				else{
					throw new ThingyRuleError("No Thingy of the correct type : " + this.getTypeName() + " found");
				}
			}
			else{
				throw new ThingyRuleError("No available thingy");
			}
		}
		
		function NamedThingyRule(name, typename, children){
			this.name = name;
			TypedThingyRule.apply(this,[typename, children]);
		}
		NamedThingyRule.prototype = new TypedThingyRule();
		NamedThingyRule.prototype.greedyConsume = function(ths, skip){
			var consumed = TypedThingyRule.prototype.greedyConsume.apply(this,[ths, skip]);
			if(consumed.length == 1){
				if(ths[consumed[0]].name == this.name){
					return consumed;
				}
				else{
					throw new ThingyRuleError("Thingy of correct type : " + this.getTypeName() + " has incorrect name : " + ths[consumed[0]].name);
				}						
			}
			else{
				throw new ThingyRuleError("Could not find match for " + this.getTypeName() + " " + ths[consumed[0]].name);
			}
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
		ElementThingyRule.prototype = new NamedThingyRule();
		ElementThingyRule.prototype.autoPopulate = function(parent, caret, dryrun){
			if(!caret){
				caret  = 0;
			}
			if(parent.getChildren().length > caret){
				var candidate;
				if((candidate = parent.getChildren()[caret]) instanceof ElementThingy && 
					candidate.name == this.name){
					return 0;
				}
			} 
			if(!dryrun){
				parent.addChild(new ElementThingy(this.name));				
			}
			return 1;
		}
		ElementThingyRule.prototype.greedyConsume = function(ths, skip){ //attribute matching and child matching is subsumed by element matching
			var consumed = NamedThingyRule.prototype.greedyConsume.apply(this, [ths, skip]);
			if(consumed.length == 1){
				var candidate = ths[consumed[0]];
				var attmap = candidate.getAttributes();
				var otherths = candidate.getChildren();
				var attrls = [], otherrls = [];
				this.getChildren().forEach(function(item){
					if(item instanceof AttributeThingyRule){
						attrls.push(item);
					}
					else{
						otherrls.push(item);
					}
				});
				
				var attconsumedmap = {};
				attrls.forEach(function(rule){
					var attthingy = candidate.getAttributeThingy(rule.name);
					if(attthingy !== null){
						var attconsumed = rule.greedyConsume([attthingy]);
						if(attconsumed.length != 1){ //check all attribute rules are satisfied
							throw new ThingyRuleError("ElementThingy match failed due to " + rule);
						}
						else if(rule.name in attconsumedmap){ //check only one attribute rule per attribute name
							throw new ThingyRuleError("Invalid schema has more than one rule addressing the same attribute");
						}
						else{ //store for later check of unmatched attributes
							attconsumedmap[rule.name] = attthingy;
						}
					}
					else{
						throw new ThingyRuleError("No matching attribute named " + rule.name);
					}
				});
				
				var attmap = candidate.getAttributes();
				var attname;
				for(attname in attmap){
					if( ! (attname in attconsumedmap) ){
						throw new ThingyRuleError("Unmatched attribute " + name);
					}
				}
				
				var otherconsumed = ThingyUtil.greedyConsumeSequence(otherrls,otherths,skip);
				
				//all attribute rules and child rules are satisfied (no exceptions thrown)
				//check all items are consumed after satisfying the rules
				if(otherconsumed.length == otherths.length){  
					return consumed;
				}
				else{ //*consumed should never be greater than *ths.length
					throw new ThingyRuleError("Unmatched child elements in " + this);
				}
			}
			else{
				throw new ThingyRuleError("Could not find match for " + this );
			}
		};
		
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
		AttributeThingyRule.prototype.autoPopulate = function(parent, caret){
			if(parent.hasAttribute(this.name)){
				return 0;
			}
			if(!dryrun){
				parent.addAttribute(this.name,"");
			}
			return 1;
		}
		
		function TextThingyRule(){
			TypedThingyRule.apply(this,['TextThingy',[]]); //Text rules have no children - empty child array
		}
		TextThingyRule.prototype = new TypedThingyRule();

		//evaluate the export function in this scope	
		eval(uneval(YOURX.exportProperties));
	
		return exportProperties([
			"ThingyUtil",
			"Thingy","ContainerThingy","ContentThingy","ElementThingy","AttributeThingy","TextThingy",
			"ThingyGrammar","ThingyRule","ElementThingyRule","AttributeThingyRule","TextThingyRule","OptionalThingyRule","ZeroOrMoreThingyRule","OneOrMoreThingyRule"
		]);
	}(),
	YOURX
);