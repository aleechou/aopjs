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
		    || node instanceof uglify.AST_Constant
	    ) {

		// find out match advisor
		var cuttingAdvisors = [] ;
		for(var id in advisors){
		    var jointlst = advisors[id].joints ;
		    for(var i=0;i<jointlst.length;i++){
	

	
			if( jointlst[i].match(node,toplevel) ){
			    cuttingAdvisors.push(id) ;
			    break ; // <-- for one advisor and one joint in source(node),  cut one time
			}
		    }
		}

		var replacer = "__$aopjs__aops__[" +that.id+ "].replacer" ;

		if(cuttingAdvisors.length){

		    // for function definition ----------------------
		    if ( node instanceof uglify.AST_Defun || node instanceof uglify.AST_Function ) {

			var funcTree = sourceToAst("function warpper(){ return "+replacer+"(this,arguments,[" +cuttingAdvisors.toString()+ "],function origin(){}) ; }") ;
			var warpperFunc = funcTree.functions.get("warpper").orig[0].init[0] 

			var originPlaceFunc = warpperFunc.functions.get("origin").orig[0].init[0] ;

			originPlaceFunc.argnames = node.argnames ;
			originPlaceFunc.body = node.body ;
			node.body = warpperFunc.body ;

			return node ;
		    }
		   		    
		    // for const  ----------------------
		    else if(node instanceof uglify.AST_Constant){
			var ast = sourceToAst(replacer+"(this,null,[" +cuttingAdvisors.toString()+ "],origin)") ;
			ast.body[0].body.args[3] = node ;

			return ast ;
		    }

		}
	    }
	}
    )) ;

    return toplevel.print_to_string({ beautify: true }) ;
}

function sourceToAst(source){    
    var funcTree = uglify.parse(source) ;
    funcTree.figure_out_scope();
    return funcTree ;
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

AOP.prototype.replacer = function(target,args,advisorIds,origin){
    var advicepool = {
	after: []
	, around: []
	, getter: []
    }
    var afters = [], arounds = [], getters = [] ;
    for(var i=0;i<advisorIds.length;i++){
	var advisor = this._advisors[advisorIds[i]] ;
	if( advisor.type=='before' ) {
	    advisor.advice.apply(target,args) ;
	}
	else {
	    advicepool[advisor.type].push(advisor.advice) ;
	}
    }

    // around
    if( typeof origin == "function" ){
	advicepool.around.unshift(origin) ;
	function buildadvice(advice){
	    var next = advicepool.around.pop() ;
	    if(next) {
		advice.origin = function(){
		    return buildadvice(next).apply(target,arguments) ;
		}
	    }
	    return advice ;
	}
	var returnValue = buildadvice(advicepool.around.pop()).apply(target,args) ;
    }

    // getter
    for(var i=0;i<advicepool.getter.length;i++){
	var returnValue = advicepool.getter[i].call(target,origin) ;
    }

    // after
    for(var i=0;i<advicepool.after.length;i++){
	advicepool.after[i].apply(target,args) ;
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
