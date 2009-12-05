/** Stores superclass relationships in the Function definition, and provides
 *  an implementation of init() which recurses through superconstructors.
 * This function can be used on its own, and the prototype manipulated directly.
 * Otherwise use Function#extend( superconstructor, dictionary) to create a subclass
 * and merge in new properties to its prototype.
 */
Function.prototype.subclass = function(superconstructor){
	
	//record superconstructor function
	this.superconstructor = superconstructor;
	
	//create a new prototype based on superconstructor's by creating a temporary zero arg constructor
	var ProtoConstructor = function(){};
	ProtoConstructor.prototype = superconstructor.prototype;
	this.prototype = new ProtoConstructor();
	
	//set up superconstructor reference for instances to use dynamically
	this.prototype.initimpl = this;

	//configure init function which recurses through constructor chain
	this.prototype.init = function(){
		var oldimpl = this.initimpl;
		this.initimpl = this.initimpl.superconstructor;
		this.initimpl.apply(this, arguments);
		this.initimpl = oldimpl;
	};
	
	//return the constructor function itself to permit chaining
	return this;
	
};

/** This should be able to be invoked as follows...
 * OldClass = Object.extend({oldfunc:function(){//do something});
 * NewClass = function(){ //constructor code here}.extend(OldClass,{newprop:5,newfunc=function(){//do something}}); 
Function.prototype.extend = function(superconstructor, dictionary){
	var subconstructor = this.subclass(superconstructor); //creates new prototype and subclass relationship
	var key;
	for(key in dictionary){ //merges new dictionary over prototype
		this.prototype[key] = dictionary[key];
	}
}