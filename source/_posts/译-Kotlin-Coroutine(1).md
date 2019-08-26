---
title: >-
  译-Kotlin-Coroutine(1)
  case)
date: 2019-08-26 20:23:11
tags:
  - 翻译
---
### 提取函数-重构
但是如果提取出来的函数包含了一个在当前作用域调用的协程构造器怎么办?这种情况下,`suspend` 修饰符就不能满足需求了使`doWorld` 成为 `CoroutineScopr`的一个扩展函数是一种解决方案,但这种方法使得API不清晰而不适用其他情况.理想的解决方案是`CoroutineScope` 作为一个包含目标函数的类的一个属性存在,或者这个类实现`CoroutineScope`接口.最后一种方案就是适用`CoroutineScope(coroutineContext)`,但是这种方法会因为无法控制此方法的执行范围而表现出结构不安全性.只有一些私有 APIs 可以使用这个协程构造器.
### 类似守护线程的 Global Coroutines
`GlobalScope`启动的活动线程不会挂住线程,他们的行为类似守护线程.

# 取消与超时
### 取消协程的执行
在一个长时间运行的应用中,你可能需要精确控制后台运行的协程.例如用户可能关闭一个开启了协程的页面,那这个协程就需要被取消.`launch`函数返回一个`Job`对象可以取消此协程的执行.
### 同时取消
协程可以同时取消.所有在 `kotlinx.coroutines`中挂起的函数都是可取消的.在取消时,检查协程的取消标记然后抛出`CancellationException`.然而,如果一个协程在`computation` 中运行,而且没有检查取消标记,那就不能被取消.
### 使 computation 代码可以被取消
有两种方式可以取消 computation 代码.第一种是周期性的调起一个挂起函数去检测取消标记.`yield`函数可以实现这个需求.另一种是精确的检查取消标记状态.
### 使用 `finally` 关闭资源
在取消具有可取消属性的挂起函数时会抛出 `CancellationException`,可以在 coroutine 被取消时使用常用的方法处理.如 `try{...}finally{...}`表达式和 `use`函数执行最终任务.
`join`和`cancelAndJoin`等待所有的最终任务执行完成才结束.
### 运行不可取消的代码块
任何在`finally`块中使用挂起函数都将导致`CancellationException`,因为运行此代码的 coroutine 已经被取消了.通常,这不是个问题,因为良好的关闭操作(关闭文件、取消任务或关闭任意类型的消息通道)通常都是非阻塞的,而且也不会挂起任何函数.在已经取消的协程里,如果竞态条件下想挂起,你可以使用`withContext`函数和`NonCancellable`上下文在`withContext(NonCancellable){...}`中封装响应的代码.
### 超时
取消一个正在执行的协程的最常见的理由可能是他的执行时长已经超过了超时时间.当然,你可以手动追踪相应`Job`的引用,然后启动一个独立的协程延时后取消追踪的这个`Job`,`withTimeout`函数可以实现这个需求.
`withTimeout`抛出的`TimeoutCancellationException`是`CancellationException`的子类.之前没有看到控制台打印异常堆栈信息的原因是在一个被取消的协程抛出的 `CancellationExcepiton`被认为是协程正常执行结束的标记.
因为 cancellation 仅仅是一个异常,所有的资源都可以使用正常的逻辑处理.如果你需要在任何超时时添加某些特殊逻辑,可以把超时的这些代码放在`try{...}catch(e:TimeoutCancellationException){...}`块中,或者使用`withTimeoutOrNull`函数(类似`withTimeout`但是在超时返回 null 而不是抛出异常).

