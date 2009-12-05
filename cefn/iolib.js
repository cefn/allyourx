/** Universal access for global variable regardless of browser or non-browser environment. */
function getGlobal(){ //from http://www.nczonline.net/blog/2008/04/20/get-the-javascript-global/
	return (function(){return this;})();
}

YOURX = function(){
	
	/** From Crockford prototypal inheritance tutorial. http://javascript.crockford.com/prototypal.html */
	var object = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    }

	/** Utility methods in a 'static' library object */
	
	var ThingyUtil = { //TODO consider reusing single static DOMParser and XMLSerializer
		log:function(msg){$(function(){$('body').prepend(msg + <br/>.toXMLString())});},
		xml2e4x:function(xml){ return new XML(ThingyUtil.xmlStripComments(xml));},
		xml2dom:function(xml){ return (new DOMParser()).parseFromString(xml,"text/xml");},
		e4x2xml:function(e4x){ return e4x.toXMLString();},
		e4x2dom:function(e4x){ return ThingyUtil.xml2dom(ThingyUtil.e4x2xml(e4x));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
		dom2e4x:function(dom){ return new XML(ThingyUtil.dom2xml(dom));}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
		dom2xml:function(dom){ return (new XMLSerializer()).serializeToString(dom);},
		xmlStripComments:function(xml){return xml.replace(/<\?(.*?)\?>/g,"");}, /** From http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4 */
		greedyConsumeSequence:function(rls, ths) {
			var origths = ths;
			var rlidx = 0, consumed = 0;
			while(rlidx < rls.length){
				consumed = rls[rlidx].greedyConsume(ths);
				ths = ths.slice(consumed, ths.length); 
				rlidx++;
			};
			return origths.length - ths.length;
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
	
	function Thingy(){
		this.data = {};
	}
	Thingy.prototype = {
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
		}
	}
	
	function ContainerThingy(children){
		this.children = [].concat(children);
		Thingy.apply(this,arguments);
	}
	ContainerThingy.prototype = new Thingy();
	ContainerThingy.prototype.getChildren = function(){
		return this.children;
	}
	
	function ContentThingy(){
		Thingy.apply(this,arguments);
	}
	ContentThingy.prototype = new Thingy();
	
	function ElementThingy(name, children){
		this.name = name;
		ContainerThingy.apply(this,[children]);
	}
	ElementThingy.prototype = new ContainerThingy();
	
	function AttributeThingy(name){
		this.name = name;
		ContentThingy.apply(this,[]);
	}
	AttributeThingy.prototype = new ContentThingy();
	
	function TextThingy(){
		ContentThingy.apply(this,[]);
	}
	TextThingy.prototype = new ContentThingy();
	
	function ThingyRule(children){
		this.children = [].concat(children);
	}
	ThingyRule.prototype = {
		createControl:function(ths){ /** Creates the control, populated with the Thingys specified. */
			throw new UnsupportedOperationError("No editing control has been implemented for " + typeof(this));
		},
		greedyConsume:function(ths){ /** 	@return if the rule has been satisfied the number of matched thingies 
											 		if the rule cannot be satisfied, should throw error */
			throw new UnsupportedOperationError("No production rule has been implemented for " + typeof(this));
		},
		getChildren:function(){
			return this.children;
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
		return getGlobal()[this.typename]; //TODO should ask on forums about accessing global property without 'window'
	}
	TypedThingyRule.prototype.greedyConsume = function(ths){
		if(ths.length > 0){
			var candidate = ths[0];
			if(candidate instanceof this.getType()){
				return 1;
			}
			else{
				throw new ThingyRuleError("Thingy is not of the correct type : " + this.getTypeName());
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
	NamedThingyRule.prototype.greedyConsume = function(ths){
		var consumed = TypedThingyRule.prototype.greedyConsume.apply(this,[ths]);
		if(consumed == 1){
			if(ths[0].name == this.name){
				return consumed;
			}
			else{
				throw new ThingyRuleError("Thingy of correct type : " + this.getTypeName() + " has incorrect name : " + candidate.name);
			}						
		}
		else{
			return consumed;
		}
	}
	
	function ElementThingyRule(name, children){
		NamedThingyRule.apply(this,[name, "ElementThingy", children]);
	}
	ElementThingyRule.prototype = new NamedThingyRule();
	ElementThingyRule.prototype.greedyConsume = function(ths){
		var consumed = NamedThingyRule.prototype.greedyConsume.apply(this, [ths]);
		if(consumed == 1){
			var childrules = this.getChildren();
			
		}
		else{
			return consumed;
		}
	};
	
	function AttributeThingyRule(name){
		NamedThingyRule.apply(this,[name, "AttributeThingy", []]); //Attribute rules have no children - empty child array
	}
	AttributeThingyRule.prototype = new NamedThingyRule();
	
	function TextThingyRule(){
		TypedThingyRule.apply(this,['TextThingy',[]]); //Text rules have no children - empty child array
	}
	TextThingyRule.prototype = new TypedThingyRule();

	/** Constructs using eval to export items from local scope as similarly named properties of the YOURX object. */
	return (function(names){
		var pairs = [];
		names.forEach(function(item){pairs.push("\"" + item + "\":" + item)});
		var code = "({" + pairs.join(",") + "})"; 
		return eval(code);
		//return {ThingyUtil:ThingyUtil};
	})([	
		"ThingyUtil",
		"Thingy","ElementThingy","AttributeThingy","TextThingy",
		"ThingyRule","ElementThingyRule","AttributeThingyRule","TextThingyRule","OptionalThingyRule","ZeroOrMoreThingyRule","OneOrMoreThingyRule"
	]);
		
}();
