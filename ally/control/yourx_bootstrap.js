/** This file modifies the environment to improve support for functions often used in 
 * the YOURX library. If these exist in your environment already, you don't need this bootstrap file.
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
	}
}();

/** Replace jquery clean function with one which respects E4X (html) as selector (expands to a string). */
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

/*
 * Various functions defined in a pow-specific library file, 
 * created in a private scope, with public functions served
 * under the YOURX namespace.
 */
YOURX = (function(){

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
	
	function readFile(filename){
		if(pow_file){
			return pow_file(filename);				
		}
		else{
			throw new Error("No implementation for readFile exists on your platform");
		}
	}
	
	function evalFile(filename){
		return eval(readFile(filename));
	}		
	
	function writeScopeExportCode(propnames){
		var pairs = [];
		propnames.forEach(function(item){pairs.push("\"" + item + "\":" + item)});
		return "({" + pairs.join(",") + "})"; 		
	}
		
	return eval(writeScopeExportCode([
		'getGlobal','readFile','evalFile','writeScopeExportCode','copyProperties','cloneArray'
	]));
	
}());