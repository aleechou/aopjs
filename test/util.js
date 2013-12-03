var fs = require("fs") ;
var should = require("should") ;
var path = require("path") ;
var AOP = require("../lib/aop.js") ;
var aoputil = require("../lib/util.js") ;
var uglify = require("uglify-js2") ;

suite('util', function(){

    function parseSource(filename){
	var src = fs.readFileSync(filename).toString() ;
	var toplevel = uglify.parse(src,{
	    filename: filename
	}) ;
	toplevel.figure_out_scope() ;
	aoputil.parse4aop(toplevel) ;
	return toplevel ;
    }
    function defByName(scope,name){
	return scope.find_variable(name).orig[0].init[0] ;
    }

    test('# util.localScopeByPos()', function(done){


	var aop = AOP.createCallableInstance() ;
	var filename = __dirname+"/data/simple.js" ;
	var toplevel = parseSource(filename) ;


	var astnode_e, astnode_b, astnode_c, astnode_d ;
	var walker = new uglify.TreeWalker(function(node, descend){

	    aoputil.walk4aop(toplevel,node) ;

	    if(node instanceof uglify.AST_String){
		if(node.value == "hello")
		    astnode_e = node ;
		if(node.value == "bbbbbb")
		    astnode_b = node ;
	    }

	    if(node instanceof uglify.AST_Number){
		if(node.value == 534)
		    astnode_c = node ;
		if(node.value == 432)
		    astnode_d = node ;
	    }
	}) ;
	toplevel.walk(walker) ;

	var defun_bar = defByName(toplevel,"bar") ;
	var defun_foo = defByName(defun_bar,"foo") ;
	var defun_baz = defByName(defun_foo,"baz") ;

	should.strictEqual( toplevel.localScopeByPos(astnode_e), toplevel ) ;
	should.strictEqual( toplevel.localScopeByPos(astnode_b), defun_bar ) ;
	should.strictEqual( toplevel.localScopeByPos(astnode_c), defun_foo ) ;
	should.strictEqual( toplevel.localScopeByPos(astnode_d), defun_baz ) ;
	should.strictEqual( defun_bar.localScopeByPos(astnode_b), defun_bar ) ;
	should.strictEqual( defun_bar.localScopeByPos(astnode_c), defun_foo ) ;
	should.strictEqual( defun_foo.localScopeByPos(astnode_c), defun_foo ) ;



	done() ;
    }) ;

}) ;