# 组合挂起函数
### 默认顺序
假设有定义在其他地方的两个挂起函数执行如远程服务或计算等任务.我们认为这些任务有用,实际上每隔任务只是为了其特殊目的延时了1秒.
```kotlin
suspend fun doSomethingUsefulOne():Int {
  delay(1000)
  return 13
}
suspend fun doSomethingUsefulTwo():Int {
  delay(1000)
  return 29
}
```
如果我们需要上面的函数按顺序被调用,然后计算他们的结果?实际中,我们都是先拿第一个函数的结果在决定是否调用第二个函数或如何调用.
和普通的代码一样,在协程里的代码也是按顺序执行的.
### 使用 async 并发
如果两个函数之间没有相关,而且我们想更快的获取到结果,可以同时执行两个函数吗?`async`可以实现.
理论山,`async`类似`launch`.它会开启一个新的协程和其他协程并发的执行.不同之处在于`launch`返回一个没有携带结果的`Job`,而`async`返回一个`Deferred`(一个轻量级的非阻塞 future 表示在未来的某一时刻会返回结果).可以对`Deferred`使用`.await()`来获取最终的结果,但是`Deferred`同时也是一个`Job`,所以必要的时候也可以取消.
协程的并发性总是精确的.
### 使用 async 延迟启动
`async`可以设置它的`start`参数为`CoroutineStart.LAZY`来延迟启动.在此场景下,只有在`await`调用获取结果时才启动,或者它的`Job`的`start`函数被调用时启动.
如果仅仅调用`await`而没在之前调用各自协程的`start`,这将会导致序列化行为,因为`await`启动协程执行代码然后等待它结束,这不是用户角度的延迟.当调用挂起函数计算某个值时使用`async(start=CoroutineStart.LAZY)`可以替换标准的`lazy`函数.
### async 风格的函数
使用`async`协程构造器和明确的`GlobalScope`引用异步调用函数就可以实现async风格的函数.一般这样的函数以`...Async`后缀结尾以表明只启动了异步执行,需要使用`Deferred`来获取结果.
`xxxAsync`函数不是挂起函数.这种函数可在任意地方调用.这种函数就意味着异步(此处即为并发)执行他们的任务和代码.
```kotlin
import kotlinx.coroutines.*
import kotlin.system.*

fun main() {
  val time = measureTimeMillis {
    val one = somethingUsefulOneAsync()
    val two = somethingUsefulTwoAsync()
    // 等待结果必须在挂起函数或者阻塞
    // 所以使用 runBlocking{} 阻塞主线程
    runBlocking {
      println("${one.await() + two.await()}")'
    }
  }
}

fun somethingUsefulOneAsync() = GlobalScope.async {
    doSomethingUsefulOne()
}

fun somethingUsefulTwoAsync() = GlobalScope.async {
    doSomethingUsefulTwo()
}

suspend fun doSomethingUsefulOne(): Int {
    delay(1000L) // pretend we are doing something useful here
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    delay(1000L) // pretend we are doing something useful here, too
    return 29
}
```
这段代码类似其他语言的异步(js).假设`xxxAsync`在执行过程中发生了异常,通常全局错误处理器会捕获该异常,记录报告此错误,程序可以继续执行其他操作.但是此处的函数在后台运行,而不会被打断,即使初始化调用它的操作已经被终止了.所以不鼓励使用这样的代码风格.
### 使用 async 进行结构化并发
因为`async`协程构造器是`CoroutineScope`的扩展函数,所以需要使用`coroutineScope函数`提供执行范围.
```kotlin
suspend fun concurrentSum(): Int = coroutineScope {
  val one = async { doOne()}
  val two = async { doTwo()}
  one.await+two.await()
}
```
如果在上面的函数里出错抛出异常,那么在这个范围里启动的所有协程都将被取消.

