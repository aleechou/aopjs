var should = require("should") ;
var AOP = require("../lib/AOP.js") ;
var fs = require("fs") ;
var joints = require("../lib/joinpoints.js") ;
var uglify = require("uglify-js2") ;
var Module = require("module") ;


suite('AOP', function(){

    test("# AOP.createCallableInstance", function(done){
	var aop = AOP.createCallableInstance() ;
	var joint = aop("./data/*.js") ;
	
	done() ;
    }) ;

    test('# AOP.compile.fundef', function(done){

	var aop = AOP.createCallableInstance() ;
	var src = function foo(a,b){
	    function bar(c,d){
		return c+d ;
	    }
	    return bar(a,b) ;
	}.toString() ;

	aop("./data/*.js")
	    .defun("foo").defun("bar")
	    .around(function(a,b){
		return a-b ;
	    })
	    .before(function(a,b){
		console.log(a,b) ;
	    }) ;
	var compiled = aop.compile(src,__dirname+"/data/simple.js") ;

	var comparison = uglify.parse(
	    function foo(a,b){
		function bar(c,d){
		    return __$aopjs__aops__[1].replacer(this,arguments,[0,1],function origin(c, d) {
			return c+d ;
		    }) ;
		}
		return bar(a,b) ;
	    }.toString() 
	).print_to_string({beautify:true}) ;

	compiled.should.be.eql(comparison) ;

	done() ;
    });


    test('# AOP.createAdvisor', function(done){

	var aop = AOP.createCallableInstance() ;
	var mockupJoints = [
	    aop("./data/foo.js")
	    , aop([
		__dirname+"/data/*.js"
		, __dirname+"/test/bar.js"
	    ])
	    , aop(__dirname+"/data/foo.js")
	] ;

	var advisor = aop.createAdvisor(mockupJoints,"before",function(){}) ;
	Object.keys(aop._advisorsByPath).should.be.eql([
	    __dirname+"/data/foo.js"
	    , __dirname+"/test/bar.js"
	]) ;

	done() ;
    }) ;


    test('# AOP.for.function', function(done){
	var aop = require("../") ;

	var idx = 0 ;

	aop("./data/*.js")
	    .defun("fun_foo").defun("fun_bar")
	    .around(function(a,b){
		(++idx).should.be.eql(6) ;
		return a-b + this.ten ;
	    })
	    .after(function(a,b){
		(++idx).should.be.eql(7) ;
	    })
	    .before(function(a,b){
		(++idx).should.be.eql(2) ;
	    })
	    .after(function(a,b){
		(++idx).should.be.eql(8) ;
	    })
	    .before(function(a,b){
		(++idx).should.be.eql(3) ;
	    })
	    .around(function(){
		(++idx).should.be.eql(5) ;
		return arguments.callee.origin(5,3) ;
	    }) ;

	aop("./data/simple2.js")
	    .defun("fun_foo")
	    .before(function(){
		(++idx).should.be.eql(1) ;
	    })
	    .after(function(){
		(++idx).should.be.eql(10) ;
	    }) ;


	aop("./data/simple2.*")
	    .defun("fun_foo").defun("fun_bar")
	    .before(function(){
		(++idx).should.be.eql(4) ;
	    })
	    .after(function(){
		(++idx).should.be.eql(9) ;
	    }) ;

	// anonymous
	aop("./data/simple2.js").defun("fun_quux").defun("#0")
	    .around(function(a){
		return arguments.callee.origin( a*10 ) ;
	    }) ;
	aop("./data/simple2.js").defun("fun_quux").defun("#1")
	    .around(function(a){
		return arguments.callee.origin( a+5 ) ;
	    }) ;
	aop("./data/simple2.js").defun("#0")
	    .around(function(){
		return 31 ;
	    }) ;

	delete require.cache[__dirname+"/data/simple2.js"] ;
	var simple2 = require("./data/simple2.js") ;

	simple2.fun_foo(3,5).should.be.eql(12) ;
	simple2.fun_quux(5).should.be.eql(515) ;
	simple2.thenumber.should.be.eql(31) ;

	done() ;
    }) ;


    test('# AOP.for.const', function(done){
	var aop = require("../") ;

	// string
	aop("./data/simple2.js").const("hello")
	    .asPointcut()
	    .add( aop("./data/simple2.js").defun("fun_qux").const("hello") )
	    .getter(function(origin){
		return "Hello" ;
	    }) ;

	// int
	aop("./data/simple2.js").const(123)
	    .getter(function(origin){
		return origin + 321 ;
	    }) ;

	// float
	aop("./data/simple2.js").const(123.123)
	    .getter(function(origin){
		return origin + 321.321 ;
	    }) ;

	// bool

	// regexp
	aop("./data/simple2.js").regexp(/^\d+$/)
	    .getter(function(origin){
		return /^[a-z]+$/i ;
	    }) ;

	delete require.cache[__dirname+"/data/simple2.js"] ;
	var simple2 = require("./data/simple2.js") ;

	simple2.fun_qux().should.be.eql("HelloHello") ;
	simple2.var_a.should.be.eql(444) ;
	simple2.var_b.should.be.eql(444.444) ;
	simple2.var_c.should.be.eql(/^[a-z]+$/i) ;

	done() ;
    }) ;
});
