var fs = require("fs") ;
var uglify = require("uglify-js2") ;
var Module = require("module") ;
var path = require("path") ;
var PathPattern = require("./path-pattern.js") ;
var joints = require("./joinpoints.js") ;
var aoputil = require("./util.js") ;


// global
if( typeof __$aopjs__aops__=="undefined" )
    __$aopjs__aops__ = [] ;

function AOP (){
    this._advisorsByPath = {} ;
    this._advisorsByPathPattern = {} ;
    this._advisors = [] ;

    this.id = __$aopjs__aops__.length ;
    __$aopjs__aops__.push(this) ;
}

AOP.createCallableInstance = function(){
    var ins = function(path){
	var from = PathPattern.fromByStack(2) ;
	var toplevel = new joints.FunctionDefine(joints.FunctionDefine.toplevel,ins) ;
	toplevel.pathPatterns = PathPattern.createArray(path,from) ;
	return toplevel ;
    } ;

    ins.__proto__ = AOP.prototype ;
    AOP.apply(ins) ;// call constructor
    return ins ;
}




AOP.prototype.setup = function(Module) {
    var oriModuleCompile = Module.prototype._compile ;
    var that = this ;
    Module.prototype._compile = function(source,filename) {
	source = that.compile(source,filename) ;
	return oriModuleCompile.apply(this,[source,filename]) ;
    }
    return this ;
}


AOP.prototype._advisorKey = function (advisor) {
    if(advisor.__key===undefined)
	advisor.__key = (this.__nodeId ++).toString() ;
    return advisor.__key ;
}

AOP.prototype.compile = function(source,filename){

    var that = this ;

    // find out advisors who match the filename
    var advisors = {} ;
    if(this._advisorsByPath[filename]){
	var advs = this._advisorsByPath[filename] ;
	for(var i=0;i<advs.length;i++){
	    advisors[ advs[i].id ] = advs[i] ;
	}
    }
    for( var pattern in this._advisorsByPathPattern){
	var advs = this._advisorsByPathPattern[pattern] ;
	if(advs.pattern.match(filename)){
	    for(var i=0;i<advs.length;i++){
		advisors[ advs[i].id ] = advs[i] ;
	    }
	}
    }

    // parse source to ast
    toplevel = uglify.parse(source,{
	filename: filename
    }) ;
    toplevel.figure_out_scope();
    aoputil.parse4aop(toplevel) ;

    // match ast node to advistors
    toplevel = toplevel.transform(new uglify.TreeTransformer(
	function(node,descend){
	    aoputil.walk4aop(toplevel,node) ;
	}
	, function(node,descend){
	    if (
		node instanceof uglify.AST_Defun
		    || node instanceof uglify.AST_Function
		    || node instanceof uglify.AST_VarDef
	    ) {

		// find out match advisor
		var cuttingAdvisors = [] ;
		for(var id in advisors){
		    var joints = advisors[id].joints ;
		    for(var i=0;i<joints.length;i++){
			if( joints[i].match(node,toplevel) ){
			    cuttingAdvisors.push(id) ;
			    break ; // <-- for one advisor and one joint in source(node),  cut one time
			}
		    }
		}

		if(cuttingAdvisors.length){

		    var compiledBody = "function warpper(){ return __$aopjs__aops__[" +that.id+ "].defunAdaptor(this,arguments,[" +cuttingAdvisors.toString()+ "],function origin(){}) ; }" ;

		    var funcTree = uglify.parse(compiledBody) ;
		    funcTree.figure_out_scope();
		    var warpperFunc = funcTree.functions.get("warpper").orig[0].init[0] ;
		    var originPlaceFunc = warpperFunc.functions.get("origin").orig[0].init[0] ;

		    originPlaceFunc.argnames = node.argnames ;
		    originPlaceFunc.body = node.body ;
		    node.body = warpperFunc.body ;

		    return node ;
		}
	    }
	}
    )) ;

    return toplevel.print_to_string({ beautify: true }) ;
}


AOP.prototype.createAdvisor = function(joints,type,advice){
    var advisor = new Advisor(this._advisors.length,joints,type,advice) ;
    for(var i=0;i<joints.length;i++){
	for(var m=0;m<joints[i].pathPatterns.length;m++){
	    var pathmatch = joints[i].pathPatterns[m] ;
	    var key = pathmatch.key()
	    if( pathmatch.pattern ){
		var mapping = this._advisorsByPathPattern ;
		if( !mapping[key] ){
		    mapping[key] = [] ;
		    mapping[key].pattern = pathmatch
		}
	    }
	    else {
		var mapping = this._advisorsByPath ;
		if( !mapping[key] ){
		    mapping[key] = [] ;
		}
	    }
	    mapping[key].push(advisor) ;
	}
    }
    this._advisors.push(advisor) ;
    return advisor ;
}

AOP.prototype.defunAdaptor = function(target,args,advisorIds,origin){
    var afters = [], arounds = [] ;
    for(var i=0;i<advisorIds.length;i++){
	var advisor = this._advisors[advisorIds[i]] ;
	if( advisor.type=='before' ){
	    advisor.advice.apply(target,args) ;
	}
	else if( advisor.type=='around' ){
	    arounds.unshift(advisor.advice) ;
	}
	else if( advisor.type=='after' ){
	    afters.push(advisor.advice) ;
	}
    }

    // around
    arounds.push(origin) ;
    function buildadvice(advice){
	var next = arounds.shift() ;
	if(next) {
	    advice.origin = function(){
		return buildadvice(next).apply(target,arguments) ;
	    }
	}
	return advice ;
    }
    var returnValue = buildadvice(arounds.shift()).apply(target,args) ;

    // after
    for(var i=0;i<afters.length;i++){
	afters[i].apply(target,args) ;
    }

    return returnValue ;
}



function Advisor(id,joints,type,advice){
    this.type = type ;
    this.joints = joints ;
    this.id = id ;
    this.advice = advice ;
}



module.exports = AOP ;
