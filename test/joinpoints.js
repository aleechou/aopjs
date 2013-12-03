var fs = require("fs") ;
var should = require("should") ;
var joinpoints = require("../lib/joinpoints.js") ;
var path = require("path") ;
var AOP = require("../lib/aop.js") ;
var uglify = require("uglify-js2") ;
var aoputil = require("../lib/util.js") ;

suite('joinpoints', function(){

    function parseSource(filename){
	var src = fs.readFileSync(filename).toString() ;
	var toplevel = uglify.parse(src,{
	    filename: filename
	}) ;
	toplevel.figure_out_scope() ;
	return toplevel ;
    }
    function defByName(scope,name){
	return scope.find_variable(name).orig[0].init[0] ;
    }

    test("# JointFunctionDefine.match()", function(done){
	var aop = AOP.createCallableInstance() ;
	var filename = __dirname+"/data/simple.js" ;
	var toplevel = parseSource(filename) ;

	// defun --------
	var defunBar = defByName(toplevel,"bar") ;
	var defunQux = defByName(toplevel,"qux") ;
	var defunFoo = defByName(defunBar,"foo") ;
	var defunBaz = defByName(defunFoo,"baz") ;

	aop(filename).defun("bar").match(defunBar).should.be.true ;
	aop(filename).defun("bar").match(defunQux).should.be.false ;

	aop(filename).defun("bar").defun("foo").match(defunFoo).should.be.true ;
	aop(filename).defun("bar").defun("foo").defun("baz").match(defunBaz).should.be.true ;
	aop(filename).defun("baz").match(defunBaz).should.be.false ;
	aop(filename).defun("foo").defun("baz").match(defunBaz).should.be.false ;

	// function ------

	done() ;
    }) ;

    test("# JointVariable.match()", function(done){
	var aop = AOP.createCallableInstance() ;
	var filename = __dirname+"/data/simple.js" ;
	var toplevel = parseSource(filename) ;

	var defunBar = defByName(toplevel,"bar") ;
	var defunQux = defByName(toplevel,"qux") ;
	var defunFoo = defByName(defunBar,"foo") ;
	var defunBaz = defByName(defunFoo,"baz") ;

	var var_a = defByName(toplevel,"a") ;
	var var_b = defByName(defunBar,"b") ;
	var var_c = defByName(defunFoo,"c") ;
	var var_d = defByName(defunBaz,"d") ;

	var joint_a = aop(filename).var("a") ;
	var joint_b = aop(filename).defun("bar").var("b") ;
	var joint_c = aop(filename).defun("bar").defun("foo").var("c") ;
	var joint_d = aop(filename).defun("bar").defun("foo").defun("baz").var("d") ;

	joint_a.match(var_a).should.be.true ;
	joint_b.match(var_b).should.be.true ;
	joint_c.match(var_c).should.be.true ;
	joint_d.match(var_d).should.be.true ;

	aop(filename).defun("bar").var("a").match(joint_a).should.be.false ;
	aop(filename).defun("bar").defun("foo").var("a").match(joint_a).should.be.false ;
	aop(filename).var("b").match(joint_a).should.be.false ;
	aop(filename).var("c").match(joint_a).should.be.false ;
	aop(filename).var("d").match(joint_a).should.be.false ;

	// multi var def

	done() ;
    }) ;


    test("# JointConst.match()", function(done){

	var aop = AOP.createCallableInstance() ;
	var filename = __dirname+"/data/simple.js" ;
	var toplevel = parseSource(filename) ;
	aoputil.parse4aop(toplevel) ;

	var astnode_e ;
	var walker = new uglify.TreeWalker(function(node, descend){

	    aoputil.walk4aop(toplevel,node) ;

	    if(node instanceof uglify.AST_String){
		if(node.value == "hello")
		    astnode_e = node ;
	    }
	    
//	    if(node instanceof uglify.AST_VarDef)
//		debugger ;
	}) ;
	toplevel.walk(walker) ;

	var joint_e = aop(filename).const("hello") ;

	joint_e.match(astnode_e,toplevel).should.be.true ;
	// ... ...


	done() ;
    }) ;

});

