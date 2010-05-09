YOURX.copyProperties(
	(function(){
					
		/** Utility methods in a 'static' library object */		
		var ThingyUtil = { //TODO consider reusing single static DOMParser and XMLSerializer
			hasher:new Guid(),
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
			/** E4X cant handle XML processing instructions. Strip them out. From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
			xmlStripComments:function(xml){return xml.replace(/<\?(.*?)\?>/g,"");}, 
			/** Iterates over the members of allmaps until one is found containing the given key. 
			 * @param {Array or Object} allmaps A collection which contains maps as members 
			 * @param {String or Integer} itemkey The member sought should have itemkey in its properties
			 * @return The key (position or name) which retrieves the member from allmaps which contains itemkey  
			 */
			mapWithKey:function(allmaps,itemkey){ 
				if(typeof allmaps === "array"){
					var idx;
					for(idx = 0; idx < allmaps.length;idx++){
						if(itemkey in allmaps[idx]){
							return idx;
						}
					}
				}
				else if(typeof allmaps === "object"){
					var name;
					for(name in allmaps){
						if(itemkey in allmaps[name]){
							return name;
						}
					}
				}
				return null;
			},
			/** Checks if a key exists in any member of allmaps before running allmaps[mapkey][itemkey] = item.
			 * @param {Array or Object} allmaps The collection containing maps
			 * @param {String or Integer} mapkey The key of the given map in allmaps, into which the item should be inserted
			 * @param {String or Integer} itemkey The key to insert the item under
			 * @param {Object} item The item to insert
			 */
			putUniqueKey:function(allmaps, mapkey, itemkey, item){
				if(ThingyUtil.mapWithKey(allmaps,itemkey) === null){
					allmaps[mapkey][itemkey] = item;
					return true;
				}
				else{
					return false;
				}
			},
			/** Walks a set of rules over a sequence of Thingies (stored by position), notifying validation events 
			 * @param {Array} rls The rules to validate the Thingies
			 * @param {Array} sequence The Thingies
			 * @param {Walker} walker The walker which monitors the validation events and decides what to do
			 * @return Nothing meaningful yet
			 */
			walkSequenceWithRules:function(rls,sequence,walker){ //todo consider meaningful return value
				var startidx = 0;
				rls.forEach(function(rule){
					startidx = rule.walkSequence(sequence, walker, startidx);
				});
			},
			/** Walks a set of rules over a sequence of Thingies (stored by position), notifying validation events 
			 * and fires a rejection event for any Thingies which are not positively accepted by a rule once the walk has completed.
			 * @param {Array} rls The rules to validate the Thingies
			 * @param {Array} sequence The Thingies
			 * @param {Walker} walker The walker to monitor validation events
			 * @param {Object} enforcer The entity on behalf of which the rejection is fired
			 */
			walkSequenceWithRulesOrReject:function(rls,sequence,walker,enforcer){
				//arrange to store walk results
				var cachingwalker = new CachingWalker();
				var compoundwalker = new CompoundWalker([cachingwalker,walker]);
				
				//walk
				ThingyUtil.walkSequenceWithRules(rls,sequence,compoundwalker);
				
				//rejected unmatched positions on behalf of the enforcing (parent?) rule
				var pos;
				for(pos = 0; pos < sequence.length; pos++){
					if(cachingwalker.getCacheStatus(pos) === null){
						walker.posRejected(pos,enforcer);
					}
				}
			},
			/** Tests if a rule has duck-typing to do a recursive validation walk on descendant Thingies
			 * @param {ThingyRule} rule The rule to walk descendants.
			 */
			canWalkBelow:function(rule){
				return ("walkAttributes" in rule) || ("walkChildren" in rule);
			},
			/** Executes the validation walk on descendant Thingies for a given rule, using
			 * duck-typing to establish the descendants to walk. 
			 * @param {ThingyRule} rule The rule coordinating the validation walk
			 * @param {Thingy} thingy The thingy whose descendants will be walked
			 * @param {Walker} walker The walker monitoring validation events during the walk
			 */
			walkBelow:function(rule,thingy,walker){
				if('walkAttributes' in rule){
					//traverse attributes if an element
					rule.walkAttributes(thingy,walker);
				}
				if('walkChildren' in rule){
					//traverse children for all containers
					rule.walkChildren(thingy,walker);				
				}
			},
			/** Walks a set of rules over a map of Thingies (stored by name), notifying validation events 
			 * @param {Array} rls The rules which should validate the Thingies
			 * @param {Object} map The map of Thingies
			 * @param {Walker} walker The walker monitoring validation events and deciding what to do
			 */
			walkMapWithRules:function(rls,map,walker){ //todo consider meaningful return value
				rls.forEach(function(rule){
					rule.walkMap(map, walker);
				});
			},
			/** Walks a set of rules over a map of Thingies (stored by name), notifying validation events 
			 * and fires a rejection event for any Thingies which are not positively accepted by a rule once the walk has completed.
			 * @param {Array} rls The rules validating the Thingies
			 * @param {Object} map The map of Thingies
			 * @param {Walker} walker The walker monitoring validation events and deciding what to do
			 * @param {Object} enforcer The entity on behalf of which the rejection is fired
			 */
			walkMapWithRulesOrReject:function(rls, map, walker, enforcer){
				//arrange to store walk results
				var cachingwalker = new CachingWalker();
				var compoundwalker = new CompoundWalker([cachingwalker,walker]);
				
				//walk
				ThingyUtil.walkMapWithRules(rls,map,compoundwalker);
				
				//rejected unmatched names on behalf of the enforcing (parent?) rule
				for(name in map){
					if(cachingwalker.getCacheStatus(name) === null){ 
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
		
		/** An entity which represents the tree structure of a javascript object or XML document
		 * These have a canonical XML, E4X and DOM form, a snapshot of which can be lazily created
		 * at will when a given form of representation is needed.
		 */
		
		//TODO use closures to protect Thingy's private member variables
		//TODO implement basic unit tests for e4x, xml and dom transformations 
		
		function Thingy(){
			this.source = {};
			this.map = {};
			
			//privately stored lazily created hashcode
			var hash = null;
			this.hashCode = function(){
				if(!hash){
					hash = ThingyUtil.hasher.generate();
				}
				return hash;
			}
		}
		Thingy.prototype = {
			toString:function(){ return "Thingy"},
			serialiser:new XMLSerializer(),
			/** Always returns existing value for key. Overwrites new value if provided. Purpose similar to JQuery data() function. */
			data:function(key, newval){
				var oldval = (key in map ? map[key] : null); 
				if(newval){
					map[key] = newval;
				}
				return oldval;
			},
			setE4X:function(e4x){
				this.source.e4x = ex4;
				this.source.xml = null;
				this.source.dom = null;
			},
			setXML:function(xml){
				this.source.e4x = null;
				this.source.xml = xml;
				this.source.dom = null;
			},
			setDOM:function(dom){
				this.source.e4x = null;
				this.source.xml = null;
				this.source.dom = dom;
			},
			asE4X:function(){
				if( ! ("e4x" in this.source)){
					if("xml" in this.source){
						this.source.e4x = ThingyUtil.xml2e4x(this.source.xml);
					}
					else if("dom" in this.source){
						this.source.e4x = ThingyUtil.dom2e4x(this.source.dom);
					}
				}
				return this.source.e4x;
			},
			asXML:function(){
				if( ! ("xml" in this.source)){
					if("e4x" in this.source){
						this.source.xml = ThingyUtil.e4x2xml(this.source.e4x);
					}
					else if("dom" in this.source){
						this.source.xml = ThingyUtil.dom2xml(this.source.dom);
					}
				}
				return this.source.xml;
			},
			asDOM:function(){
				if( ! ("dom" in this.source)){
					if("e4x" in this.source){
						this.source.dom = ThingyUtil.e4x2dom(this.source.e4x);
					}
					else if("xml" in this.source){
						this.source.dom = ThingyUtil.xml2dom(this.source.xml);
					}
				}
				return this.source.dom;
			},
			/** Binds objects or functions to arbitrary event names triggered by this Thingy, by storing them in dynamically created arrays.
			 * @param {Object} name The event name to bind against
			 * @param {Object} fun The object or function to subscribed to the event name
			 */
			bind:function(name,fun){
				if(! ('listeners' in this)){
					this.listeners = {};
				}
				if(! (name in this.listeners)){
					this.listeners[name]=[];
				}
				this.listeners[name].push(fun);
			},
			/** Unbinds objects or functions from arbitrary event names triggered by this Thingy, by removing them from dynamically created arrays 
			 * and disposing of the arrays when empty.
			 * @param {Object} name The event name to unbind from
			 * @param {Object} fun The object or function to unsubscribe from the event name
			 */
			unbind:function(name,fun){ //removes single instance of fun from listener array named 'name' 
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
			/** Executes the given function once for each listener object or function found in the binding array for the event name.
			 * @param {Object} name The event name
			 * @param {Object} fun The function to invoke for each listener
			 */
			traverseListeners:function(name,fun){
				if('listeners' in this){
					if(name in this.listeners){
						this.listeners[name].forEach(fun);
					}
				}
			},
		}
		
		/** Represents a Thingy which can contain a sequence of children, each of which has a numerical position, starting at 0 
		 * Can be constructed by passing a DOM whose tree should be recursively replicated in terms of Thingies, 
		 * or an array of child Thingies to store. 
		 */
		function ContainerThingy(){
			this.children = [];
			if(arguments.length > 0){
				if(arguments[0] instanceof Node){ //creation from values in DOM node
					var container = this;
					YOURX.cloneArray(arguments[0].childNodes).forEach(function(item){
						var thingy = YOURX.ThingyUtil.dom2thingy(item);
						if(thingy !== null){
							container.addThingy(thingy);						
						}
					});
				}
				else {
					this.children = this.children.concat(arguments[0]);
				}				
			}
			Thingy.apply(this,[]);
		}
		ContainerThingy.prototype = new Thingy();
		/** Can be invoked empty to just return the array of children,  
		 * passing one function to get childadded events for all children now and in the future
		 * or passing two functions to get childremoved events in the future too 
		 */
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
		/** Alias for addChild, given all descendants of a generic ContainerThingy are its children. */
		ContainerThingy.prototype.addThingy = function(thingy){
			return this.addChild(thingy);
		}
		/** Alias for removeChild, given all descendants of a generic ContainerThingy are its children. */
		ContainerThingy.prototype.removeThingy = function(thingy){
			return this.removeChild(thingy);
		}
		/** Adds a child and notifies listeners. */
		ContainerThingy.prototype.addChild = function(){
			var child = null;
			var childidx = -1;
			if(arguments.length > 0 && arguments[0] instanceof Thingy){
				child = arguments[0]; 
				if(arguments.length === 1){
					childidx = this.children.push(child);
				}
				else if(arguments.length === 2 && typeof(arguments[1]) === "number"){
					childidx = arguments[1];
					this.children.splice(childidx,0,child);
				} 
			}
			
			if(child && childidx !== -1){
				//notify listeners if successful
				var parent = this;
				this.traverseListeners('childadded', function(listener){
					listener(parent,child,childidx);
				});
				return child;				
			}
			else{
				throw new Error("Malformed invocation of ContainerThingy#addChild()");									
			}
		};
		/** Removes a child and notifies listeners. */
		ContainerThingy.prototype.removeChild = function(){
			var child = null;
			var childidx = -1;
			if(arguments.length === 1){
				if(arguments[0] instanceof Thingy){
					child = arguments[0];
					this.children = this.children.filter(function(item,idx){
						if(item === child){
							childidx = idx;
							return false;
						}
						else{
							return true;
						}
					});
				}
				else if(typeof(arguments[0]) === "number"){
					childidx = arguments[0];
					child = children[childidx];
					this.children.splice(childidx,1);
				}

			}

			if(child && childidx != -1){
				var parent = this;
				this.traverseListeners('childremoved', function(listener){
					listener(parent,child,childidx);
				});		
				return child;				
			}
			else{
				throw new Error("Malformed invocation of ContainerThingy#addChild()");				
			}
			
		};
		/** Adds a thingy constructed dynamically to mirror a given DOM node. */
		ContainerThingy.prototype.addNode=function(node){
			this.addThingy(ThingyUtil.dom2thingy(node));
		}		
		
		/** Represents a content item which simply stores a value, such as an Attribute or a Text node. 
		 * @param {Object} value The value to store
		 */
		function ContentThingy(value){
			this.value = value;
			this.setvaluelisteners = [];
			Thingy.apply(this,[]);
		}
		ContentThingy.prototype = new Thingy();
		/** Returns the value stored by this content item. */
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
		/** Sets the value stored by this content item. */
		ContentThingy.prototype.setValue = function(value){
			var oldvalue = this.value;
			this.value = value;
			var source = this;
			this.traverseListeners('valuechanged',function(listener){
				listener(source,source.value,oldvalue);
			});
		}
		
		/** Represents the top level container, equivalent to the XML root node. It can have
		 * no attributes or features of its own. 
		 */
		function RootThingy(){
			ContainerThingy.apply(this,arguments);
		}
		RootThingy.prototype = new ContainerThingy();
		
		/** Represents a container thingy which can have a sequence of children ElementThingies and 
		 * TextThingies accessed by position, but also AttributeThingies which are accessed by name.
		 * 
		 * Can be constructed from a DOM node, as an empty Element with a name, or with name plus an array of children, 
		 * or a name, plus an attribute map containing name:value pairs, followed by the array of children.
		 */
		function ElementThingy(){
			this.attributes = {}; //hashmap for indexing AttributeThingy children
			if(arguments.length > 0){
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
				else if(typeof(arguments[0]) === "string"){ //creation from values directly
					this.name = arguments[0];
					var children;
					if(arguments.length === 1){ //name
						children = [];
						ContainerThingy.apply(this,[children]);
						return this;
					}
					if(arguments.length === 2){ //name and children
						if(arguments[1] instanceof Array){
							children = [].concat(arguments[1]);
							ContainerThingy.apply(this,[children]);
							return this;
						}
					}
					else if(arguments.length === 3){ //name and attributes and children
						if(arguments[1] !== null && arguments[2] instanceof Array){
							children = [].concat(arguments[2]);
							ContainerThingy.apply(this,[children]);
							for(name in arguments[1]){
								addAttribute(name,attributes[name]);
							}
							return this;
						}					
					}
				}
			}
			throw new Error("Malformed invocation of ElementThingy constructor");
		}
		ElementThingy.prototype = new ContainerThingy();
		/** Returns the name. */
		ElementThingy.prototype.getName = function(){
			return this.name;
		}
		/** Adds an attribute and notifies listeners. Can accept an AttributeThingy or a String name and Object value*/
		ElementThingy.prototype.addAttribute = function(){ //adds attributethingy child
			var name,value,thingy;
			if(arguments.length == 1 && 
				(thingy = arguments[0]) instanceof AttributeThingy){
				name=thingy.name;
				value=thingy.value;
			}
			else if(arguments.length == 2 && 
				typeof(name = arguments[0]) === "string" && 
				typeof(value = arguments[1]) === "string"){
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
		/** Removes an attribute and notifies listeners. Can accept an AttributeThingy or a String name. */
		ElementThingy.prototype.removeAttribute = function(){ //removes attributethingy child
			if(arguments.length == 1){
				var name;
				var oldthingy = null;
				if(arguments[0] instanceof AttributeThingy){
					oldthingy = arguments[0];
					name=oldthingy.name;
				}
				else if(typeof(arguments[0]) === "string"){
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
		/** Returns the AttributeThingy stored against the given name. */
		ElementThingy.prototype.getAttributeThingy = function(name){
			if(name in this.attributes){
				return this.attributes[name];				
			}
			else{
				return null;
			}
		}
		/** Returns true iff there is an AttributeThingy stored against the given name. */
		ElementThingy.prototype.hasAttribute = function(name){
			return name in this.attributes;
		}
		/** Returns the value in the AttributeThingy stored against the given name. */
		ElementThingy.prototype.getAttribute = function(name){
			if (name in this.attributes) {
				return this.attributes[name].value;
			}
			else {
				return null;
			}
		}
		/**  Can be invoked empty to just return the map of AttributeThingies,  
		 * passing one function to get attributeadded events for all attributes now and in the future
		 * or passing two functions to get attributeremoved events in the future too 
		 */
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
		/** Used to store a descendant Thingy (ElementThingy,TextThingy or AttributeThingy). */
		ElementThingy.prototype.addThingy = function(){
			if(arguments[0] instanceof AttributeThingy){
				return this.addAttribute(arguments[0]);
			}
			else{
				return ContainerThingy.prototype.addThingy.apply(this,arguments); //call superclass addThingy							
			}
		}
		/** Used to remove a descendant Thingy (ElementThingy,TextThingy or AttributeThingy). */
		ElementThingy.prototype.removeThingy = function(){
			if(arguments[0] instanceof AttributeThingy){
				return this.removeAttribute(arguments[0]);
			}
			else{
				return ContainerThingy.prototype.removeChild.apply(this,arguments); //call superclass addChild							
			}
		}
		
		/** Represents a content thingy which can store a text value and is a descendant of an ElementThingy, stored as a property, by name.
		 * 
		 * Can be constructed from a DOM node, or a String name and String value.
		 */
		function AttributeThingy(){
			if(arguments.length > 0){
				if (arguments.length === 1 && arguments[0] instanceof Attr) { //creation from values in DOM node
					var att = arguments[0];
					this.name = att.name;
					return ContentThingy.apply(this, [att.value]);
				}
				else if(typeof(arguments[0]) === "string") { //creation from values directly
					this.name = arguments[0];
					if( arguments.length === 1){
						return ContentThingy.apply(this, [""]); //TODO check if empty string is better than null (loses info?)
					}
					if (arguments.length === 2 && typeof(arguments[1]) === "string") {
						return ContentThingy.apply(this, [arguments[1]]);
					}
				}
			}
			throw new Error("Malformed arguments to AttributeThingy constructor");

		}
		AttributeThingy.prototype = new ContentThingy();
		/** Returns the name of this AttributeThingy. */
		AttributeThingy.prototype.getName = function(){
			return this.name;
		}
		
		
		/** Represents a content thingy which can store a text value and is a descendant of an ElementThingy, stored as a child by position.
		 * 
		 * Can be constructed from a DOM node, or a String value.
		 */
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
			var childrls = this.getChildren().filter(function(rule){return ! (rule instanceof AttributeThingyRule); });
			var childths = thingy.getChildren();
			ThingyUtil.walkSequenceWithRulesOrReject(childrls,childths,childwalker,this);
		}
		ContainerThingyRule.prototype.matchThingy=function(thingy, shallow){
			try{
				if(!shallow){
					var walker = new RecursiveValidationWalker(thingy);
					this.walkChildren(thingy,walker);
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
			else if(typeof(arguments[0]) === "string"){
				NamedThingyRule.apply(this,[arguments[0] /*name*/, "ElementThingy" /*typename*/ , arguments[1] /*children*/]);				
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
			if(sequence.length > startidx){ //check there is a candidate at all
				if(this.matchThingy(sequence[startidx], true)){
					walker.posAccepted(startidx, this);
				}
				else{
					walker.posRejected(startidx, this);
					walker.posRequired(startidx, this);
				}				
			}
			else{
				walker.posRequired(startidx, this);
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
			ThingyUtil.walkMapWithRulesOrReject(attrls,thingy.getAttributes(),attwalker, this);
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
			else if(typeof(arguments[0]) === "string"){
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
			//indexed by name
			this.mapsbyname = {
				accepted:{},
				rejected:{},
				required:{}
			}
			//indexed by position
			this.mapsbypos = {
				accepted:{},
				rejected:{},
				required:{}
			}
		};
		CachingWalker.prototype = (function(){
			var proto = new ElementWalker();
			YOURX.copyProperties({
				putCache:function(allmaps,mapkey,rulekey,rule){
					if(!ThingyUtil.putUniqueKey(allmaps,mapkey,rulekey,rule)){
						throw new ThingyRuleError("Pos " + pos + " already claimed by another rule");
					}					
				},
				getCacheStatus:function(rulekey){
					if(typeof rulekey === "string"){
						//by name
						return ThingyUtil.mapWithKey(this.mapsbyname,rulekey);
					}
					else if(typeof rulekey === "number"){
						//by pos
						return ThingyUtil.mapWithKey(this.mapsbypos,rulekey);
					}
					else{
						throw new Error("Unexpected key type");
					}
				},
				getCache:function(rulekey){
					var mapkey;
					if(typeof rulekey  === "string"){
						//by name
						mapkey = ThingyUtil.mapWithKey(this.mapsbyname,rulekey);
						if(mapkey !== null){
							return this.mapsbyname[mapkey][rulekey];
						}
					}
					else if(typeof rulekey  === "number"){
						//by pos
						mapkey = ThingyUtil.mapWithKey(this.mapsbypos,rulekey);
						if(mapkey !== null){
							return this.mapsbypos[mapkey][rulekey];
						}
					}
					else{
						throw new Error("Unexpected key type");
					}
					return null;							
				},
				posAccepted:function(pos, rule){ this.putCache(this.mapsbypos, "accepted", pos, rule); },
				posRejected:function(pos, rule){ this.putCache(this.mapsbypos, "rejected", pos, rule); },
				posRequired:function(pos, rule){ this.putCache(this.mapsbypos, "required", pos, rule); },
				nameAccepted:function(name, rule){ this.putCache(this.mapsbyname, "accepted", name, rule); },
				nameRejected:function(name, rule){ this.putCache(this.mapsbyname, "rejected", name, rule); },
				nameRequired:function(name, rule){ this.putCache(this.mapsbyname, "required", name, rule); }
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
			if(ThingyUtil.canWalkBelow(rule)){
				var walker = new RecursiveValidationWalker(child);
				ThingyUtil.walkBelow(rule,child, walker);				
			}
		}
		
		function CompoundWalker(wrapped){
			this.wrapped = [].concat(wrapped);
		};
		CompoundWalker.prototype = new ElementWalker();
		CompoundWalker.prototype.nameAccepted = function(name,rule){
			this.wrapped.forEach(function(walker){
				walker.nameAccepted(name,rule);
			});
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
		
		/** Maintains a data structure to accelerate traversal and retrieval requests below the specified thingy. 
		 * @param {Object} node
		 */
		function ThingyTree(thingy){
			this.metadata = new Hashtable();
			this.trackThingy(thingy);
		}
		
		/** Lazily creates metadata storage for the thingy.*/
		ThingyTree.prototype.getMetadata = function(thingy){
			var metadata = this.metadata.get(thingy);
			if(!metadata){
				metadata = {};
				this.metadata.put(thingy,metadata);
			}
			return metadata;
		}
		
		ThingyTree.prototype.childAdded = function(parent,child,childidx){
			this.getMetadata(child)['parent'] = parent;
			this.parents.put(child,parent);
			this.trackThingy(child);
		}

		ThingyTree.prototype.childRemoved = function(parent,child,childidx){
			this.getMetadata(child)['parent'] = null;
			this.untrackThingy(child);			
		}

		ThingyTree.prototype.attributeAdded = function(parent,att){
			this.getMetadata(att)['parent'] = parent;
			this.trackThingy(att);			
		}

		ThingyTree.prototype.attributeRemoved = function(parent,att){
			this.getMetadata(att)['parent'] = null;
			this.untrackThingy(att);
		}
		
		ThingyTree.prototype.trackThingy = function(thingy){
			if(thingy instanceof ContainerThingy){
				thingy.bind("childadded", this.childAdded);
				thingy.bind("childremoved", this.childRemoved);
			}
			if(thingy instanceof ElementThingy){
				thingy.bind("attributeadded", this.attributeAdded);
				thingy.bind("attributeremoved", this.attributeRemoved);
			}
		} 

		ThingyTree.prototype.untrackThingy = function(thingy){
			purgeMetadata(thingy);
			if(thingy instanceof ContainerThingy){
				thingy.unbind("childadded", this.childAdded);
				thingy.unbind("childremoved", this.childRemoved);
			}
			if(thingy instanceof ElementThingy){
				thingy.unbind("attributeadded", this.attributeAdded);
				thingy.unbind("attributeremoved", this.attributeRemoved);
			}
		} 
				
		ThingyTree.prototype.getParent = function(thingy){
			return this.getMetadata(thingy)['parent'];
		}

		/** Todo consider efficiency of caching by monitoring child insertion/removal. */
		ThingyTree.prototype.getPosition = function(thingy){
			if(!thingy instanceof AttributeThingy){
				var parent = getParent(thingy);
				if(parent){
					var count;
					for(count=0; count < parent.children.length; count++){
						if(parent.children[count]===thingy){
							return count;
						}
					}					
				}
			}
			else{
				return -1; //Attribute thingies don't have a position
			}
		}
		
		ThingyTree.prototype.depthFirstUntil = function(totest, testfun){
			var result;
			while(totest){
				result = testfun(totest);
				if(result){
					return result;
				}
				else{
					//try to descend
					if(totest instanceof ContainerThingy){
						if(totest.children.length){
							totest = totest.children[0];
							continue;
						}
					}
					//try to find siblings or ascend
					var parent, pos;
					do{
						parent = this.getParent(totest);
						pos = this.getPosition(totest);
					}while(parent && (pos === parent.children.length -1));
					if(parent){
						totest = parent[pos+1];
						continue;
					}
				}
			}
			return null;
		}
		
		//evaluate the export function in this scope	
		return eval(YOURX.writeScopeExportCode([
			"ThingyUtil",
			"Thingy","ContainerThingy","ContentThingy","RootThingy","ElementThingy","AttributeThingy","TextThingy",
			"ThingyGrammar","ThingyRule","ElementThingyRule","AttributeThingyRule","TextThingyRule","OptionalThingyRule","ZeroOrMoreThingyRule","OneOrMoreThingyRule",
			"ElementWalker","CachingWalker","CompoundWalker",
			"ThingyRuleError", "UnsupportedOperationError"
		]));
			
	}()),
	'YOURX'
);