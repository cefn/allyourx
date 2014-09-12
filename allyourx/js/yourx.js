/**
 * Copyright 2009-2011 Cefn Hoile, AllyourX.org 
 *
 * This file is part of Avix
 *
 * Avix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/* These declarations modify the environment to improve support for functions often used in 
 * the YOURX library. If these exist in your environment already, you don't need them, but 
 * they won't hurt either.
 *
 */

/** Provide array functions where not available, from MDC */
if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        fun.call(thisp, this[i], i, this);
    }
  };
}

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}

//from http://www.tutorialspoint.com/javascript/array_indexof.htm
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

/** Replace document write function with one which respects E4X as source. */
document.write = function(){
	var oldfun = document.write; //avoids corrupting top level namespace
	return function(){
		var args = Array.prototype.slice.call(arguments); //from http://shifteleven.com/articles/2007/06/28/array-like-objects-in-javascript
		if(args.length > 0){
			var item = args[0];
			if(typeof item == 'xml'){
				args[0] = item.toXMLString();			
			}
		}
		return oldfun.apply(this,args);		
	};
}();

/** Replace jquery clean function with one which respects E4X (html) as selector (expands to a string). */
/*
if(typeof(jQuery) != 'undefined'){
	jQuery.clean = function(){
		var oldfun = jQuery.clean;
		var newfun = function(){
			if(arguments.length > 0){
				var wrappedarguments = arguments[0];
				if(wrappedarguments.length > 0){
					var item = wrappedarguments[0];
					if(typeof item == 'xml'){
						//modify arguments array and invoke original function
						var args = Array.prototype.slice.call(arguments); //from http://shifteleven.com/articles/2007/06/28/array-like-objects-in-javascript
						var wrappedargs = Array.prototype.slice.call(args[0]);
						wrappedargs[0] = item.toXMLString();
						args[0] = wrappedargs;
						return oldfun.apply(this,args);
					}
				}
			}
			//proceed without modifying arguments array
			return oldfun.apply(this,arguments);
		};
		return newfun;
	}();
}
*/