# 协程上下文和分发器
协程总是在 kotlin 标准库定义的 `CoroutineContext` 类型的某个上下文中执行.
协程是一系列不同元素的集合.主元素是协程的 `Job`,`dispatcher`.
### 分发器和线程
协程上下文包含了一个协程分发器(决定哪个线程或相应协程执行其代码的线程).协程分发器可以限制协程在某个指定的线程,线程池,或者未定义的线程去执行.
所有的协程构造器如`launch`和`async`接收一个可选的`CoroutineContext`参数(可以精确的指定为一个新协程或者其他上下文元素).
当`launch{...}`未传参数时,它继承了从它被启动的地方的`CoroutineScope`的上下文(和分发器).
`Dispatchers.Unconfined`是一个也运行在`main`线程的特殊分发器,但实际机制是不同的.
当协程从`GlobalScope`(即`Dispatchers.Default`)启动时使用的是默认分发器.使用了一个共享后台线程池,所以`launch(Dispatchers.Default){...}`和`GloablScope.launch{...}`使用了相同的分发器.
`newSingleThreadContext`为协程创建了一个新线程去运行.专用线程是一种非常昂贵的资源.在真实应用下,当不在使用时,它必须使用 `close` 函数 release,或者存储在一个顶级变量中,然后在整个应用中复用.
### 无限制和受限制的分发器
`Dispatchers.Unconfined`协程分发器仅在第一个挂起点时才在调用者线程启动一个协程.挂起后,线程中的协程完全由被调用的挂起函数决定是否恢复.无限制协程分发器适用于既不消耗CPU时间,也不更新限定于特定线程的共享数据(如UI)的协程.
此外,此协程默认继承其外部的`CoroutineScope`.`runBlocking`协程的默认分发器受限于其被调用的线程,所以它将具有在此线程执行可预测FIFO调度的影响.
> 无限制分发器属于高级技巧:在分发一个协程后不需要或产生不可期的副作用时很有效果（因为在一个协程里的某些操作必须被正确的执行）.在正常代码中不要使用无限制分发器.
### 调试协程和线程
协程可以在一个线程被挂起,在另一个线程被唤醒.即使是一个单线程分发器也很难检测协程在什么时间,什么位置,执行了什么操作.最常用调试线程的方式是在每条日志语句打印出线程名.几乎所有的日志框架都支持这个特性.使用协程时,线程没有提供更多的上下文信息,而`kotlinx.coroutines`包含了许多调试工具可以更方便的实现这个需求.
在 JVM 参数时配置 `-DKotlinx.coroutines.debug`.
> JVM 配置 `-ea` 参数debug模式自动开启.
### 在线程之间跳转
```kotlin
fun log(msg:String) = println("[${Thread.currentThread().name}] $msg")
fun main() {
  newSingleThreadContext("Ctx1).use{ctx1 ->
    newSingleThreadContext("Ctx2).use{ctx2 ->
      runBlocking(ctx1) {
        log("started in ctx1")
        withContext(ctx2) {
          log("working in ctx2")
        }
        log("back to ctx1")
      }
    }
  }
}
```
`runBlocking`可以指定上下文对象.`withContext`函数可以改变一个协程的上下文对象.
kotlin标准库里的`use`函数会主动释放`newSingleThreadContext`创建的线程(不再使用时).
### 上下文里的 Job
协程里的 Job 是上下文的一部分,可以通过`coroutineContext[Jon]`表达式获取到.
> `CoroutineScope`里的`isActive`仅仅是`coroutineCOntext[Job]?.isActive == true`的简写.
### 子协程
当从另一个协程的`CoroutineScope`中启动一个新协程时,后者通过前者的`CoroutineScope.coroutineContext`和新协程的Job继承了前者的上下文,变成了父协程 job的子job.当父协程被取消时,所有的子job都会被迭代取消.
然而,当使用`GlobalScope`启动一个协程时,新协程的Job是没有父Job的.所以它不会绑定到任何 scope,运行是独立的.
### 父协程的职责
父协程总会等待所有的子Job执行完成才结束.父协程不需要刻意追踪它启动的所有子Job,也不需要使用`Job.join`去等待.
### 命名协程
自动分配的协程id可以在需要的时候过滤关注的协程信息.如果一个协程是进行特殊请求或执行特殊后台任务,对其进行合适的命名更利于debug.context的`CoroutineName`元素属性类似线程名可以给协程命名.当 debug 模式开启时,它会包含此协程所在线程的名字.
### 组合上下文对象元素
有时需要为一个协程上下文定义多个元素.可以使用`+`实现.
```kotlin
launch(Dispatchers.Default + CoroutineNmae("Test")) {}
```
### 协程范围
假设我们的应用有一个有生命周期的对象,但是这个对象不是协程.例如我们的android应用在Actiivty的上下文下启动了许多的协程去执行异步操作(如获取更新数据、执行动画等).当activity被销毁时所有的协程必须被取消以避免内存泄漏.我们当然可以手动的将协程和job绑定到activity的上下文,但是`kotlinx.coroutines`提供了一个抽象的封装对象:`CoroutineScope`.所有的协程构造器都是作为其扩展而存在.
创建一个绑定到activity的`CoroutineScope`对象来管理生命周期.`CoroutineScope`实例可以通过`CoroutineScope()`或`MainScope()`工厂函数创建.前者创建一个通用的scope,而后者使用`Dispatchers.Main` 作为默认分发器创建一个专为UI应用构造的scope.
```kotlin
class Activity {
  private val mainScope = MainScope()
  fun destroy(){
    mainScope.cancel()
  }
}
```
也可以为 `Activity`类继承 `CoroutineScope`接口.最佳方案是使用代理实现默认工厂函数.
```kotlin
class Activity : CoroutineScope by CoroutineScope(Dispatchers.Default) {}
```
### 线程本地数据(Thread-local data)
有时候在协程之间能传递线程本地数据将会很方便.但是因为这是数据没有绑定到任意特定的线程,所以可能需要写很多重复的代码.

`asContextElement`扩展函数可以作为`ThreadLocal`使用.它会创建一个额外的上下文元素保存`ThreadLocal`值,在每次协程切换它的上下文是自动恢复.

