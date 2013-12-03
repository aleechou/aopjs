var should = require("should") ;
var PathPattern = require("../lib/path-pattern.js") ;
var path = require("path") ;


suite('PathPattern', function(){

    test("# PathPattern.match", function(done){
	// 相对路径
	var p = new PathPattern("./data/xxx.js") ;
	p.path.should.be.eql(__dirname+"/data/xxx.js") ;

	var p = new PathPattern("../data/xxx.js") ;
	p.path.should.be.eql(path.dirname(__dirname)+"/data/xxx.js") ;

	var p = new PathPattern("./data/xxx.js",'/a/b/c') ;
	p.path.should.be.eql("/a/b/c/data/xxx.js") ;

	var p = new PathPattern("../data/xxx.js",'/a/b/c') ;
	p.path.should.be.eql("/a/b/data/xxx.js") ;
	
	// 绝对路径
	var p = new PathPattern(__dirname+"/data/xxx.js") ;
	p.path.should.be.eql(__dirname+"/data/xxx.js") ;

	var p = new PathPattern(__dirname+"/data/xxx.js",'/a/b/c') ;
	p.path.should.be.eql(__dirname+"/data/xxx.js") ;

	// 通配符
	var p = new PathPattern("./data/*.js") ;
	p.match(__dirname+"/xxx.js").should.be.false ;
	p.match(__dirname+"/data/xxx.js").should.be.true ;
	p.match(__dirname+"/data/aaa/xxx.js").should.be.false ;
	p.match(__dirname+"/data/xxxx.coffee").should.be.false ;

	var p = new PathPattern("../*.js") ;
	p.match(path.dirname(__dirname)+"/test/xxx.js").should.be.false ;
	p.match(path.dirname(__dirname)+"/xxx.js").should.be.true ;
	p.match(path.dirname(__dirname)+"/xxxx.coffee").should.be.false ;

	var p = new PathPattern("../**.js") ;
	p.match(path.dirname(__dirname)+"/test/xxx.js").should.be.true ;
	p.match(path.dirname(__dirname)+"/xxx.js").should.be.true ;
	p.match(path.dirname(__dirname)+"/xxxx.coffee").should.be.false ;
	

	var p = new PathPattern("./data/a*") ;
	p.match(__dirname+"/abbb.js").should.be.false ;
	p.match(__dirname+"/data/a.js").should.be.true ;
	p.match(__dirname+"/data/aaa/a.js").should.be.false ;
	p.match(__dirname+"/data/a.coffee").should.be.true ;

	var p = new PathPattern("./data/a**.js") ;
	p.match(__dirname+"/abbb.js").should.be.false ;
	p.match(__dirname+"/data/a.js").should.be.true ;
	p.match(__dirname+"/data/aaa/a.js").should.be.true ;
	p.match(__dirname+"/data/a.coffee").should.be.false ;


	// 多个 * 通配符
	var p = new PathPattern("./data/*/*.js") ;
	p.match(__dirname+"/xxx.js").should.be.false ;
	p.match(__dirname+"/data/xxx.js").should.be.false ;
	p.match(__dirname+"/data/aaa/xxx.js").should.be.true ;
	p.match(__dirname+"/data/aaa/xxxx.coffee").should.be.false ;

	// 通配符 * 和 **
	var p = new PathPattern("./data/*/aaa/**.js") ;
	p.match(__dirname+"/xxx.js").should.be.false ;
	p.match(__dirname+"/data/xxx.js").should.be.false ;
	p.match(__dirname+"/data/nnn/aaa/xxx.js").should.be.true ;
	p.match(__dirname+"/data/nnn/aaa/xxxx.coffee").should.be.false ;
	p.match(__dirname+"/data/bbb/aaa/xxxx/bbb.js").should.be.true ;

	
	done() ;
    }) ;
});