YOURX = function(){
		
	/** Universal access for global variable regardless of browser or non-browser environment. */
	function getGlobal(){ //from http://www.nczonline.net/blog/2008/04/20/get-the-javascript-global/
		return (function(){return this;})();
	}
	
	function cloneArray(array){ //from http://shifteleven.com/articles/2007/06/28/array-like-objects-in-javascript
		return Array.prototype.slice.call(array);
	}	
	
	/**
	 * @param {Object} from The object from which the properties should be copied.
	 * @param {Object,String} to The object or global name of object to which the properties should be copied.
	 * @param {Object} propnames The property names which should be copied. If omitted, all properties are copied.
	 */
	function copyProperties(from,to,propnames){ //if propname omitted all named properties copied
		if(!propnames){
			propnames = [];
			for(name in from){
				propnames.push(name);
			}
		}
		if(typeof to == 'string'){
			if(to in getGlobal()){
				to = getGlobal()[to]; //use existing object of this name
			}
			else{
				to = getGlobal()[to]={}; //create new object
			}
		}
		for(var idx = 0; idx < propnames.length; idx++){
			to[propnames[idx]] = from[propnames[idx]];
		}
		return to;
	}

    /* First argument should be the prototype any additional javascript objects are merged through copyProperties */
    Function.prototype.prototypeFrom = function(constructor){
        //as described by http://javascript.crockford.com/prototypal.html
        // to avoid calling constructor with zero args (which may throw an exception)
        var dummy = function() {};
        dummy.prototype = constructor.prototype;
        this.prototype = new dummy();
    };

    Function.prototype.copyToPrototype = function(){
        var that = this;
        cloneArray(arguments).forEach(function(dict){
            copyProperties(dict, that.prototype);
        });
    };

    /** Writes javascript which populates names in a new object, using items with the same names from the current scope. */
	function writeScopeExportCode(propnames){
		var pairs = [];
		propnames.forEach(function(item){pairs.push("\"" + item + "\":" + item);});
		return "({" + pairs.join(",") + "})"; 		
	}
				
	/** Utility methods in a 'static' library object */		
	var ThingyUtil = { //TODO consider reusing single static DOMParser and XMLSerializer
        /** Constructs a function which redirects calls with all their arguments to a specific method on a specific object. */
		methodHandoffFunction:function(obj,name){ //could now be superceded by JQuery proxy
			return function(){
				var fun = obj[name];
				fun.apply(obj, arguments);
			};
		},
        /** Creates unique hashes to assign distinct identities to items. */
		hasher:new Guid(),
        /** Logs a message by just writing text at the top of the html body. */
		log:function(msg){$(function(){$('body').prepend(msg + "<br/>");});},
        /** Translates from serialized XML to E4X format. */
		xml2e4x:function(xml){ return new XML(ThingyUtil.xmlStripComments(xml));},
        /** Translates from serialized XML to DOM format. */
		xml2dom:function(xml){ return (new DOMParser()).parseFromString(xml,"text/xml");},
        /** Translates from E4X to serialized XML. */
        e4x2xml:function(e4x){ return e4x.toXMLString();},
        /** Translates from E4Xto DOM format. */
        e4x2dom:function(e4x){ return ThingyUtil.xml2dom(ThingyUtil.e4x2xml(e4x));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
        /** Translates from DOM to E4X. */
		dom2e4x:function(dom){ return new XML(ThingyUtil.dom2xml(dom));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
		/** Translates from DOM to serialized XML. */
        dom2xml:function(dom){ return (new XMLSerializer()).serializeToString(dom);},
		/** Translates from DOM to Thingy tree. */
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
        /** Translates from RelaxNG DOM to ThingyGrammar tree. */
		dom2rule:function(node) {
            var CACHE = "rulecache";
            var result = $(node).data(CACHE);
            if(result){
                return result;
            }
            else{
                if(node instanceof Document){
                    //TODO tidyup of CACHE_KEY data after completed traversal
                    result = new ThingyGrammar(node);
                }
                else if(node instanceof Element) {
                    var name = node.nodeName;
                    if (name == "element") {
                        result = new ElementThingyRule(node);
                    }
                    else if (name == "attribute") {
                        result = new AttributeThingyRule(node);
                    }
                    else if (name == "oneOrMore") {
                        result = new OneOrMoreThingyRule(node);
                    }
                    else if (name == "choice") {
                        result = new ChoiceThingyRule(node);
                    }
                    else if (name == "data") {
                        result = new DataThingyRule(node);
                    }
                    else if (name == "ref") { //find matching define and hand off
                        result = [];
                        var nameatt = $(node).attr("name");
                        var matches = $("define[name='" + nameatt + "']", node.ownerDocument);
                        if(matches.length !== 0){
                            matches.each(function (index, el) {
                                result = result.concat(ThingyUtil.dom2rule(el));
                            });
                        }
                        else{
                            throw new Error("Cannot find define pointed to by ref[@name=" + nameatt + "]");
                        }
                    }
                    else if (name == "define") {
                        result = [];
                        $(node).children().each(function(idx, el){
                            result = result.concat(ThingyUtil.dom2rule(el));
                        });
                        if (result.length == 0) {
                            var nameatt = $(node).attr("name");
                            throw new Error("Cannot find any rules within define [@name=" + nameatt + "]");
                        }
                    }
                    else {
                        throw new Error("Unsupported element '" + name + "' found when loading ThingyRules");
                    }
                }
                if(result !== null){ //handle 'define' which simply redirects
                    $(node).data(CACHE,result);
                }
                return result; //return resulting rule(s)
			}
		},
        /** Translates from Thingy tree format to serialized XML. */
		thingy2xml:function(thingy) {
			var thingystring = "";
			if(thingy instanceof ElementThingy){
				thingystring += '<' + thingy.getName();
				var atts = thingy.getAttributes();
				for(var attname in atts){
					thingystring += ' ' + ThingyUtil.thingy2xml(thingy.getAttributeThingy(attname));
				}
				if(thingy.getChildren().length > 0){
					thingystring += '>';
					thingy.getChildren().forEach(function(childthingy){ 
						thingystring += ThingyUtil.thingy2xml(childthingy);
					});
					thingystring += '</' + thingy.getName() + '>';
				}
				else{
					thingystring += '/>';
				}						
			}
			else if(thingy instanceof AttributeThingy){
				thingystring += thingy.getName() + '="' + thingy.getValue() + '"';
			}
			else if(thingy instanceof TextThingy){
				thingystring += thingy.getValue();
			}
			else if(thingy instanceof RootThingy){
				thingy.getChildren().forEach(function(childthingy){ 
					thingystring += ThingyUtil.thingy2xml(childthingy);
				});
			}
			return thingystring;
		},
        /** Visits an XML document at the specified URL, and tries to load it in a DOM. */
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
        /** Visits an XML document at the specified URL, and tries to load it in a Thingy tree. */
		url2thingy:function(url){
			return ThingyUtil.dom2thingy(ThingyUtil.url2node(url));
		},
        /** Visits a RelaxNG document at the specified URL, and tries to load it into a ThingyGrammar tree. */
		url2rule:function(url){
			return ThingyUtil.dom2rule(ThingyUtil.url2node(url));
		},
        /** Attempts to remove nodes which contain nothing but whitespace from a DOM. */
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
         * @param {Number} startfrom The index within the sequence where the rules should read from
		 * @return {Number} The index after the last posAccepted() in the sequence, or startidx if no posAccepted().
		 */
		walkSequenceWithRules:function(rls,sequence,walker,startfrom){ //todo consider meaningful return value
            var nextidx = startfrom !== undefined ? startfrom : 0;
			rls.forEach(function(rule){
				nextidx = rule.walkSequence(sequence, walker, nextidx);
			});
            return nextidx;
		},
		/** Walks a set of rules over a sequence of Thingies (stored by position), notifying validation events 
		 * and fires a rejection event for any Thingies which are not positively accepted by a rule once the walk has completed.
		 * @param {Array} rls The rules to validate the Thingies
		 * @param {Array} sequence The Thingies
         * @param {Walker} walker The walker to monitor validation events
		 * @param {Object} enforcer The entity on behalf of which the rejection is fired
         * @param {Number} startwalk The position in the Thingy sequence to start walking
         * @param {Number} endreject Items up to this position must be matched
         * @return {Number} The index after the last posAccepted() in the sequence, or startidx if no posAccepted().
		 */
		walkSequenceWithRulesOrReject:function(rls,sequence,walker,enforcer,startfrom,rejectto){
            startfrom = startfrom !== undefined? startfrom: 0; //default; start matching from first position of sequence
            rejectto = rejectto!== undefined? rejectto: sequence.length; //default; rules must pattern match the whole sequence

            //arrange to store walk results
			var cachingwalker = new CachingWalker();
			var compoundwalker = new CompoundWalker([cachingwalker,walker]);
			
			//walk
            var nextidx = ThingyUtil.walkSequenceWithRules(rls,sequence,compoundwalker, startfrom);
			
			//rejected unmatched positions on behalf of the enforcing (parent?) rule
			var pos;
			for(pos = startfrom ; pos < rejectto; pos++){
				if(cachingwalker.getCacheStatus(pos) === null){
					walker.posRejected(pos,enforcer);
				}
			}

            //report the next unbound position in the sequence
            return nextidx;

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
	
	function UnsupportedOperationError(message, origin) {
	    this.name = "UnsupportedOperationError";
	    this.message = (message || "");
        this.origin = origin;
	}
	UnsupportedOperationError.prototypeFrom(Error);
	
	function ThingyRuleError(message) {
	    this.name = "ThingyRuleError";
	    this.message = (message || "");
	}
	ThingyRuleError.prototypeFrom(Error);
	
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
		};
	};

    //TODO ensure consistency of lines with 'prototype = ' converge on prototypeFrom(...) and copyToPrototype(...)
    //there is currently too much variety
	Thingy.copyToPrototype({
		toString:function(){ return "toString() not yet implemented";},
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
		}
	});
	
	/** Represents a Thingy which can contain a sequence of children, each of which has a numerical position, starting at 0 
	 * Can be constructed by passing a DOM whose tree should be recursively replicated in terms of Thingies, 
	 * or an array of child Thingies to store. 
	 */
	function ContainerThingy(){
		this.children = [];
		if(arguments.length > 0){
			if(arguments[0] instanceof Node){ //creation from values in DOM node
				var container = this;
				cloneArray(arguments[0].childNodes).forEach(function(item){
					var thingy = ThingyUtil.dom2thingy(item);
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
    ContainerThingy.prototypeFrom(Thingy);
    ContainerThingy.copyToPrototype({
        toString: function () {
            var formatted = "";
            this.getChildren().forEach(function (child) {
                formatted += child.toString();
            });
            return formatted;
        },

        //TODO CH introduce a ContainerThingy#hasChildren() method which returns strict boolean and replace getChildren().length globally

        /** Can be invoked empty to just return the array of children,
         * passing one function to get childadded events for all children now and in the future
         * or passing two functions to get childremoved events in the future too
         */
        getChildren: function () {
            if (arguments.length > 0 && arguments[0] instanceof Function) { //traverse and subscribe for future new children
                var onadd = arguments[0];
                this.bind('childadded', onadd);
                var parent = this;
                this.children.forEach(function (item, idx) {
                    onadd(parent, item, idx);
                });
            }
            if (arguments.length > 1 && arguments[1] instanceof Function) { //subscribe for future child removal
                var onremove = arguments[1];
                this.bind('childremoved', onremove);
            }
            return this.children;
        },

        hasChildren: function (thingy) {
            return this.getChildren().length !== 0;
        },

        /** Alias for addChild, given all descendants of a generic ContainerThingy are its children. */
        addThingy: function (thingy) {
            return this.addChild(thingy);
        },

        /** Alias for removeChild, given all descendants of a generic ContainerThingy are its children. */
        removeThingy: function (thingy) {
            return this.removeChild(thingy);
        },

        /** Alias for getChild, given all descendants of a generic ContainerThingy are its children. */
        getThingy: function (key) {
            return this.getChildThingy(key);
        },

        /** Adds a child and notifies listeners. */
        addChild: function () {
            var child = null;
            var childidx = -1;
            if (arguments.length > 0 && arguments[0] instanceof Thingy) {
                child = arguments[0];
                if (arguments.length === 1) {
                    childidx = this.children.push(child);
                }
                else if (arguments.length === 2 && typeof(arguments[1]) === "number") {
                    childidx = arguments[1];
                    this.children.splice(childidx, 0, child);
                }
            }

            if (child && childidx !== -1) {
                //notify listeners if successful
                var parent = this;
                this.traverseListeners('childadded', function (listener) {
                    listener(parent, child, childidx);
                });
                return child;
            }
            else {
                throw new Error("Malformed invocation of ContainerThingy#addChild()");
            }
        },

        /** Removes a child and notifies listeners. */
        removeChild: function () {
            var child = null;
            var childidx = -1;
            if (arguments.length === 1) {
                if (arguments[0] instanceof Thingy) {
                    child = arguments[0];
                    this.children = this.children.filter(function (item, idx) {
                        if (item === child) {
                            childidx = idx;
                            return false;
                        }
                        else {
                            return true;
                        }
                    });
                }
                else if (typeof(arguments[0]) === "number") {
                    childidx = arguments[0];
                    child = children[childidx];
                    this.children.splice(childidx, 1);
                }

            }

            if (child && childidx != -1) {
                var parent = this;
                this.traverseListeners('childremoved', function (listener) {
                    listener(parent, child, childidx);
                });
                return child;
            }
            else { //TODO CH improve error handling - fallthrough?
                throw new Error("Malformed invocation of ContainerThingy#addChild()");
            }

        },

        getChildThingy: function (key) {
            if (arguments.length === 1) {
                if (typeof(arguments[0]) === "number") {
                    if (key >= 0 && key < this.children.length) {
                        return this.children[key];
                    }
                    else {
                        return null;
                    }
                }
            }
            throw new Error("Malformed invocation of ContainerThingy#getChildThingy()");
        },

        /** Adds a thingy constructed dynamically to mirror a given DOM node. */
        addNode: function (node) {
            this.addThingy(ThingyUtil.dom2thingy(node));
        }
    });


	/** Represents a content item which simply stores a value, such as an Attribute or a Text node. 
	 * @param {Object} value The value to store
	 */
	function ContentThingy(value){
		this.value = value;
		Thingy.apply(this,[]); //TODO, implement as this.super(...) within prototypeFrom function call
	}
    ContentThingy.prototypeFrom(Thingy);
    ContentThingy.copyToPrototype({
            toString:function(){
                return "ContentThingy - toString should be implemented.";
            },
            /** Returns the value stored by this content item. */
            getValue:function(){
                if(arguments.length == 1 && arguments[0] instanceof Function){
                    var callback = arguments[0];
                    this.bind('valuechanged',callback);
                    callback(this,this.value,this.value);//common with setValue firing signature
                }
                else{
                    return this.value;
                }
            },
            /** Sets the value stored by this content item. */
            setValue:function(value){
                var oldvalue = this.value;
                this.value = value;
                var source = this;
                this.traverseListeners('valuechanged',function(listener){
                    listener(source,source.value,oldvalue);
                });
            }
        }
    );


	/** Represents the top level container, equivalent to the XML root node. It can have
	 * no attributes or features of its own. 
	 */
	function RootThingy(){
		ContainerThingy.apply(this,arguments);
	}
    RootThingy.prototypeFrom(ContainerThingy);
	
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
				this.setName(el.nodeName);
				ContainerThingy.apply(this,[el]);
				var elthingy = this;
				cloneArray(el.attributes).forEach(function(item){
					var thingy = ThingyUtil.dom2thingy(item);
					if(thingy !== null){
						elthingy.addAttribute(thingy);						
					}
				});
				return this;
			}
			else if(typeof(arguments[0]) === "string"){ //creation from values directly
				this.setName(arguments[0]);
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
	};
	ElementThingy.prototypeFrom(ContainerThingy);
    ElementThingy.copyToPrototype({
        toString:function(){
            var formatted = "<" + this.name ;
            if(this.children.length > 0){
                return formatted + ">" + ContainerThingy.prototype.toString.apply(this) + "</" + this.name + ">";
            }
            else{
                return formatted + "/>";
            }
        },

        /** Returns the name via return value or by triggering and subscribing listener function. */
        getName:function(){
            if(arguments.length > 0 && arguments[0] instanceof Function){ //callback on function and subscribe for future name changes
                var onsetname = arguments[0];
                this.bind('namechanged',onsetname);
                onsetname(this, this.name);
            }
            return this.name;
        },

        /** Sets the name, notifying listeners. */
        setName:function(name){
            var source = this;
            this.name = name;
            this.traverseListeners('namechanged',function(listener){
                listener(source,name);
            });
        },

        /** Renames an attribute in place, ensuring that the Element name map is kept up to date.
         * Attributes shouldn't be renamed directly, unless they are unparented.
         * @param {String} fromname
         * @param {String} toname
         */
        renameAttribute:function(fromname, toname){
            if(fromname in this.attributes){
                this.attributes[toname] = this.attributes[fromname];
                delete this.attributes[fromname];
                this.attributes[toname].setName(toname);
                return true;
            }
            else{
                return false;
            }
        },

        /** Adds an attribute and notifies listeners. Can accept an AttributeThingy or a String name and Object value*/
        addAttribute:function(){ //adds attributethingy child
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
        },

        /** Removes an attribute and notifies listeners. Can accept an AttributeThingy or a String name. */
        removeAttribute:function(){ //removes attributethingy child
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
        },

        /** Accesses either children or attributes depending on the key. */
        getThingy:function(key){
            if(isNaN(key)){ //key is a string
                return this.getAttributeThingy(key);
            }
            else{ //fall through to container (use key as child index)
                return ContainerThingy.prototype.getThingy.apply(this,arguments);
            }
        },

        /** Returns the AttributeThingy stored against the given name. */
        getAttributeThingy:function(name){
            if(name in this.attributes){
                return this.attributes[name];
            }
            else{
                return null;
            }
        },

        /** Returns true iff there is an AttributeThingy stored against the given name. */
        hasAttribute:function(name){
            return name in this.attributes;
        },

        /** Returns the value in the AttributeThingy stored against the given name. */
        getAttribute:function(name){
            if (name in this.attributes) {
                return this.attributes[name].value;
            }
            else {
                return null;
            }
        },

        /**  Can be invoked empty to just return the map of AttributeThingies,
         * passing one function to get attributeadded events for all attributes now and in the future
         * or passing two functions to get attributeremoved events in the future too
         */
        getAttributes:function(){
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
        },

        hasAttributes:function(thingy){
            for(var key in this.getAttributes()){
                return true;
            }
            return false;
        },

        /** Used to store a descendant Thingy (ElementThingy,TextThingy or AttributeThingy). */
        addThingy:function(){
            if(arguments[0] instanceof AttributeThingy){
                return this.addAttribute(arguments[0]);
            }
            else{
                return ContainerThingy.prototype.addThingy.apply(this,arguments); //call superclass addThingy
            }
        },

        /** Used to remove a descendant Thingy (ElementThingy,TextThingy or AttributeThingy). */
        removeThingy:function(){
            if(arguments[0] instanceof AttributeThingy){
                return this.removeAttribute(arguments[0]);
            }
            else{
                return ContainerThingy.prototype.removeChild.apply(this,arguments); //call superclass addChild
            }
        }

    });

	/** Represents a content thingy which can store a text value and is a descendant of an ElementThingy, stored as a property, by name.
	 * 
	 * Can be constructed from a DOM node, or a String name and String value.
	 */
	function AttributeThingy(){
		if(arguments.length > 0){
			if (arguments.length === 1 && arguments[0] instanceof Attr) { //creation from values in DOM node
				var att = arguments[0];
				this.setName(att.name);
				return ContentThingy.apply(this, [att.value]);
			}
			else if(typeof(arguments[0]) === "string") { //creation from values directly
				this.setName(arguments[0]);
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
	AttributeThingy.prototypeFrom(ContentThingy);
    AttributeThingy.copyToPrototype({
        toString:function(){
                return this.name + "=\"" + this.value + "\"";
        },
        /** Duplicate name getting and setting functionality from ElementThingy. */
        getName:ElementThingy.prototype.getName,
        setName:ElementThingy.prototype.setName
    });

	
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
	TextThingy.prototypeFrom(ContentThingy);
    TextThingy.copyToPrototype({
        toString:function(){
            return this.value;
        }
    });

	function ThingyRule(children){
		this.children = [].concat(children);
	}
    ThingyRule.prototypeFrom(Object);
    ThingyRule.copyToPrototype({
        toString:function(){ return "ThingyRule"; },
        getChildren:function(){
            return this.children;
        },
        /** Calls back with rule-specific event notifications
         * if the walker has matching signature.
         */
        walkSequence:function(ths, walker, startidx){
            throw new UnsupportedOperationError("Walk not yet implemented", this);
        }
    });

	function ContainerThingyRule(){}
	ContainerThingyRule.prototypeFrom(ThingyRule);
    ContainerThingyRule.copyToPrototype({
        /** Walks children along with child rules.
         * Any existing children trigger exactly one of either
         * a posAccepted or posRejected call for their position.
         * Any missing children can trigger a posRequired call.
         * @param {Object} thingy
         * @param {Object} childwalker
         */
        walkChildren:function(thingy,childwalker) {
            var childrls = this.getChildren().filter(function(rule){return ! (rule instanceof AttributeThingyRule); });
            var childths = thingy.getChildren();
            ThingyUtil.walkSequenceWithRulesOrReject(childrls,childths,childwalker,this);
        },
        /** Attempt to validate a thingy against a container rule.
         * (A default container rule is trivially satisfied unless recursive)
         * @param thingy The thingy to validate.
         * @param shallow Flag to avoid recursion.
         * @returns {boolean} Value to indicate if the thingy is valid against the rule.
         */
        matchThingy:function(thingy, shallow){
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
                else if(e instanceof UnsupportedOperationError){
                    //some grammar structure used has not yet been implemented
                    throw e;
                }
                else{
                    throw e;
                }
            }
        }

    });

    /** ContentThingyRule has validation logic for rules bound against ContentThingy types, such as...
     * AttributeThingyRule, TextThingyRule, DataThingyRule
     * @constructor
     */
    function ContentThingyRule(){}
    ContentThingyRule.prototypeFrom(ThingyRule);

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
	ThingyGrammar.prototypeFrom(ContainerThingyRule);
    ThingyGrammar.copyToPrototype({
        walkSequence:function(sequence, walker, startfrom){
            var walkedto = startfrom;
            if(sequence[startfrom] instanceof RootThingy){
                walker.posAccepted(startfrom,this);
                walkedto++;
            }
            else{
                walker.posRequired(startfrom,this);
                walker.posRejected(startfrom,this);
            }
            return walkedto;
        }
    });

	function TypedThingyRule(typename, children){
		this.typename = typename;
		ThingyRule.apply(this,[children]);
	}
	TypedThingyRule.prototypeFrom(ThingyRule);
    TypedThingyRule.copyToPrototype({
        matchThingy:function(thingy){
            return thingy instanceof YOURX[this.typename];
        }
    })

	function NamedThingyRule(name, typename, children){
		TypedThingyRule.apply(this,[typename, children]);
		this.name = name;
	}
	NamedThingyRule.prototypeFrom(TypedThingyRule);
    NamedThingyRule.copyToPrototype({
        matchThingy:function(thingy){
            if(TypedThingyRule.prototype.matchThingy.apply(this, arguments)){
                return thingy.name === this.name;
            }
            return false;
        }
    });

	function ElementThingyRule(){
		if(arguments[0] instanceof Element){ //creation from values in DOM node
			var el = arguments[0];
			if(el.nodeName=="element"){
				var name = el.getAttribute("name");
				if(name){
					var childrules = [];
					cloneArray(el.childNodes).forEach(function(item){
						childrules = childrules.concat(ThingyUtil.dom2rule(item));
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
	ElementThingyRule.prototypeFrom(NamedThingyRule);
    ElementThingyRule.copyToPrototype(
        ContainerThingyRule.prototype,
        {
            /** Combines shallow matching from NamedThingyRule with recursive behaviour of Container
             * @param {Object} thingy
             */
            matchThingy:function(thingy, shallow){
                if(NamedThingyRule.prototype.matchThingy.apply(this,arguments)){
                    return ContainerThingyRule.prototype.matchThingy.apply(this,arguments);
                }
                return false;
            },

            walkSequence:function(sequence,walker,startfrom){
                var walkedto = startfrom;
                if(sequence.length > startfrom){ //check there is a candidate at all
                    if(this.matchThingy(sequence[startfrom], true)){
                        walker.posAccepted(startfrom, this);
                        walkedto++;
                    }
                    else{
                        walker.posRejected(startfrom, this);
                        walker.posRequired(startfrom, this);
                    }
                }
                else{
                    walker.posRequired(startfrom, this);
                }
                return walkedto;
            },

            /** Walks an element's attributes along with attribute rules.
             * Each existing attribute triggers exactly one call of either
             * nameAccepted or nameRejected for that name.
             * Any missing attributes trigger a nameRequired call for
             * that name.
             * @param {Object} element
             * @param {Object} attwalker
             */
            walkAttributes:function(thingy,attwalker) {
                var attrls = this.getChildren().filter(function(rule){return rule instanceof AttributeThingyRule;});
                ThingyUtil.walkMapWithRulesOrReject(attrls,thingy.getAttributes(),attwalker, this);
            }

        }
    );


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
	AttributeThingyRule.prototypeFrom(ContentThingyRule);
    AttributeThingyRule.copyToPrototype(
        NamedThingyRule.prototype,
        {
            matchThingy:function(thingy,shallow){ //for v001 shallow is not yet relevant
                if(thingy instanceof AttributeThingy){
                    return thingy.name === this.name;
                }
                return false;
            },
            walkMap:function(map,walker){
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
        }
    );

	function TextThingyRule(){
		TypedThingyRule.apply(this,['TextThingy',[]]); //Text rules have no children - empty child array
	}
	TextThingyRule.prototypeFrom(TypedThingyRule);
    TextThingyRule.copyToPrototype(ContentThingyRule.prototype);

    function DataThingyRule(){
        //throw new UnsupportedOperationError("DataThingyRule not yet implemented");
        TextThingyRule.apply(this,[]); //Text rules have no children - empty child array
    }
    DataThingyRule.prototypeFrom(TextThingyRule);

    /** The QuantifiedThingyRule provides a mechanism for its descendant rules to be repeated
     * between 'min' and 'max' times, as expressed by the 'optional', 'zeroOrMore' and 'oneOrMore'
     * RelaxNG rules. To express these alternatives it provides a procedure for descendant rules to
     * bind between  0 and Number.MAX_VALUE times. To count as a binding, the whole sub-pattern has
     * to be matched.
     * The QuantifiedThingyRule therefore consumes or generates new walker callbacks. For example:
     * In the case that min>0 (corresponding to RelaxNG's 'oneOrMore') at least one sub-pattern is
     * required, so the QuantifiedThingyRule will raise an xRequired() callback if any of its sub-pattern
     * reports it is unsatisfied. Equally, in the case that min==0 (for example corresponding to RelaxNG
     * 'optional' or 'zeroOrMore'), then it will consume it's sub-pattern's xRequired() or xRejected() calls.
     */
    function QuantifiedThingyRule(rulenode, min, max){
        this.min = min;
        this.max = max;
        //retrieve childrules from immediate children
        var childrules = [];
        cloneArray(rulenode.childNodes).forEach(function(item){
            childrules = childrules.concat(ThingyUtil.dom2rule(item));
        });
        ThingyRule.apply(this,[childrules]);
    }
    QuantifiedThingyRule.prototypeFrom(ThingyRule); //TODO need equivalent for walkMap? Are Attributes valid in Quantifications
    QuantifiedThingyRule.copyToPrototype({
        walkSequence:function(sequence,sequenceWalker,sequenceStart) {
            //try to match all child rules a whole number of times
            var sequencePos;
            sequencePos = sequenceStart;
            var goodWalkers = [], badWalkers = [];
            var patternPos;
            for(patternPos = 0; patternPos < this.max; patternPos++){
                var cachingWalker = new CachingWalker();
                sequencePos = ThingyUtil.walkSequenceWithRules(this.children,sequence,cachingWalker,sequencePos);
                if(cachingWalker.allValid()){
                    goodWalkers.push(cachingWalker);
                }
                else{
                    badWalkers.push(cachingWalker);
                    break;
                }
            }
            //re-run events
            sequencePos = sequenceStart;
            if(goodWalkers.length < this.min){ //repetitions below lower bound, pass on failed validation events (if any)
                badWalkers.every(function(badWalker){
                    sequencePos = badWalker.replay(sequenceWalker,sequencePos);
                });
            }
            else{
                goodWalkers.every(function(goodWalker){
                    sequencePos = goodWalker.replay(sequenceWalker,sequencePos);
                });
            }
            return sequencePos;
        }
    });



    function OneOrMoreThingyRule(){
        if(arguments[0] instanceof Element && arguments[0].nodeName=="oneOrMore"){ //creation from values in DOM node
            QuantifiedThingyRule.apply(this,[arguments[0], 1, Number.MAX_VALUE]);
        }
        else{ throw new Error("Malformed arguments to OneOrMoreThingyRule constructor"); }
    }
    OneOrMoreThingyRule.prototypeFrom(QuantifiedThingyRule);

    function OptionalThingyRule(){
        if(arguments[0] instanceof Element && arguments[0].nodeName=="optional"){ //creation from values in DOM node
            QuantifiedThingyRule.apply(this,[arguments[0], 0, 1]);
        }
        else{ throw new Error("Malformed arguments to OptionalThingyRule constructor"); }
	}
	OptionalThingyRule.prototypeFrom(QuantifiedThingyRule);

	function ZeroOrMoreThingyRule(){ /** Repeats the consumption of its child rules until they stop consuming. */
        if(arguments[0] instanceof Element && arguments[0].nodeName=="optional"){ //creation from values in DOM node
            QuantifiedThingyRule.apply(this,[arguments[0], 0, Number.MAX_VALUE]);
        }
        else{ throw new Error("Malformed arguments to OptionalThingyRule constructor"); }
	}
	ZeroOrMoreThingyRule.prototypeFrom(QuantifiedThingyRule);

    function ChoiceThingyRule(){
        ThingyRule.apply(this,arguments);
    }
    ChoiceThingyRule.prototypeFrom(ThingyRule);
    ChoiceThingyRule.copyToPrototype({
        walkSequence:function(sequence,sequenceWalker,sequenceStart) {
            var childWalkers = [];
            // cache the validation walk of each child (disjoint rules),
            // replay the first walker which has fewest 'xRejected' or 'xRequired' calls
            this.children.forEach(function(rule){
                var cachingWalker = new CachingWalker();
                var sequencePos = sequenceStart;
                sequencePos = ThingyUtil.walkSequenceWithRules([rule],sequence,cachingWalker,sequencePos);
                var problemCount = cachingWalker.problemCount();
                childWalkers.push([problemCount, cachingWalker]);
            });

            // TODO: It's not obvious which of the walkers to fire events for, issues being...
            // - the first one found (prioritising a valid walk)?
            // - the one which consumes the longest sequence?
            // - the one which avoids consuming items needed for validation of other rules?
            // perhaps it's feasible to add flags to the walkSequence(...) invocation for different
            // failure-handling preferences?


            //sort walkers first by problemCount then second (implicitly), by grammar order, earliest first
            //sort by problemCount ascending
            childWalkers.sort(function(a,b){ return a[0] - b[0] ; });
            if(childWalkers.length > 0){
                childWalkers[0][1].replay(sequenceWalker,sequenceStart);
            }
            else{
                throw new Error("Choice without any child rules is an invalid grammar");
            }
        }
    });


    function GroupThingyRule(){
        throw new UnsupportedOperationError("GroupThingyRule not yet implemented", this);
        ThingyRule.apply(this,arguments);
    }
    GroupThingyRule.prototypeFrom(ThingyRule);

    /** A Walker allows pluggable exception throwing and termination behaviour
	 * for validation routines. When a schema rule requires a change to a parent node
	 * it can invoke the corresponding method on this object and, depending on the 
	 * validation scenario, the model may choose to accept the change, or terminate 
	 * immediately with it's choice of exception to flag the state to enclosing code.
	 * 
	 * In this way, match and validation routines can be stricter (immediate termination) 
	 * than autocompletion routines (which may continue to accept a sequence of required changes)
     * whilst using the same validation-rule-binding traversal and metadata structures.
	 * 
	 */

    /** A SequenceWalker provides stub implementations of the functions involved in
     * positional validation (for a sequence of children).
     * @constructor
     */
	function SequenceWalker(){};
    SequenceWalker.copyToPrototype({
        posAccepted:function(pos, rule){
            throw new UnsupportedOperationError("posAccepted() not yet implemented", this);
        },
        posRejected:function(pos, rule){
            throw new UnsupportedOperationError("posRejected() not yet implemented", this);
        },
        posRequired:function(pos, rule){
            throw new UnsupportedOperationError("posRequired() not yet implemented", this);
        }
    });

    /** A MapWalker provides stub implementations of the functions involved in
     * name-oriented validation (for named attributes).
     * @constructor
     */
	function MapWalker(){};
    MapWalker.copyToPrototype({
        nameAccepted:function(name, rule){
            throw new UnsupportedOperationError("nameAccepted() not yet implemented", this);
        },
        nameRejected:function(name, rule){
            throw new UnsupportedOperationError("nameRejected() not yet implemented", this);
        },
        nameRequired:function(name, rule){
            throw new UnsupportedOperationError("nameRequired() not yet implemented", this);
        }
    });

    /** An ElementWalker combines the stub implementations of both the MapWalker
     * and SequenceWalker
     * @constructor
     */
	function ElementWalker(){};
	ElementWalker.copyToPrototype(
        SequenceWalker.prototype,
        MapWalker.prototype
    );

    /** A walker which handles validation events against a single parent by
     * recording the validating rule against the appropriate key (number or text).
     * This allows a walk to be inspected after the fact, for example to identify
     * children or attributes for which NO event was triggered.
     * @constructor
     */
	function CachingWalker(){
        //maps to store the rules firing validation events
		//indexed by name for attribute descendants
		this.mapsbyname = {
			accepted:{},
			rejected:{},
			required:{}
		};
		//indexed by position for element descendants
		this.mapsbypos = {
			accepted:{},
			rejected:{},
			required:{}
		};
	};
    CachingWalker.copyToPrototype({
        /** Record a single validation event triggered by a single rule.
         * @param allmaps The object containing one lookup table per status
         * @param mapkey The validation status (which table to put it in)
         * @param rulekey The position or name (in the document) to which the validation status applies
         * @param rule the rule which asserted the validation status.
         */
        putCache:function(allmaps,mapkey,rulekey,rule){
            if(!ThingyUtil.putUniqueKey(allmaps,mapkey,rulekey,rule)){
                throw new ThingyRuleError("Key " + rulekey + " already claimed by another rule");
            }
        },
        /** Return the current validation status for a given position or name by finding which lookup table contains it.
         * @param rulekey
         * @returns {The status}
         */
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
        /** Gets the rule which assigned validation status to a particular
         * position or name (multiple rules trying to assert a status should trigger an error).
         * @param rulekey The position or name (key) being interrogated
         * @returns {The rule which asserted validation status for that key}
         */
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
        nameRequired:function(name, rule){ this.putCache(this.mapsbyname, "required", name, rule); },
        allValid:function(){
            return  this['mapsbyname']['rejected'].length == 0 &&
                this['mapsbyname']['required'].length == 0 &&
                this['mapsbypos']['rejected'].length == 0 &&
                this['mapsbypos']['rejected'].length == 0;
        },
        replay:function(sequenceWalker,sequenceStart,sequenceEnd){
            sequenceEnd = sequenceEnd !== undefined? sequenceEnd : Number.MAX_VALUE;
            var sequencePos = sequenceStart;
            sequenceLoop:
                while(sequencePos < sequenceEnd){
                    var status = this.getCacheStatus(sequencePos);
                    switch(status){
                        case 'accepted':
                            sequenceWalker.posAccepted(sequencePos,this.getCache(sequencePos));
                            break;
                        case 'required':
                            sequenceWalker.posRequired(sequencePos,this.getCache(sequencePos));
                            break;
                        case 'rejected':
                            sequenceWalker.posRejected(sequencePos,this.getCache(sequencePos));
                            break;
                        case null:
                            //no recorded status against next position means walk was already complete
                            break sequenceLoop;
                        default: throw new Error("Unexpected cache status '" + status + "' in successful walk");
                    }
                    sequencePos ++;
                }
        }

    });

    /** A ValidationWalker responds to validation events by throwing
     * errors which can propagate up the stack until they are handled
     * by something monitoring for validation issues. Depending on where
     * the error is handled, it may be possible to selectively resume the walk.
     * @constructor
     */
	function ValidationWalker(){};
	ValidationWalker.prototypeFrom(ElementWalker);
    ValidationWalker.copyToPrototype({
        nameAccepted:function(name,rule){
            //do nothing
        },
        nameRejected:function(name,rule){
            throw new ThingyRuleError("Attribute rejected");
        },
        nameRequired:function(name,rule){
            throw new ThingyRuleError("Attribute missing");
        },
        posAccepted:function(pos,rule){
            //do nothing
        },
        posRejected:function(pos,rule){
            throw new ThingyRuleError("Thingy at pos " + pos + " rejected");
        },
        posRequired:function(pos,rule){
            throw new ThingyRuleError("Child missing");
        }
    });

    /** A RecursiveValidationWalker is a ValidationWalker which
     * spawns a new ValidationWalker for each accepted child.
     * @param parent
     * @constructor
     */
	function RecursiveValidationWalker(parent){
		this.parent = parent;
	};
	RecursiveValidationWalker.prototypeFrom(ValidationWalker);
    RecursiveValidationWalker.copyToPrototype({
        posAccepted:function(pos,rule){
            var child = this.parent.getChildren()[pos];
            if(ThingyUtil.canWalkBelow(rule)){
                var walker = new RecursiveValidationWalker(child);
                ThingyUtil.walkBelow(rule,child, walker);
            }
            else{
                //TODO CH: harsher handling of fallthrough where there is a child but the rule can't handle it?
            }
        }
    });

    /** A CompoundWalker wraps multiple Walkers, allowing them all to be notified of each event in a validation run.
     * @param wrapped The Walkers needing to be wrapped
     * @constructor
     */
	function CompoundWalker(wrapped){
		this.wrapped = [].concat(wrapped); //takes a unique copy of the array (TODO: isn't there a clonearray utility)
	};
	CompoundWalker.prototypeFrom(ElementWalker);
    CompoundWalker.copyToPrototype({
        nameAccepted:function(name,rule){
            this.wrapped.forEach(function(walker){ walker.nameAccepted(name,rule);});
        },
        nameRejected:function(name,rule){
            this.wrapped.forEach(function(walker){walker.nameRejected(name,rule);});
        },
        nameRequired:function(name,rule){
            this.wrapped.forEach(function(walker){walker.nameRequired(name,rule);});
        },
        posAccepted:function(pos,rule){
            this.wrapped.forEach(function(walker){walker.posAccepted(pos,rule);});
        },
        posRejected:function(pos,rule){
            this.wrapped.forEach(function(walker){walker.posRejected(pos,rule);});
        },
        posRequired:function(pos,rule){
            this.wrapped.forEach(function(walker){walker.posRequired(pos,rule);});
        }
    });

	/** Maintains a data structure to accelerate traversal and retrieval requests below the specified thingy. 
	 * @param {Object} node
	 */
	function ThingyTracker(){
		this.metadata = new Hashtable();
		this.nameChangedListener = ThingyUtil.methodHandoffFunction(this, "nameChanged");
		this.valueChangedListener = ThingyUtil.methodHandoffFunction(this, "valueChanged");
		this.childAddedListener = ThingyUtil.methodHandoffFunction(this, "childAdded");
		this.childRemovedListener = ThingyUtil.methodHandoffFunction(this, "childRemoved");
		this.attributeAddedListener = ThingyUtil.methodHandoffFunction(this, "attributeAdded");
		this.attributeRemovedListener = ThingyUtil.methodHandoffFunction(this, "attributeRemoved");
	};
    ThingyTracker.copyToPrototype({
        /** Accesses metadata storage for a thingy previously tracked.*/
        getMetadata:function(thingy){
            if(thingy !== null && this.metadata.containsKey(thingy)){
                var data = this.metadata.get(thingy);
                if(data !== null){
                    return data;
                }
            }
            throw new Error("Thingy is not yet being tracked by this tracker");
        },
        isTracked:function(thingy){
            return this.metadata.containsKey(thingy);
        },
        nameChanged:function(thingy, newname){
            //superclass does nothing
        },
        valueChanged:function(thingy, newval, oldval){
            //superclass does nothing
        },
        childAdded:function(parent,child,childidx){
            this.trackThingy(child);
            this.getMetadata(child)['parent'] = parent;
        },
        childRemoved:function(parent,child,childidx){
            this.untrackThingy(child);
        },
        attributeAdded:function(parent,att){
            this.trackThingy(att);
            this.getMetadata(att)['parent'] = parent;
        },
        attributeRemoved:function(parent,att){
            this.untrackThingy(att);
        },
        trackThingy:function(thingy, data){ //can optionally pass in an initial metadata structure
            if(!this.isTracked(thingy)){
                if(!data){
                    data = {};
                }
                this.metadata.put(thingy,data);
                if(thingy instanceof ContainerThingy){
                    //subscribe for child updates
                    thingy.getChildren(this.childAddedListener, this.childRemovedListener);
                    //track names and attributes of elements
                    if(thingy instanceof ElementThingy){
                        thingy.getName(this.nameChangedListener);
                        thingy.getAttributes(this.attributeAddedListener, this.attributeRemovedListener);
                    }
                }
                if(thingy instanceof ContentThingy){
                    //subscribe for content updates
                    thingy.getValue(this.valueChangedListener);
                    //track names of attributes
                    if(thingy instanceof AttributeThingy){
                        thingy.getName(this.nameChangedListener);
                    }
                }
                return data;
            }
            else{
                throw new Error("Thingy is already being tracked");
            }
        },

        untrackThingy:function(thingy){
            if(this.isTracked(thingy)){
                if(thingy instanceof ContainerThingy){
                    thingy.unbind("childadded", this.childAddedListener);
                    thingy.unbind("childremoved", this.childRemovedListener);
                }
                if(thingy instanceof ElementThingy){
                    thingy.unbind("attributeadded", this.attributeAddedListener);
                    thingy.unbind("attributeremoved", this.attributeRemovedListener);
                }
                if(thingy instanceof ContentThingy){
                    thingy.unbind("valuechanged", this.valueChangedListener);
                }
                var data = this.metadata.remove(thingy);
                return data;
            }
            else{
                throw new Error("Thingy is not being tracked");
            }
        },

        getParent:function(thingy){
            return this.getMetadata(thingy)['parent'];
        },

        /** Consider caching the root in metadata as an acceleration
         * if this function is called a lot. */
        getRoot:function(thingy){
            var parent;
            var pointer = thingy;
            while((parent=this.getParent(pointer)) != null){
                pointer = parent;
            }
            return pointer;
        },

        /** Todo consider efficiency of caching by monitoring child insertion/removal.
         * Todo consider possibility of normalising position and 'key' into YOURX ThingyTracker conventions
         * @param {Object} thingy
         */
        getKey:function(thingy){
            if(!(thingy instanceof AttributeThingy)){
                return this.getPosition(thingy);
            }
            else{
                return thingy.getName();
            }
        },

        /** Todo consider efficiency of caching by monitoring child insertion/removal.
         * Todo consider possibility of normalising position and 'key' into YOURX ThingyTracker conventions
         * @param {Object} thingy
         */
        getPosition:function(thingy){
            if(!(thingy instanceof AttributeThingy)){ //Attribute thingies don't have a position
                var parent = this.getParent(thingy);
                if(parent){ //Unparented thingies don't have a position
                    var count;
                    for(count=0; count < parent.children.length; count++){
                        if(parent.children[count]===thingy){ //found the position
                            return count;
                        }
                    }
                }
            }
            return -1;
        },

        /** Performs a document order traversal, visiting elements in sequence
         * of their first appearance in the document. Siblings are visited after
         * their preceding sibling and its descendants. If the test function returns
         * a truthy value, then the traversal is terminated early.
         * @param {Object} totest The item at which the traversal should start
         * @param {Object} testfun The function which should be used to visit each thingy
         * @return The truthy value returned by the test function, or null if the traversal was not terminated.
         */
        traverseDocumentOrder:function(totest, testfun){
            var result;
            visitloop: while (totest) { //loop which triggers a test function call each round
                result = testfun(totest);
                if (result) {
                    return result;
                }
                else {
                    //try to descend
                    if (totest instanceof ContainerThingy) {
                        if (totest.children.length) {
                            totest = totest.children[0];
                            continue visitloop;
                        }
                    }
                    var parent, pos;
                    ascendloop: while (totest) { //loop which ascends until available siblings
                        parent = this.getParent(totest);
                        pos = this.getPosition(totest);
                        if (parent) { //item is a child
                            if (pos !== parent.children.length - 1) { //siblings available; traverse the next one
                                totest = parent.children[pos + 1];
                                continue visitloop;
                            }
                            else { //no more siblings; try to find siblings of ancestors
                                totest = parent;
                                continue ascendloop;
                            }
                        }
                        else { //backed up to root node; end traversal
                            totest = null;
                        }
                    }
                }
            }
            return null;
        }


    });
	

	//evaluate the export function in this scope	
	return eval(writeScopeExportCode([
		//General Javascript utility functions
		'getGlobal','writeScopeExportCode','copyProperties','cloneArray', 
		//Thingy-oriented utility functions
		"ThingyUtil", 
		//Thingy instances used to create trees storing data
		"Thingy","ContainerThingy","ContentThingy","RootThingy","ElementThingy","AttributeThingy","TextThingy",
		//ThingyRule objects used to validate trees storing data 
		"ThingyGrammar","ThingyRule","ElementThingyRule","AttributeThingyRule","TextThingyRule","OptionalThingyRule","ZeroOrMoreThingyRule","OneOrMoreThingyRule",
		//Traversal utilities for finding correspondances and differences between trees and their grammars
		"ElementWalker","CachingWalker","CompoundWalker",
		"ThingyTracker",
		"ThingyRuleError", "UnsupportedOperationError"
	]));
		
}();