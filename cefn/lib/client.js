/** 
 * This library provides 'client-side' operations for Xinflux, which handle data entry and display,
 * and require only ordinary browser permissions. These are complemented by 'server-side' operations 
 * which typically require more substantial permissions if they are to execute certain filesystem or transformation
 * operations.
 * 
 * Possible names - Xmincer, Xinflux, AllYourX (in one basket, are belong to us).
 */

/* Ideal invocation of subclassing
Array.extend({
	something:5,
	else:function(){
		this.superclass.prototype.else();
	}
});
*/

//Define ThingyList as an analog to XPath node lists
subclass(Array, "ThingyList");

//Define Thingy concept - a store for user-authored data
subclass(Object, "Thingy");
addfunc(Thingy, "asE4X", [], [XML], function(){
});
addfunc(Thingy, "asDOM", [], [Document], function(){
});
addfunc(Thingy, "asXML", [], [String], function(){
});
addfunc(Thingy, "filterXpath", [Xpath], [ThingyList], function(){
});


//The Actual Thingies rich enough to represent XML

//Container - something with children - no data
subclass(Thingy, "ContainerThingy");

//Content - something with no children - just data
subclass(Thingy, "ContentThingy");

//Concrete content items
subclass(ContentThingy, "AttributeThingy");

subclass(ContentThingy, "TextThingy");

//Schema component for a Thingy Tree 
subclass(Thingy, "ThingyRule");
