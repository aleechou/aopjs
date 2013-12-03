var Pointcut = require("./pointcut.js") ;
var PathPattern = require("./path-pattern.js") ;
var uglify = require("uglify-js2") ;

function JointBase(namePattern,aop,scopeFuncDef){
    this.namePattern = namePattern ;
    this.scopeFuncDef = scopeFuncDef || null ;
    this.aop = aop ;
    this.pathPatterns = [] ;
}

JointBase.prototype = {
    asPointcut: function(){
	return (new Pointcut(this.aop)).add(this) ;
    }
    , addTo: function(pointcut){
	point.add(this) ;
	return this ;
    }
    , before: function(advice){
	return this.asPointcut().before(advice) ;
    }
    , after: function(advice){
	return this.asPointcut().after(advice) ;
    }
    , around: function(advice){
	return this.asPointcut().around(advice) ;
    }
    , setter: function(advice){
	return this.asPointcut().setter(advice) ;
    }
    , getter: function(advice){
	return this.asPointcut().getter(advice) ;
    }

    // abstract
    , matchType: function(astnode) {
	return astnode instanceof uglify.AST_Node ;
    }
    // abstract
    , defName: function(astnode,toplevel){
	return (astnode.name && astnode.name.name) || "" ;
    }

    , defScope: function(astnode,toplevel){
	return astnode.name.scope ;
    }

    , match: function(astnode,toplevel) {

	// by type:
	if( !this.matchType(astnode) )
	    return false ;

	// by name:
	if( !this.defName(astnode,toplevel).match(this.namePattern) )
	    return false ;

	// by scope:
	var defScope = this.defScope(astnode,toplevel) ;
	// 递归到上级函数检查
	if( this.scopeFuncDef && this.scopeFuncDef.namePattern!=JointFunctionDefine.toplevel ){
	    if( !defScope || !this.scopeFuncDef.match(defScope) )
		return false ;
	}
	else
	{
	    // 不能在某个函数中
	    if(defScope instanceof uglify.AST_Defun || defScope instanceof uglify.AST_Function)
		return false ;
	}
	
	return true ;
    }
}


//  Function ---------------------
function JointFunctionDefine(namePattern,aop,scopeFuncDef) {
    JointBase.apply(this,arguments) ;
}
JointFunctionDefine.toplevel = '#toplevel(not a function)#' ;
JointFunctionDefine.prototype = new JointBase() ;
JointFunctionDefine.prototype.matchType = function(astnode) {
    return astnode instanceof uglify.AST_Defun || astnode instanceof uglify.AST_Function ;
}
JointFunctionDefine.prototype.defScope = function(astnode){
    return astnode.parent_scope ;
}
JointFunctionDefine.prototype.defun = function(namePattern){
    var joint =  new JointFunctionDefine(namePattern,this.aop,this) ;
    joint.pathPatterns = this.pathPatterns ;
    return joint ;
}
JointFunctionDefine.prototype.var = function(namePattern){
    var joint =  new JointVariable(namePattern,this.aop,this) ;
    joint.pathPatterns = this.pathPatterns ;
    return joint ;
}
JointFunctionDefine.prototype.const = function(namePattern){
    var joint =  new JointConst(namePattern,this.aop,this) ;
    joint.pathPatterns = this.pathPatterns ;
    return joint ;
}

JointFunctionDefine.prototype.cutable = function(type){
    return type=='before' || type=='after' || type=='around' ;
}


// Variable ---------------------
function JointVariable(namePattern,aop,scopeFuncDef){
    JointBase.apply(this,arguments) ;
}
JointVariable.prototype = new JointBase() ;
JointVariable.prototype.cutable = function(type){
    return type=='setter' || type=='getter' ;
}
JointVariable.prototype.matchType = function(astnode) {
    return astnode instanceof uglify.AST_VarDef ;
}



// Const ---------------------
function JointConst(namePattern,aop,scopeFuncDef){
    JointBase.apply(this,arguments) ;
}
JointConst.prototype = new JointBase() ;
JointConst.prototype.cutable = function(type){
    return type=='getter' ;
}
JointConst.prototype.matchType = function(astnode) {
    return astnode instanceof uglify.AST_Constant ;
}
JointConst.prototype.defName = function(astnode){
    return astnode.value || "" ;
}
JointConst.prototype.defScope = function(astnode,toplevel){
    return toplevel.localScopeByPos(astnode,toplevel) ;
}


exports.FunctionDefine = JointFunctionDefine ;
exports.Variable = JointVariable ;
exports.Const = JointConst ;
