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

Pointcut.prototype.makeAdvisor = function makeAdvisor(type,lambdas,advice) {
    var joints = [] ;
    this.eachCutableJoints(type,function(joint){
	joints.push(joint) ;
    }) ;
    if(joints.length){
	this.aop.createAdvisor(joints,type,lambdas,advice) ;
    }
}

/**
 * before([lambdas,]advice) ;
 */
Pointcut.prototype.before = function before(lambdas,advice){
    this.makeAdvisor(arguments.callee.name,lambdas,advice) ;
    return this ;
}
/**
 * after([lambdas,]advice) ;
 */
Pointcut.prototype.after = function after(lambdas,advice){
    this.makeAdvisor(arguments.callee.name,lambdas,advice) ;
    return this ;
}
/**
 * around([lambdas,]advice) ;
 */
Pointcut.prototype.around = function around(lambdas,advice){
    this.makeAdvisor(arguments.callee.name,lambdas,advice) ;
    return this ;
}
/**
 * setter([lambdas,]advice) ;
 */
Pointcut.prototype.setter = function setter(lambdas,advice){
    this.makeAdvisor(arguments.callee.name,lambdas,advice) ;
    return this ;
}
/**
 * getter([lambdas,]advice) ;
 */
Pointcut.prototype.getter = function getter(lambdas,advice){
    this.makeAdvisor(arguments.callee.name,lambdas,advice) ;
    return this ;
}




module.exports.Pointcut = Pointcut ;
