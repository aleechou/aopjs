var uglify = require("uglify-js2") ;


exports.parse4aop = function(toplevel) {
    toplevel.__proto__ = createScopeUtilMethodsProto(toplevel.__proto__) ;
}




exports.walk4aop = function(toplevel,astnode) {
    if(astnode instanceof uglify.AST_Defun || astnode instanceof uglify.AST_Function) {
	astnode.__proto__ = createScopeUtilMethodsProto(astnode.__proto__) ;

	// build function scope tree
	if(astnode.parent_scope){
	    if( !astnode.parent_scope.child_scopes ){
		astnode.parent_scope.child_scopes = [] ;
	    }
	    astnode.parent_scope.child_scopes.push(astnode) ;
	}
    }
}

function createScopeUtilMethodsProto(proto) {
    return {
	__proto__: proto

	// not implements
	, localScopeByPos: function(astnode) {
	    if( this.start.pos > astnode.start.pos || this.end.pos < astnode.end.pos )
		return null ;

	    if(this.child_scopes) {	
		for(var i=0;i<this.child_scopes.length;i++){
		    var scope = this.child_scopes[i].localScopeByPos(astnode) ;
		    if(scope)
			return scope ;
		}
	    }
	    return this ;
	}
    }
}
