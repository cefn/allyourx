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

    /** A sort function which causes Array#sort to sort numerically.*/
    function numerically(a,b){
        return a - b;
    }

    function invert(fun){
        return function(item){
            return !fun(item);
        }
    }

    function isNumbery(x){
        if(x===''){
            return false;
        }
        else{
            try{
                return !isNaN(x);
            }
            catch(e){
                return false;
            }
        }
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
            else if(node instanceof Comment){
                //ignore for now
                return null;
            }
            else if(node instanceof ProcessingInstruction){
                //ignore for now, although schema instruction will be read eventually
                return null;
            }
			else{
				throw new Error("Unexpected node type when parsing XML");					
			}
		},
        children2rules:function(node){
            var childRules = [];
            cloneArray(node.childNodes).forEach(function(item){
                childRules = childRules.concat(ThingyUtil.dom2rule(item));
            });
            return childRules;
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
                    else if (name == "text") { //matches Text node, with implicitly implies literal based on text node content
                        result = new TextThingyRule();
                        result.getChildren().push(new LiteralThingyRule(node));
                    }
                    else if (name == "data") { //needs child rules to validate characters against XSD
                        if(node.parentNode.nodeName === "attribute"){
                            //validates character data contained as value in attribute parent
                            //simply add rule child
                            result = new DataThingyRule(node);
                        }
                        else if(node.parentNode.nodeName === "element"){
                            //validates character data contained in a text node of element parent
                            //add TextThingyNode - text node implicit
                            result = new TextThingyRule();
                            result.getChildren().push(new DataThingyRule(node));
                        }
                    }
                    else if (name == "oneOrMore") {
                        result = new OneOrMoreThingyRule(node);
                    }
                    else if (name == "choice") {
                        result = new ChoiceThingyRule(node);
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
                    else if (name == "empty") {
                        //list of child rules should be empty
                        result = [];
                    }
                    else {
                        throw new Error("Unsupported element '" + name + "' found when loading ThingyRules");
                    }
                }
                //store resulting ThingyRule(s) against the node
                // (to prevent cycles infinitely constructing new ThingyRules)
                $(node).data(CACHE,result);
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
        /** Walks a set of rules over a sequence of characters, notifying validation events
         * @param textRules The rules to validate character sequences
         * @param textValue The character sequence to read
         * @param textWalker The walker which monitors the validation events and decides what to do
         * @param textStart The index within the string where the characters should be validated from.
         * @returns {*}
         */
        walkStringWithRules:function(textRules, textValue, textWalker, textStart){
            textStart = textStart !== undefined ? textStart : 0;
            var consumed = 0;
            textRules.forEach(function(rule){
                consumed += rule.walkString(textValue,textWalker,textStart + consumed);
            });
            return consumed;
        },
        walkStringWithRulesOrReject:function(textRules,textValue,textWalker,enforcer,startfrom,rejectto){
            startfrom = startfrom !== undefined? startfrom: 0; //default; start matching from first position of sequence
            rejectto = rejectto!== undefined? rejectto: textValue.length; //default; rules must pattern match the whole sequence

            //arrange to store walk results
            var cachingwalker = new CachingWalker();

            //walk
            var consumed = ThingyUtil.walkStringWithRules(textRules,textValue,cachingwalker, startfrom);

            //rejected unmatched positions on behalf of the enforcing (parent?) rule
            var pos;
            for(pos = startfrom ; pos < rejectto; pos++){
                if(! ('accepted' in cachingwalker.getCachedStatuses(pos))){
                    cachingwalker.posRejected(pos,enforcer);
                }
            }

            //replay the sequence, including posRejected events
            cachingwalker.replayPositions(textWalker);

            //report the next unbound position in the sequence
            return consumed;

        },
        /** Walks a set of rules over a sequence of Thingies (stored by position), notifying validation events
		 * @param {Array} rls The rules to validate the Thingies
		 * @param {Array} sequence The Thingies
         * @param {Walker} walker The walker which monitors the validation events and decides what to do
         * @param {Number} startfrom The index within the sequence where the rules should read from
		 * @return {Number} The number of positions accepted by the rules.
		 */
		walkSequenceWithRules:function(rls,sequence,walker,startfrom){
            var startfrom = startfrom !== undefined ? startfrom : 0;
			var consumed = 0;
            rls.forEach(function(rule){
                consumed += rule.walkSequence(sequence, walker, startfrom + consumed);
			});
            return consumed;
		},
		/** Walks a set of rules over a sequence of Thingies (stored by position), notifying validation events 
		 * and fires a rejection event for any Thingies which are not positively accepted by a rule once the walk has completed.
		 * @param {Array} rls The rules to validate the Thingies
		 * @param {Array} sequence The Thingies
         * @param {Walker} walker The walker to monitor validation events
		 * @param {Object} enforcer The entity on behalf of which the rejection is fired
         * @param {Number} startwalk The position in the Thingy sequence to start walking
         * @param {Number} endreject Items up to this position must be matched
         * @return {Number} The number of positions accepted by the rules
		 */
		walkSequenceWithRulesOrReject:function(rls,sequence,walker,enforcer,startfrom,rejectto){
            startfrom = startfrom !== undefined ? startfrom: 0; //default; start matching from first position of sequence
            rejectto = rejectto !== undefined ? rejectto: sequence.length; //default; rules must pattern match the whole sequence

            //arrange to store walk results
			var cachingwalker = new CachingWalker();

			//walk
            var consumed = ThingyUtil.walkSequenceWithRules(rls,sequence,cachingwalker,startfrom);
			
			//rejected unmatched positions on behalf of the enforcing (parent?) rule
			var pos;
			for(pos = startfrom ; pos < rejectto; pos++){
                var statusDict = cachingwalker.getCachedStatuses(pos);
				if(statusDict === null || ! ("accepted" in statusDict)){
					cachingwalker.posRejected(pos,enforcer);
				}
			}

            //replay the sequence
            cachingwalker.replayPositions(walker,startfrom,rejectto);

            //report the next unbound position in the sequence
            return consumed;

		},
		/** Tests if a rule has duck-typing to do a recursive validation walk on descendant Thingies,
         * Returns true if the rule processes Attributes, Child Nodes (Element or Text nodes)
         * or Character data (individual characters as 'descendants' of a text node)
		 * @param {ThingyRule} rule The rule to walk descendants.
		 */
		canWalkBelow:function(rule){
			return ("walkAttributes" in rule) || ("walkChildren" in rule) || "walkCharacters" in rule;
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
                //traverse children for all containers, including element nodes and text nodes
                rule.walkChildren(thingy,walker);
            }
            if('walkCharacters' in rule){
                //traverse characters of an attribute node or text node
                rule.walkCharacters(thingy,walker);
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

			//walk
			ThingyUtil.walkMapWithRules(rls,map,cachingwalker);
			
			//rejected unmatched names on behalf of the enforcing (parent?) rule
			for(name in map){
                var statusDict = cachingwalker.getCachedStatuses(name);
				if(statusDict === null || !('accepted' in statusDict)){
					cachingwalker.nameRejected(name, enforcer);
				}
			}

            cachingwalker.replayNames(walker);

		}
	};
	
	/** Error definitions. */
	
	function UnsupportedOperationError(message, origin) {
	    this.name = "UnsupportedOperationError";
	    this.message = (message || "");
        this.origin = origin;
	}
	UnsupportedOperationError.prototypeFrom(Error);

    /** A ThingyRuleError is used to encode, for example, validation failures
     * @param message The message describing the failure
     * @param related An object with named entries related to debugging
     * @constructor
     */
	function ThingyRuleError(message, related) {
	    this.name = "ThingyRuleError";
	    this.message = (message || "");
        this.related = related;
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
                    child = this.children[childidx];
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
                throw new Error("Malformed invocation of ContainerThingy#removeChild()");
            }

        },

        getChildThingy: function (key) {
            if (arguments.length === 1) {
                if (isNumbery(key)) {
                    key = Number(key);
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
            if(!isNumbery(key)){ //check it's not a child key
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
        getAttributeValue:function(name){
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
        /** This function should be implemented to call back on the specified walker
         * indicating whether individual locations in a sequence are...
         * <ul>
         *     <li><i>accepted</i> by the rule (which are valid at their position)</li>
         *     <li><i>rejected</i> by the rule (which <em>are</em> at their position, but are not accepted by this rule</li>
         *     <li><i>required</i> by the rule (which aren't at their position, but are needed by this rule)</li>
         * </ul>
         * @param ths The sequence of thingies being validated
         * @param walker The walker getting validation notifications
         * @param startidx The position in the sequence to start validating
         * @return The the number of positions accepted by the rule.
         *
         * Note: This mirrors the behaviour of walkString on a per-character basis within StringThingyRule.
         */
        walkSequence:function(ths, walker, startidx){
            throw new UnsupportedOperationError("Sequence walk not implemented", this);
        },
        /** A method which should mirror the above 'walkSequence' in its behaviour, but validating
         * single characters instead of DOM nodes.
         * @param stringValue The character sequence to validated
         * @param stringWalker The walker getting validation notifications
         * @param stringStart The position in the string to start validating
         * @return The the number of positions accepted by the rule.
         */
        walkString:function(stringValue, stringWalker, stringStart){
            throw new UnsupportedOperationError("String walk not implemented", this);
        },
        /** A method which calls out validation events on attribute names.
         * @param map A dictionary containing AttributeThingy objects indexed by name
         * @param walker The walker getting validation notifications
         */
        walkMap:function(map,walker){
            throw new UnsupportedOperationError("Map walk not implemented", this);
        }
    });

    function SingleThingyRule(children){
        ThingyRule.apply(this,arguments);
    }
    SingleThingyRule.prototypeFrom(ThingyRule);
    SingleThingyRule.copyToPrototype({
        matchThingy:function(){
            throw new UnsupportedOperationError("Match not yet implemented", this);
        },
        walkSequence:function(sequence,walker,startfrom){
            if(sequence.length > startfrom){ //check there is a candidate at all
                if(this.matchThingy(sequence[startfrom], true)){ //test only for shallow match
                    walker.posAccepted(startfrom, this);
                    return 1;
                }
            }
            walker.posRequired(startfrom, this);
            return 0;
        },
    });

	function ContainerThingyRule(){}
	ContainerThingyRule.prototypeFrom(SingleThingyRule);
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
        },
    });

    /** ContentThingyRule has validation logic for rules bound against ContentThingy types, such as...
     * AttributeThingyRule, DataThingyRule or TextThingyRule
     * @constructor
     */
    function ContentThingyRule(children){
        ThingyRule.apply(this,[children]);
    };
    ContentThingyRule.prototypeFrom(ThingyRule);
    ContentThingyRule.copyToPrototype({
       walkCharacters:function(thingy,stringWalker){
           var stringRules = this.getChildren(); //.filter(function(rule){ return "walkString" in rule; });
           var stringValue = thingy.getValue();
           ThingyUtil.walkStringWithRulesOrReject(stringRules, stringValue, stringWalker, this, 0, stringValue.length);
       }
    });

    function ThingyGrammar(){
		if(arguments.length == 1 && arguments[0] instanceof Document){
			var docnoderuleq = $("grammar>start>*", arguments[0]);
			if(docnoderuleq.length == 1){
				TypedThingyRule.apply(this,["RootThingy", ThingyUtil.dom2rule(docnoderuleq.get(0))]);
			}
			else{
				throw new Error("Could not match a unique document node rule");
			}				
		}
		else{
			throw new Error("Malformed arguments to ThingyGrammar constructor");
		}
	}
	ThingyGrammar.prototypeFrom(TypedThingyRule);
    ThingyGrammar.copyToPrototype(
        ContainerThingyRule.prototype,
        {
            matchThingy:function(thingy){
                if(TypedThingyRule.prototype.matchThingy.apply(this,arguments)){
                    return ContainerThingyRule.prototype.matchThingy.apply(this,arguments);
                }
                return false;
            }
    });

	function TypedThingyRule(typename, children){
		this.typename = typename;
		SingleThingyRule.apply(this,[children]);
	}
	TypedThingyRule.prototypeFrom(SingleThingyRule);
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
                    NamedThingyRule.apply(this,[name, "ElementThingy", ThingyUtil.children2rules(el)]);
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
             * and adds Attribute checking when called with recursion (shallow==false).
             * @param thingy the thingy to try and match with this rule
             * @param shallow whether to check child rules and child thingies match recursively
             * @returns {boolean}
             */
             matchThingy:function(thingy, shallow){
                if(NamedThingyRule.prototype.matchThingy.apply(this,arguments)){
                    if(ContainerThingyRule.prototype.matchThingy.apply(this,arguments)){
                        if(!shallow){
                            var walker = new RecursiveValidationWalker(thingy);
                            this.walkAttributes(thingy,walker); //xRequired or xRejected will trigger exception
                        }
                        return true;
                    }
                }
                return false;
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

    /** Superclass for validation rules which require specific character data in text nodes, such as
     * DataThingyRule (for text nodes matching XML Schema Datatypes), LiteralThingyRule (for text nodes
     * matching pre-defined character sequences) or AnyTextRule (allowing any character data). Note,
     * these validation rules are children of the rules
     * which actually match the thingies. For example, a TextThingyRule or an AttributeThingyRule is
     * needed as a parent rule. */
    function StringThingyRule() {
    }
    StringThingyRule.prototypeFrom(ThingyRule);
    StringThingyRule.copyToPrototype({
        matchThingy:function(thingy,shallow){ //shallow is ignored
            //A StringThingyRule doesn't match any thingy at all. It is used to validate character content found within a thingy.
            throw new UnsupportedOperationError("matchThingy is not a valid operation for a StringThingyRule", this);
        }
    });

    function AttributeThingyRule(){
		if(arguments[0] instanceof Element){ //creation from values in DOM node
			var el = arguments[0];
			if(el.nodeName=="attribute"){
				var name = el.getAttribute("name");
				if(name){
                    //characters can be validated by <text/> with a literal, or <data/> (XSD)
                    var children = ThingyUtil.children2rules(el);
                    //if no explicit <text/> or <data/> then any character literal would be allowed
                    if(children.length === 0){
                        children.push(new LiteralThingyRule(null));
                    }
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
	AttributeThingyRule.prototypeFrom(NamedThingyRule); 
    AttributeThingyRule.copyToPrototype(
        ContentThingyRule.prototype,
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
		TypedThingyRule.apply(this,['TextThingy',[]]);
	}
	TextThingyRule.prototypeFrom(TypedThingyRule);
    TextThingyRule.copyToPrototype(
        ContentThingyRule.prototype,
        {
            walkSequence:function(sequence,sequenceWalker,sequenceStart) {
                if(sequence.length > sequenceStart){
                    if(sequence[sequenceStart] instanceof TextThingy){
                        sequenceWalker.posAccepted(sequenceStart, this);
                        return 1;
                    }
                }
                sequenceWalker.posRequired(sequenceStart, this);
                return 0;
            }
        }
    );

    /** Enforces character content to correspond to an XML Schema datatype.
     * Examples of these types (of which only some are implemented) are...
     * boolean, base64binary, hexBinary, anyURI, language, normalizedString,
     * string, token, byte, decimal, double, float, int, integer, long,
     * negativeInteger, nonNegativeInteger, nonPositiveInteger, positiveInteger,
     * short, unsignedByte, unsignedInt, unsignedLong, unsignedShort,
     * date, dateTime, duration, gDay, gMonth, gMonthDay, gYear, gYearMonth, time,
     * Name, NCName, QName, ENTITY, ENTITIES, ID, IDREF, IDREFS, NMTOKEN, NMTOKENS
     * anyType, anySimpleType
     * @constructor
     */
    function DataThingyRule(){
        if(arguments[0] instanceof Element){ //creation from values in DOM node
            var el = arguments[0];
            if(el.nodeName=="data"){
                var type = el.getAttribute("type");
                if(type){
                    this.type = type;
                }
                else{
                    throw new Error("Cannot populate DataThingyRule 'data' DOM element has no 'type' attribute");
                }
            }
            else{
                throw new Error("Cannot populate DataThingyRule with DOM element called " + el.nodeName);
            }
        }
        else{
            throw new Error("Malformed arguments to DataThingyRule constructor");
        }
        StringThingyRule.apply(this,[]); //Data rules have no children - empty child array
    }
    DataThingyRule.prototypeFrom(StringThingyRule);
    DataThingyRule.copyToPrototype({
        typePatterns:{
            float:"[-+]?[0-9]*\.?[0-9]+"
        },
        walkString:function(stringValue,stringWalker,stringStart){
            if(this.type in this.typePatterns){
                var pattern = this.typePatterns[this.type];
                var match = stringValue.substr(stringStart).match(pattern);
                if(match !== null){
                    var stringPos;
                    for(stringPos = stringStart; stringPos < match.index + match[0].length; stringPos++ ){
                        stringWalker.posAccepted(stringPos, this);
                    }
                    return match[0].length;
                }
                else{
                    stringWalker.posRequired(stringStart, this);
                    return 0;
                }
            }
            throw new UnsupportedOperationError("walkString is not yet implemented for type " + this.type, this);
        }
    });

    function LiteralThingyRule(){
        if(arguments[0] instanceof Element){ //creation from values in DOM node
            var el = arguments[0];
            if(el.nodeName=="text"){
                var literalValue = $(el).contents().filter(function() {
                    return this.nodeType == 3;
                }).text();
                if(literalValue){
                    this.value = literalValue; //specific text allowed
                }
                else{
                    this.value = null; //any text allowed
                }
            }
            else{
                throw new Error("Cannot populate LiteralThingyRule with DOM element called " + el.nodeName);
            }
        }
        else if (arguments[0] instanceof String){
            this.value = arguments[0]; //specific text allowed
        }
        else if (arguments[0] === null){
            this.value = null; //any text allowed
        }
        else{
            throw new Error("Malformed arguments to LiteralThingyRule constructor");
        }
        StringThingyRule.apply(this,[]); //Literal rules have no children - empty child array
    }
    LiteralThingyRule.prototypeFrom(StringThingyRule);
    LiteralThingyRule.copyToPrototype({
        walkString:function(stringValue,stringWalker,stringStart){
            var acceptedCount = 0;
            var stringPos;
            if(this.value !== null){ //test against literal characters
                var valuePos;
                for(valuePos=0;valuePos< this.value.length; valuePos++){
                    stringPos = stringStart + valuePos;
                    if(stringValue.length > stringPos){
                        if(stringValue.charAt(stringPos) == this.value.charAt(valuePos)){ //accept the character
                            stringWalker.posAccepted(stringPos,this);
                            acceptedCount++;
                        }
                        else{
                            break;
                        }
                    }
                }
                if(valuePos !== this.value.length){ //check if whole value was matched
                    stringWalker.posRequired(stringPos,this);
                }
            }
            else{ //consume all available characters (can't be invalid)
                for(stringPos=stringStart;stringPos<stringValue.length ; stringPos++){
                    stringWalker.posAccepted(stringPos, this);
                    acceptedCount++;
                }
            }
            return acceptedCount;
        }
    });



    /** The QuantifiedThingyRule provides a mechanism for its descendant rules to be repeated
     * between 'min' and 'max' times, corresponding with the 'optional', 'zeroOrMore' and 'oneOrMore'
     * RelaxNG rules. To express these alternatives it provides a procedure for descendant rules to
     * bind between 0 and Number.MAX_VALUE times. To count as a binding, the whole sub-pattern has
     * to be matched.
     * The QuantifiedThingyRule therefore consumes or generates new walker callbacks. For example:
     * In the case that min>0 (corresponding to RelaxNG's 'oneOrMore') at least one sub-pattern is
     * required, so the QuantifiedThingyRule will raise an xRequired() callback if any of its sub-pattern
     * reports it is unsatisfied. Equally, in the case that min==0 (for example corresponding to RelaxNG
     * 'optional' or 'zeroOrMore'), then it will consume it's sub-pattern's xRequired() or xRejected() calls.
     */
    function QuantifiedThingyRule(min, max, el, elNameMatch){
        this.min = min;
        this.max = max;
        if(el instanceof Element && el.nodeName===elNameMatch) { //creation from values in DOM node
            ThingyRule.apply(this,[ ThingyUtil.children2rules(el) ]);
        }
        else{ throw new Error("Malformed arguments to QuantifiedThingyRule constructor"); }

    }
    QuantifiedThingyRule.prototypeFrom(ThingyRule); //TODO need equivalent for walkMap? Are Attributes valid in Quantifications
    QuantifiedThingyRule.copyToPrototype({
        walkSequence:function(sequence,sequenceWalker,sequenceStart) {
            //try to match all child rules a whole number of times
            var goodWalkers = [], badWalkers = [];
            var consumed = 0;
            var patternPos;
            for(patternPos = 0; patternPos < this.max; patternPos++){
                var cachingWalker = new CachingWalker();
                consumed += ThingyUtil.walkSequenceWithRules(this.children,sequence,cachingWalker,sequenceStart + consumed);
                if(cachingWalker.keysWithoutStatus('accepted').length === 0){
                    goodWalkers.push(cachingWalker);
                }
                else{ //the moment an issue is hit, record failure and bail from repetition
                    badWalkers.push(cachingWalker);
                    break;
                }
            }
            //re-run events
            var consumed = 0;
            goodWalkers.forEach(function(goodWalker){
                goodWalker.replayPositions(sequenceWalker,sequenceStart + consumed);
                consumed += goodWalker.keysWithStatus('accepted').length;
            });
            if(goodWalkers.length < this.min){ //repetitions below lower bound, replay failed validation events
                badWalkers.forEach(function(badWalker){
                    badWalker.replayPositions(sequenceWalker,sequenceStart + consumed);
                    consumed += badWalker.keysWithStatus('accepted').length;
                });
            }
            return consumed;
        }
    });

    function OneOrMoreThingyRule(el){
        QuantifiedThingyRule.apply(this, [1, Number.MAX_VALUE, el, "oneOrMore"]);
    }
    OneOrMoreThingyRule.prototypeFrom(QuantifiedThingyRule);

    function OptionalThingyRule(){
        QuantifiedThingyRule.apply(this, [0, 1, el, "optional"]);
	}
	OptionalThingyRule.prototypeFrom(QuantifiedThingyRule);

	function ZeroOrMoreThingyRule(){
        QuantifiedThingyRule.apply(this, [0, Number.MAX_VALUE, el, "zeroOrMore"]);
	}
	ZeroOrMoreThingyRule.prototypeFrom(QuantifiedThingyRule);

    function ChoiceThingyRule(el){
        if(el instanceof Element && el.nodeName==="choice"){ //creation from values in DOM node
            ThingyRule.apply(this,[ThingyUtil.children2rules(el)]);
        }
        else{ throw new Error("Malformed arguments to choice constructor"); }
    }
    ChoiceThingyRule.prototypeFrom(ThingyRule);
    ChoiceThingyRule.copyToPrototype({
        walkSequence:function(sequence,sequenceWalker,sequenceStart) {
            var childWalkers = [];
            // cache the validation walk of each child (disjoint rules),
            // replay the first walker which has fewest 'xRejected' or 'xRequired' calls
            this.children.forEach(function(rule){
                var cachingWalker = new CachingWalker();
                ThingyUtil.walkSequenceWithRules([rule],sequence,cachingWalker,sequenceStart);
                childWalkers.push({
                    accepted:cachingWalker.keysWithStatus('accepted').length,
                    walker:cachingWalker
                });
            });

            // TODO: It's not obvious which of the walkers to fire events for, issues being...
            // - the first one found (prioritising a valid walk)?
            // - the one which consumes the longest sequence?
            // - the one which avoids consuming items needed for validation of other rules?
            // perhaps it's feasible to add flags to the walkSequence(...) invocation for different
            // failure-handling preferences?


            //sort walkers first by problemCount then second (implicitly), by grammar order, earliest first
            //sort by problemCount ascending
            childWalkers.sort(function(a,b){ return b.accepted - a.accepted; }); //places highest scoring walker first

            if(childWalkers.length > 0){ //use walker with highest score
                var selectedWalker = childWalkers[0].walker;
                selectedWalker.replayPositions(sequenceWalker,sequenceStart);
                return selectedWalker.keysWithStatus('accepted').length;
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
    function Walker(){};
    Walker.prototypeFrom(Object);

    /** A SequenceWalker provides stub implementations of the functions involved in
     * positional validation (for a sequence of children).
     * @constructor
     */
	function SequenceWalker(){};
    SequenceWalker.prototypeFrom(Walker);
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
    MapWalker.prototypeFrom(Walker);
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
    ElementWalker.prototypeFrom(Walker);
	ElementWalker.copyToPrototype(
        SequenceWalker.prototype,
        MapWalker.prototype
    );

    /** A walker which handles validation events against a single parent by
     * recording the validating rule against the appropriate key (number or text).
     * This allows a walk to be inspected after the fact, for example to identify
     * children or attributes for which NO event was triggered. It contains a cache
     * object containing number:rule mappings (corresponding with element/textnode positions)
     * or string:rule mappings (corresponding with attribute names)
     * @constructor
     */
	function CachingWalker(){
        this.resetCache();
	};
    CachingWalker.copyToPrototype({
        /** @param key Optional key to reset cache, if not specified, all keys are reset
         */
        resetCache:function(){
            if(arguments.length === 0){ //reset whole cache
                this.cache = {
                };
            }
            else if(arguments.length === 1){
                key = arguments[0];
                delete this.cache[key];
            }
        },
        /** Record a single validation event triggered by a single rule.
         * @param putStatus The validation status
         * @param putKey The position or name (in the document) to which the validation status applies
         * @param putRule The rule which asserted the validation status.
         */
        putCache:function(putStatus,putKey,putRule){
            //check dictionary exists for this key
            var statusDict;
            if(putKey in this.cache){
                statusDict = this.cache[putKey];
            }
            else{
                statusDict = {};
                this.cache[putKey] = statusDict;
            }
            //check list exists for this status at this key
            var ruleList;
            if(putStatus in statusDict){
                ruleList = statusDict[putStatus];
            }
            else{
                ruleList = [];
                statusDict[putStatus] = ruleList;
            }
            ruleList.push(putRule);
        },
        /** Return the current validation status for a given position or name by finding which lookup table contains it.
         * @param getKey The key for which to get the status (position or name).
         * @returns {*} The status or null if no status was found.
         */
        getCachedStatuses:function(getKey){
            if(getKey in this.cache){
                return this.cache[getKey];
            }
            return null;
        },
        posAccepted:function(pos, rule){
            undefined;
            this.putCache("accepted", pos, rule);
        },
        posRejected:function(pos, rule){
            undefined;
            this.putCache("rejected", pos, rule);
        },
        posRequired:function(pos, rule){
            undefined;
            this.putCache("required", pos, rule);
        },
        nameAccepted:function(name, rule){
            undefined;
            this.putCache("accepted", name, rule);
        },
        nameRejected:function(name, rule){
            undefined;
            this.putCache("rejected", name, rule);
        },
        nameRequired:function(name, rule){
            undefined;
            this.putCache("required", name, rule);
        },
        keysWithStatus:function(status){
            var cache = this.cache;
            return Object.keys(cache).filter(function(key){
                return status in cache[key];
            });
        },
        keysWithoutStatus:function(status){
            var cache = this.cache;
            return Object.keys(cache).filter(function(key){
                return ! (status in cache[key]);
            });
        },
        /**
         * @param sort A sort function. If not specified then sort order is arbitrary
         * @returns {Array}
         */
        getCachedKeys:function(sort){
            var keys = Object.keys(this.cache);
            if(sort !== undefined){
                keys.sort(sort);
            }
            return keys;
        },
        replayNames:function(mapWalker, keys){
            //by default populate list with all non-numeric keys with previously cached status
            if(keys === undefined){
                keys = this.getCachedKeys().filter(function(key){ return !YOURX.isNumbery(key); });
            }

            //mapping between statuses and callback functions
            var statuses = ['accepted','required','rejected'];
            var callbacks = [mapWalker.nameAccepted,mapWalker.nameRequired,mapWalker.nameRejected];

            //fire events for the key list
            var keyPos;
            for(keyPos = 0; keyPos < keys.length; keyPos++){
                var testKey = keys[keyPos];
                var statusDict = this.cache[testKey];
                statuses.forEach(function(status, idx){
                    var callback = callbacks[idx];
                    if(status in statusDict){
                       statusDict[status].forEach(function(rule){ //get the list of rules with this status
                           callback.apply(mapWalker,[testKey,rule]);
                       });
                    }
                });
            }
        },
        replayPositions:function(sequenceWalker,sequenceFirst,sequenceLast){

            //get all positional keys, and coerce to number
            var posKeys = this.getCachedKeys().filter(function(key){ return YOURX.isNumbery(key); });

            if(posKeys.length > 0){

                //sort ascending
                posKeys.sort(numerically);

                // calculate bounds (if not specified) based on largest and smallest available posKey
                sequenceFirst = sequenceFirst !== undefined? sequenceFirst : posKeys[0];
                sequenceLast = sequenceLast !== undefined? sequenceLast : posKeys[posKeys.length - 1];

                //mapping between statuses and callback functions
                var statuses = ['accepted','required','rejected'];
                var callbacks = [sequenceWalker.posAccepted,sequenceWalker.posRequired,sequenceWalker.posRejected];

                //iterate over rules' statuses replaying validation events accordingly
                var keyIdx;
                keyIteration:
                for(keyIdx = 0; keyIdx < posKeys.length; keyIdx++) {
                    var sequencePos = posKeys[keyIdx];
                    if (sequencePos < sequenceFirst || sequencePos > sequenceLast) {
                        //ignore this key, it's not in range
                    }
                    else{
                        //fire events for this key
                        var statusDict = this.cache[sequencePos];
                        statuses.forEach(function(status, idx){
                            var callback = callbacks[idx];
                            if(status in statusDict){
                                statusDict[status].forEach(function(rule){ //get the list of rules with this status
                                    callback.apply(sequenceWalker,[sequencePos,rule]);
                                });
                            }
                        });
                    }
                }

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
            undefined;//do nothing
        },
        nameRejected:function(name,rule){
            undefined;
            throw new ThingyRuleError("Attribute with name " + name + " is rejected", rule);
        },
        nameRequired:function(name,rule){
            undefined;
            throw new ThingyRuleError("Attribute with name " + name + " is missing", rule);
        },
        posAccepted:function(pos,rule){
            undefined;//do nothing
        },
        posRejected:function(pos,rule){
            undefined;
            throw new ThingyRuleError("Thingy at pos " + pos + " is rejected", rule);
        },
        posRequired:function(pos,rule){
            undefined;
            throw new ThingyRuleError("Thingy at pos " + pos + " is required", rule);
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
        posAccepted:function(pos,rule){ //triggers validation of elements (children and attributes) or text nodes (characters)
            if(ThingyUtil.canWalkBelow(rule)){
                var child = this.parent.getChildren()[pos];
                var walker = new RecursiveValidationWalker(child);
                ThingyUtil.walkBelow(rule,child, walker);
            }
            else{
                //TODO CH: harsher handling of fallthrough where there is a child but the rule can't handle it?
            }
        },
        nameAccepted:function(name,rule){ //handles case of string validation of attributes
            var att = this.parent.getAttributeThingy(name);
            if(ThingyUtil.canWalkBelow(rule)){
                var walker = new RecursiveValidationWalker(att);
                ThingyUtil.walkBelow(rule,att, walker);
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
            if(thingy){
                if(this.metadata.containsKey(thingy)){
                    var data = this.metadata.get(thingy);
                    if(data !== null){
                        return data;
                    }
                }
                throw new Error("Thingy is not yet being tracked by this tracker");
            }
            else{
                throw new Error("Null or undefined Thingy. Cannot retrieve metadata");
            }
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
            this.trackThingy(child, {parent:parent});
        },
        childRemoved:function(parent,child,childidx){
            this.untrackThingy(child);
        },
        attributeAdded:function(parent,att){
            this.trackThingy(att, {parent:parent});
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
		'getGlobal','writeScopeExportCode','copyProperties','cloneArray', 'invert', 'isNumbery',
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