很容易忘记设置相应的上下文元素.如果线程运行的协程不同,从协程访问thread-local变量可能会出现未知的值.为了避免这样的情况,推荐使用`ensurePresent`方法和在不正确使用时`fail-fast`.

`ThreadLocal`属于顶级元素支持,可以在`kotlinx.coroutines`提供原生支持.仅有一个限制:即这个thread-local值发生变化,协程调用者不会收到通知(因为协程上下文元素不会追踪所有的`ThreadLocal`对象访问路径),那么更新的元素在下次挂起时将会丢失.在协程中使用`withContext`更新一个thread-local对象的值.

当然,数据也可以存储在一个可变的box如`class Counter(var i:Int)`中,最终会被转为存储在thread-local变量中.这样你就需要自己同步数据的变更.

`ThreadContextElement`

# 异步流
挂起函数异步返回一个值,但是如何返回多个异步值?异步流可以实现这样的需求.
### 展示多个值
###### collections
在 kotlin 使用 `collections`表示多个值.
###### sequence
如果数据是需要花费CPU阻塞计算出来的,那可以使用 `Sequence`
```kotlin
fun foo(): Sequence<Int> = sequence {
  for (i in 1..3) {
    Thread.sleep(100)
    yield(i)
  }
}

fun main() {
  foo().forEach {value -> println(value)}
}
```
##### 挂起函数
但是上面这样的代码会阻塞主线程.
##### Flows
使用 `List<Int>`会一次性返回所有的值.可以使用`Flow<int>`异步的计算值来表示数据流.
```kotlin
fun foo(): Flow<Int> = flow {
  for (i in 1..3) {
    delay(100)
    emit(i)
  }
}

fun main() = runBlocking<Unit> {
  launch {
    for (k in 1..3) {
      println("I am not blocked$K")
      delay(100)
    }
  }
  foo().collect{value -> println(value)}
}
```
- `flow{...}` 构造器可以挂起
- `foo()` 函数不再被标记为`suspend`

### Flows 属于冷启动
Flows 类似 sequences 是冷启动的-在 flow 构造器中的代码在 flow 被 collect 前是不会运行的.这就是为什么 `foo()`函数没有被标记`suspend`.
### Flows 取消
flow 遵循协程的取消规则.flow 没有提供其他额外的挂起点.当flow被一个可取消的挂起函数(`delay`)挂起时是可以被取消的.否则是不可被取消的.
### Flow 构造器
- `flow{...}`
- `flowOf`构造器发射固定带下的数据流
- 不同的 collections 和 sequence 可以使用 `.asFlow()` 扩展函数转为 flow.
### flow 的中间操作
Flows 可以使用类似 collections 和 sequences 进行转换.中间操作应用在上游流,然后返回下游流.这些流都是冷启动流.这样的操作不是挂起函数.立即返回新的转换流.

最基本操作名称如`map`,`filter`.不同于 sequence 的是在这些操作里的代码块可以调用挂起函数.

```kotlin
suspend fun performRequest(request: Int): String {
  delay(1000)
  return "response $request"
}

fun main() = runBlocking<Unit> {
  (1..3).asFlow()
        .map{ request -> performRequest(request)}
        .collect{ response -> println(response)}
}
```
### 转换操作符
flow 转换符中,最常用的被称为`transform`.它可以实现比`map`和`filter`更复杂的转换操作.使用 `transform`操作符,可以发射任意值任意次.
```kotlin
suspend fun performRequest(request: Int): String {
  delay(1000)
  return "response $request"
}

fun main() = runBlocking<Unit> {
  (1..3).asFlow()
        .transform{ request ->
          emit("making request $request")
          emit(performRequest(request))
        }
        .collect{ resposne -> println(response)}
}
```
### 大小限制操作符
大小限制操作符如`take`在相应的限制到期时会取消执行.协程里的取消总是会抛出异常,所以所有的资源管理函数如(`try{...}finally{...}`)和普通的操作类似.
### 终止flow操作符
终止操作符是一个启动收集流的挂起函数.`collect`函数是最长用的一个.其他的有:
- 转换为不同的 collections如: `toList`,`toSet`
- 获取第一个值并且确定流只发送了一个值.
- 使用 `reduce`和`fold`把流压缩为一个值.
### 流是连续的
一个流的每个独立收集都是连续的除非某些特殊操作处理了多个流.协程里的流收集会调用一个终止操作符.默认不会启动新协程.每一个发射的数据都会被从上游到下游的中间处理操作符处理.最后被传送到终止操作符.
### Flow context
流的收集操作总是处于正在被调用的协程中,而不是flow所在的协程.

