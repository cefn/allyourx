pow_header("Content-Type:application/xhtml+xml"); 

/** Replace document write function with one which respects E4X as source. */
var oldfunc = document.write;
document.write = function(){
	var args = Array.prototype.slice.call(arguments); //from http://shifteleven.com/articles/2007/06/28/array-like-objects-in-javascript
	if(args.length > 0){
		var item = args[0];
		if(typeof item == 'xml'){
			args[0] = item.toXMLString();			
		}
	}
	return oldfunc.apply(this,args);
};