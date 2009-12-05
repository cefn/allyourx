function getThingyRule(){
	return new ElementThingyRule("data",[
			new ZeroOrMoreThingyRule([
				new ElementThingyRule("item",[
						new AttributeThingyRule("title"),
						new AttributeThingyRule("description")						
				])					
			])
	]);
}

function getThingy(){
	return new ElementThingy("data",[
		new ElementThingy("item",[
			new AttributeThingy("title", "This is my title"),
			new AttributeThingy("description", "A longer piece of text")
		]),
		new ElementThingy("item",[
			new AttributeThingy("title", "A second title"),
			new AttributeThingy("description", "Not so long")
		])
	]);	
}