流的这个操作被称为上下文保存.
所以默认`flow{...}`里的代码运行的上下文是由流的相应收集者提供的.对于快速运行或异步代码而言,这是个完美的默认设置,它不关心上下文执行者,也不阻塞调用者.

###### withContext 发射错误
长时间消耗CPU的代码需运行在`Dispatchers.Default`上下文,UI更新代码需运行在`Dispatchers.Main`上下文中.通常,在协程中使用 `withContext`切换上下文,但是`flow{...}`中的代码有上下文保留特性,不允许在其他上下文发射数据.
###### flowOn 操作符
指向 flowOn 函数的异常可以用来更改 flow 发射的上下文.改变flow上下文的正确操作如下:
```kotlin
fun foo():Flow<Int> = flow {
  for (i in 1..3) {
    delay(100)
    emit(i)
  }
}.flowOn(Dispatchers.Default)

fun main() = runBlocking<Unit> {
  foo().collect{ value ->
    log("llll")
  }
}
```
`flowOn`操作符改变了流的默认顺序.现在收集者在一个协程,而发射却并发的运行在在另一个线程的一个协程中.当在它的上下文中改变`CoroutineDispatcher`时`flowOn`操作符为上游创建了另一个协程.
### Buffering
在涉及长时间运行的异步操作时,在不同协程运行流的不同部分对流收集的总时间很有帮助.
使用`buffer`操作符操作操作正在发射数据的流,并发的收集而不是顺序收集.
```
val time = measureTimeMillis {
  foo()
    .buffer()
    .collect { value ->
      delay(300)
      println(value)
    }
}
println("Collected in $time ms")
```
> 当改变 `CoroutineDispatcher`时`flowOn`操作符使用相似的机制,但是此处不需要改变执行上下文.
##### 异步合并
当流表示了部分操作结果或参数更新状态,处理每个值可能没必要,但是需要处理最近的一个.当收集者处理太慢时`conflate`操作符可以跳过某些中间值.
##### 处理最后一个值
当生产者和消费者处理都很慢时,conflate 是一种加速的方法.它丢弃了一部分数据.另一种方式是取消慢消费者,然后只要生产者发送一个数据就重启.
```kotlin
foo()
  .follectLastes {value ->
    println("collection $value")
    delay(300)
    pritln("Done $value")
  }
```
### 组合多个流
###### Zip
类似`Sequence.zip`扩展函数,流也有`自拍`操作符
###### Combine
当流表示某些变量或操作最近的值时(见`conflation`),它可能需要根据相应流的最新值和上游发射的新数据计算,`combine`可以实现.使用`zip`的话就得等时间最长的哪个流收到值才能计算.
### 展开流
因为流表示异步接受到的数据流,所以每个值可以转为另一个序列的流.如`Flow<Flow<String>>`
###### flatMapConcat
`flatMapConcat`和`flattenConcat`操作符实现了拼接模式.这是最接近 sequence的操作符.
```
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun requestFlow(i: Int): Flow<String> = flow {
    emit("$i: First")
    delay(500) // wait 500 ms
    emit("$i: Second")
}

fun main() = runBlocking<Unit> {
//sampleStart
    val startTime = currentTimeMillis() // remember the start time
    (1..3).asFlow().onEach { delay(100) } // a number every 100 ms
        .flatMapConcat { requestFlow(it) }
        .collect { value -> // collect and print
            println("$value at ${System.currentTimeMillis() - startTime} ms from start")
        }
//sampleEnd
}
```
###### flatMapMerge
另一种展开模式是并发的收集所有进来的流,然后把他们合并为一个单一流,这样值就可以尽快被发出去.`flatMapMerge`,`flattenMerge`.它们都接受一个`concurrency`参数限制并发流的数量.
###### flatmapLatest
```
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun requestFlow(i: Int): Flow<String> = flow {
    emit("$i: First")
    delay(500) // wait 500 ms
    emit("$i: Second")
}

fun main() = runBlocking<Unit> {
//sampleStart
    val startTime = currentTimeMillis() // remember the start time
    (1..3).asFlow().onEach { delay(100) } // a number every 100 ms
        .flatMapLatest { requestFlow(it) }
        .collect { value -> // collect and print
            println("$value at ${System.currentTimeMillis() - startTime} ms from start")
        }
//sampleEnd
}
```
