var Advisor = require("./advisor.js") ;

module.exports = Pointcut ;


function Pointcut(aop) {
    this.aop = aop ;
    this._joints = [] ;
}

Pointcut.prototype.add = function(joint){
    this._joints.push(joint) ;
    return this ;
}

Pointcut.prototype.eachCutableJoints = function(type,func){
    for(var i=0;i<this._joints.length;i++) {
	if( this._joints[i].cutable(type) ){
	    func.call(this,this._joints[i]) ;
	}
    }
}

Pointcut.prototype.makeAdvisor = function makeAdvisor(type,advice) {
    var joints = [] ;
    this.eachCutableJoints(type,function(joint){
	joints.push(joint) ;
    }) ;
    if(joints.length){
	this.aop.createAdvisor(joints,type,advice) ;
    }
}

Pointcut.prototype.before = function before(advice){
    this.makeAdvisor(arguments.callee.name,advice) ;
    return this ;
}
Pointcut.prototype.after = function after(advice){
    this.makeAdvisor(arguments.callee.name,advice) ;
    return this ;
}
Pointcut.prototype.around = function around(advice){
    this.makeAdvisor(arguments.callee.name,advice) ;
    return this ;
}
Pointcut.prototype.setter = function setter(advice){
    this.makeAdvisor(arguments.callee.name,advice) ;
    return this ;
}
Pointcut.prototype.getter = function getter(advice){
    this.makeAdvisor(arguments.callee.name,advice) ;
    return this ;
}




module.exports.Pointcut = Pointcut ;
