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

## 概念

> AOP = Aspect Oriented Programming （面向切面编程）

0. 将系统里的代码定义为连接点(`joinpoint`/`joint`)，aopjs 目前支持的 `joinpoint` 仅为：函数定义(before/around/after)，常量(getter)，变量(setter/getter)

1. 按特性找到连接点(`joinpoint`)，将有用的`joinpoint`集合在一起，形成切入点(`pointcut`)

3. 对切入点(`pointcut`)进行函数切入(`cut`)操作，被切入到`pointcut`上的函数称为“方面”(`adive`)；aopjs目前实现的advice类型有：before，around，after，setter，getter



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


### RegExp常量 regexp()


## 切入点（Pointcut）

## Advice

## “坑”



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/aleechou/aopjs/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

