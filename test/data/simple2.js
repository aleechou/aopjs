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

exports.ten = 10 ;

