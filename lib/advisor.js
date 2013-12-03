
function Advisor(type,advice,joints){
    this._jointsByPath = {} ;
    this._jointsByPattern = {} ;
    this.advice = advice ;
    this.type = type ;
}

Advisor.prototype.putin = function(joint){
    for(var i=0;i<joint.pathPatterns.length;i++){
	var pn = joint.pathPatterns[i] ;
	var collection = this[pn.pattern? "": ""] ;
	var pathkey = pn.key() ;
	if( !collection[pathkey] )
	    collection[pathkey] = [] ;
	collection[pathkey].push(joint) ;
    }
}

module.exports = Advisor ;
