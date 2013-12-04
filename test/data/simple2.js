exports.hi = 'hello' ;

exports.fun_foo = function fun_foo(a,b){
    function fun_bar(c,d){
	return fun_baz(c,d) ;
    }
    return fun_bar.call(this,a,b) ;
}

function fun_baz(e,f){
     return e+f ;
}

exports.fun_qux = function fun_qux(){
    return this.hi + "hello" ;
}

exports.ten = 10 ;

exports.var_a = 123 ;
exports.var_b = 123.123 ;
exports.var_c = /^\d+$/ ;


exports.fun_quux = function fun_quux(a){
    a = (function(b){
	return  b * 10 ;
    }) (a) ;

    a = (function(b){
	return  b + 10  ;
    }) (a) ;

    return a ;
}

exports.thenumber = (function(){
    return 14 ;
}) () ;
