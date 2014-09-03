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
        ["Message",function(){
            //steps
            ;
        }],
        ["Message",function(){
            //steps
            ;
        }],
        ["Message",function(){
            //steps
            ;
        }],
        ["Message",function(){
            //steps
            ;
        }],
    ]);
});
