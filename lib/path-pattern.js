var pathutil = require("path") ;

function PathPattern(path,from) {

    if(path.match(/^\*+$/)){
	this.pattern = /.*/ ;
	return ;
    }

    if( path[0]!='/' && !path.match(/^[a-zA-Z]:[\\\/]/) ){
	path = pathutil.resolve(from||PathPattern.fromByStack(2),path) ;
    }

    path = pathutil.normalize(path) ;

    // pattern
    if( !!~path.indexOf("*") ){
	this.pattern = new RegExp(
	    "^"+path
		.replace(
		    /[\.\?\+\$\^\[\]\(\)\{\}\|\\\/]/g
		    , '\\$&'
		)
		.replace(/\*{2,}/g,'＊＊')
		.replace(/\*/g,'[^\\/\\\\]*')
		.replace('＊＊','.*')
	    + "$"
	) ;
    }
    else 
	this.path = path ;

}

var stackRegexp = /at .+ \((.+?):(\d+?):\d+\)/g ;
PathPattern.fromByStack = function(row){
    stackRegexp.lastIndex = 0 ;
    var stack = new Error().stack ;
    var res ;
    for( var i=0; i<=row && (res=stackRegexp.exec(stack)); i++ ) {}
    return pathutil.dirname(res[1]) ;
}

PathPattern.createArray = function(path,from){
    var pathPatterns = [] ;
    if(path) {
	if(path.constructor===Array){
	    for(var i=0;i<path.length;i++){
		pathPatterns.push( new PathPattern(path[i],from) ) ;
	    }
	}
	else{
	    pathPatterns.push( new PathPattern(path,from) ) ;
	}
    }
    return pathPatterns ;
}


PathPattern.prototype.key = function(){
    return this.pattern ? this.pattern.toString() : this.path ;
}

PathPattern.prototype.match = function(filename){
    return this.pattern?
	this.pattern.test(filename):
	(this.path==filename)
}

function escapeRegExp(words){
    words.replace(
	    /[\*\.\?\+\$\^\[\]\(\)\{\}\|\\\/]/g
	    , '\\$&'
        )
}

module.exports = PathPattern ;
