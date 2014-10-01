/** Unit tests for a case study based on a simplistic 'GPS' routing behaviour.
 */

$(function() {
    var UNITTEST = {}; //create locally scoped namespace object for temporary unittest properties
    executeTests([
        ["Load Initial Grammar from RNG",function(){
            //steps
            UNITTEST.grammar = YOURX.ThingyUtil.url2rule("../cases/journey/journey.001.rng");
            return (UNITTEST.grammar) instanceof YOURX.ThingyGrammar;
        }],
        ["load data from (valid) journey.001.xml to in-memory model", function(){
            UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../cases/journey/journey.001.xml");
            return ( (UNITTEST.thingy) instanceof YOURX.RootThingy) ;
            //TODO add checks for document structure like in yourx.unit.js?
        }],
        ["journey.001.xml accepted by validation",function(){
            return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === true;
        }],
        /*
        ["load data from (invalid) journey.001a.xml to in-memory model", function(){
            UNITTEST.thingy = YOURX.ThingyUtil.url2thingy("../cases/journey/journey.001a.xml");
            return ( (UNITTEST.thingy) instanceof YOURX.RootThingy) ;
            //TODO add checks for document structure like in yourx.unit.js?
        }],
        ["journey.001a.xml rejected by validation",function(){
            return UNITTEST.grammar.matchThingy(UNITTEST.thingy) === false;
        }],
        ["Message",function(){
            //steps
            ;
        }],
        ["Message",function(){
            //steps
            ;
        }],
        */
    ]);
});
