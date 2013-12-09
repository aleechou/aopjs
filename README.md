aopjs
=====

[![Dependency Status](https://david-dm.org/aleechou/aopjs.png)](https://david-dm.org/aleechou/aopjs)

为Nodejs设计的AOP实现，也可以用于其他AMD JavaScript 环境。

### 可以用来做什么？

0. 日志或认证/授权等常见AOP用途
> [关于 AOP](http://www.google.com/search?q=aop)

1. 当你想改变所依赖的npm包的功能时，可以使用 aopjs 在代码层面 ___“切换”___ 它们的某些函数,变量,常量，而不必硬修改它们的源代码，从而避免依赖的包在升级后造成的版本冲突。

---

## 安装
```
$ npm i aopjs
```

## 测试
```
$ npm i aopjs -d
$ make test
./node_modules/.bin/mocha \
        --reporter list \
		--timeout 1000 \
		-u tdd \
		test/*.js

  ․ AOP # AOP.createCallableInstance: 5ms
  ․ AOP # AOP.compile.fundef: 20ms
  ․ AOP # AOP.createAdvisor: 2ms
  ․ AOP # AOP.for.function: 42ms
  ․ AOP # AOP.for.const: 37ms
  ․ joinpoints # JointFunctionDefine.match(): 14ms
  ․ joinpoints # JointVariable.match(): 6ms
  ․ joinpoints # JointConst.match(): 4ms
  ․ PathPattern # PathPattern.match: 5ms
  ․ util # util.localScopeByPos(): 6ms

  10 passing (149ms)
```

## 调试

```
$ npm i aopjs -d
$ make debug
```

将打开一个支持断点和inspecte的nodejs内置的cl界面，然后自动执行aopjs所有的测试脚本。

> 如果你对aopjs的某些功能有疑问，`make debug`是个不错的调试方式，Fork this repository, fix it, and send me a request pull :)

## 快速开始

这是一个简单的例子，b.js 文件对 a.js 文件进行aop操作：找到a.js里名为 `foo` 的函数，切入一个 `around` 类型的函数，在 around 函数里替换传递给 foo 的参数

a.js
```javascript
// this is a.js
exports.foo = function foo(who){
    return "hello " + who ;
}
```

b.js
```javascript
// this is b.js
var aop = require("aopjs") ;

aop("./a.js")
    .defun("foo") // <-- 找到了 a.js 文件里的 foo 方法
    
    // 切入一个 around 类型的函数，由 around 函数调用原始函数
    .around(function(who){
        return arguments.callee.origin("you") ;
    }) ;
    
var foo = require("./file-a.js").foo ;
console.log( foo("world") ) ;
```
执行结果会打印：
```
hello you
```

---

## 概念

> AOP = Aspect Oriented Programming （面向切面编程）

0. #### 连接点 Joinpoint ####

    Joinpoint 可以理解为代码中要切入的地方，aopjs 实现了函数定义(before/after/aroud)，常量的访问(getter)，变量的访问(setter/getter)，等类型的连接点，可以通过 defun()、const()、var() 等函数定义连接点。

1. #### 切入点 Pointcut ####

    切入点(Pointcut)实际上是多个连接点(Joinpoint)的集合，需要切入的代码并不是直接对连接点(Joinpoint)进行操作，而是将连接点聚合成一个切入点，对切入点进行切入操作。

2. #### 通知 Advice ####

    通知(Advice)是要切入的代码，aopjs中是一个闭包函数，闭包变量在其定义的上下文，而不是被切入的代码的上下文。aopjs实现的了以下类型的 advice ：before/after/aroud/getter/setter 。


### aopjs的基本操作是：###

0. 首先调用 aop() 函数，aop()的参数为一个或多个路径模板，用来匹配目标文件；

1. 在aop()返回的对象上调用 defun(), const() 等函数定义对应文件内的 joinpoint

2. 在 joinpoint对象上调用 asPointcut() 函数创建一个包含该 joinpoint 的 pointcut对象，然后可以向 pointcut对象添加更多 joinpoint对象；
    > 如果只需要一个 joinpoint，可以直接在 joinpoint 对像上调用 before等 advice 切入函数。

3. 在 pointcut 对象上调用 before() 等函数，切入你的advice函数

---

# API

## 文件路径模板


aopjs用`文件路径模板`来匹配目标文件：

* 绝对路径:
    ```javascript
    var aop = require("aopjs") ;
    aop("/some/file/path") ;
    ```
* 相对路径：
    ```javascript
    aop("./some/file/path") ;
    ```
    或
    ```javascript
    aop("../some/file/path") ;
    ```

* 使用`“*”`做为通配符：
    ```javascript
    // 匹配folder目录下的所有 .js 后缀文件（不包括子目录下的文件!）
    aop("/some/folder/*.js") ;
    ```
* 使用`“**”`做为多级目录通配符：
    ```javascript
    // 匹配folder及其子目录下的所有.js文件
    aop("/some/folder/**.js") ;
    ```
* 使用数组来传递多个文件路径模板：
    ```javascript
    aop(["/some/file/path","/another/file/path"]) ;
    ```


## 连接点 Joinpoint

### 函数 defun(namePattern)

* #### 函数名称 ####

    namePattern 可以是一个字符串或正则表达式

    ```
    // a.js 文件中名为 foo 的函数
    aop("/some/folder/a.js").defun("foo") ;
    ```
    或
     ```
    // folder目录下所有.js文件中，所有名称以 foo(忽略大小写) 开头的函数
    aop("/some/folder/*.js").defun(/^foo/i) ;
    ```
    
    > 只有关键词`function`后的部分被当做函数名称，将函数赋值给变量，变量名不会作为函数名称，例如：` var foo = function (){ ... } `无法用foo找到函数

* #### 函数空间(scope) ####

    函数内部定义的函数需要先定位外层函数，例如：
    
    ```javascript
    function foo(){
        function bar(){
            function baz(){
                function qux(){
                    // ... ...
                }
            }
        }
    }
    ```
    找到最里面的 `qux` 需要像这样：
    ```javascript
    aop("/some/file/path")
        .defun("foo")
        .defun("bar")
        .defun("baz")
        .defun("qux") ;
    ```
    任何类型的 连接点（joinpoint）都需要在`scope`里定位；每个函数都是一个`scope`，aop()返回的是目标文件顶层scope，因此，通常都是从 aop() 开始。
    
    > 也许以后我会写一个类似 jQuery 的 selector 来定位连接点...

* #### 匿名函数 ####
    
    匿名函数也能被找到，用字符串 `#n` 表示匿名函数，n 从 0 开始计数；每个`scope`都是独立计数的。
    
    ```javascript
    // #0 not foo
    var foo = function (){
        // #0
        var bar = (function (){
            return "bar" ;
        }) () ;
        
        // #1
        var baz = (function (){
            return "baz" ;
        }) () ;
    }
    
    // #1 not qux
    var qux = function (){
        // #0 (重新从0开始计数)
        var quux = (function (){
            return "quux" ;
        }) () ;
    }
    ```
    
    定位上面文件中的3个内部匿名函数：
    ```javascript
    var joint_foo = aop("...").defun("#0") ;
    
    // 第1个全局函数里的 第1个匿名函数
    joint_foo.defun("#0") ;
    
    // 第1个全局函数里的 第2个匿名函数
    joint_foo.defun("#1") ;
    
    // 第2个全局函数里的匿名函数
    aop("...").defun("#1").defun("#0") ;
    ```

### 普通常量 const(value[,position])

`const()`用于在函数或顶层scope中定位代码里的常量。

* `value` 可以是：string, int, float 类型的值，或者匹配字符串常量的正则表达式

* `position` 表示匹配 `value`的常量出现的位置，从0计数；缺省表示所有匹配的常量

```javascript
function PI(){
    return 3.14125 ;
}

var foo = "hello" ;
var bar = "hello world" ;
```

```javascript
// 仅仅匹配 "hello"
aop("/some/file/path").const("hello") ;

// 匹配字符串 "hello" 和 "hello world"
aop("/some/file/path").const(/^hello/) ;

// 只匹配字符串 "hello world"
aop("/some/file/path").const(/^hello/,1) ;

// 匹配 PI函数的返回值浮点数
aop("/some/file/path").defun("PI").const(3.14125) ;
```

### RegExp常量 regexp() ###

RegExp常量和普通常量类似，参数是一个和目标RegExp常量一致的正则表达式。

```javascript
aop("/some/file/path").regexp(/^\d+$/).getter(function(origin){
    return /^\w+$/ ;
}) ;
```

## 切入点（Pointcut）

### 创建创建切入点：

* 在Joinpoint对象上调用 asPointcut() 

    ```javascript
    var pointcut = aop("/some/path").defun("foo").asPointcut() ;
    ```

* 在Joinpoint对象上调用 before() 等函数，直接切入advice，并返回自动创建的 pointcut 对象

    ```javascript
    var pointcut = aop("/some/path")
        .defun("foo")
        .before(function(){
            // todo ... ...
        }) ;
    
    // 另一个 advice
    pointcut.around(function(){
        // todo
    }) ;
    ```

### Pointcut.add() 聚合多个 Joinpoint

下面这个例子向多个 controller 类的 process 方法切入了一个advice函数，该advice函数负责在controller执行前记录日志。

```javascript
aop("/some/folder/constrollers/*.js")
    .defun("process")
    .asPointcut() 
    // 聚合更多 joinpoint
    add(
        aop("/some/other/folder/bar/controllers/*.js").defun("process")
        , aop("/some/other/folder/baz/constrollers/*/.js").defun("process")
    )
    .add(
        aop("/some/other/folder/qux/controllers/*.js").defun("process")
    )
    // 切入
    around(function(){
        // 为controller们记录日志
        log("... ...") ;
        
        // 调用controller
        return arguments.callee.origin.apply(this,arguments) ;
    }) ;
```

## Advice

aopjs实现了以下类型的advice函数：

* #### before()

    切入到函数定义的开始位置，参数和被切入的函数一致，不需要返回值；切入多个 before类型的advice时，调用顺序和切入顺序一致。

* #### after()

    切入到函数定义的结束位置，其余行为和 before() 一致

* #### around()
    
    * around 函数“包裹”到目标函数的外部，先调用“外层”的advice函数，由advice函数决定是否调用以及何时调用“内层”的函数；
    * 在同一个目标函数上多次切入 around 函数时，这些 around 函数的调用顺序和切入顺序___相反___，总是从外层向内层调用；后“切入”的“包裹”在最外层，从而最先调用；最内层的是作为目标的原始函数；
    > 整个around 就像一个洋葱一样，每层洋葱皮都是一个切入到目标函数的 around advice
    * 在 around 函数内使用 arguments.callee.origin() 来进一步调用“内层函数”，around  的返回值作为“本层”调用的返回值。

    > 可以用 around 替换目标函数，影响目标函数接收的参数或返回值。

* #### getter(origin)

    * 可对常量或变量类型的 joinpoint 进行 getter 切入，当目标被访问时，调用getter函数，由 getter 函数的返回值决定目标的值
    
    * 对于同一 joinpoint ，只有最后一次 getter 函数有效
    
    * getter() 函数接收到参数 origin 为目标的原始值；getter()函数的返回值，为运行时访问目标常量或变量的值

* #### setter(origin)

    * 和getter类似，为目标变量赋值时触发，传给setter函数的参数origin为本应设置给变量的值。
    * setter() 函数的返回值将作为赋值语句的值

## “坑”

以下是一些使用 aopjs 常会遇到的问题：

* 对于一个文件的切入操作，必须在require目标文件之前，如果切入操作无效，首先检查检查文件路径和joinpoint的匹配是否准确；然后，检查目标文件是否在切入操作执行前已经被require()了。
    
    例如以下情况是无效的，因为目标文件在执行 before()切入操作之前已经被加载了：

    ```javascript
    var aop = require("aopjs") ;
    var somefileexports = require("/some/file/path.js") ;

    aop("/some/file/path.js").defun("foo").before(function(){
        // something todo ...
    }) ;
    ```
    
    在这种情况下，系统会有任何错误提示，但before函数不会生效

* ... ...