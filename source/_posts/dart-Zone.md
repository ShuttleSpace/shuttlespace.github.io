---
title: Dart-Zone
date: 2019-10-23 09:56:01
tags: Dart
---

Dart 是单线程模型,相对于 JavaScript,其也有 `microTaskQueue` 和 `eventTaskQueue`.
<!-- more -->
`Zone` 代表某个环境的稳定跨异步环境调用.

代码通常都执行在一个 `zone`中,如`Zone.current`.而`main`函数通常运行在默认的`Zone.root`上下文中.
通过 `runZoned` 创建一个新`zone` 或 `Zone.run` 将代码运行到一个由 `Zone.fork`创建的上下文中.

开发者可以通过覆盖一个存在`zone`的一些方法来创建一个新`zone`.如自定义`zone`可以替换或修改`print`、timers、
micortasks、uncaught erros 的默认行为.

`Zone`类不可以被继承.可以使用 fork 存在的 `zone`,通常是`Zone.current`和`ZoneSpecification`来自定义`zone`.这和继承`Zone`类来创建新的`zone`类似.

异步回调总是运行在其被规定的`zone`上下文中.使用一下步骤实现:
+ 首先使用`registerCallback`、`registerUnaryCallback`、`registerBinaryCallback`中的一个注册.`zone`就就可以记录此`callback`或修改它(返回一个不同的`callback`).执行注册的代码(如 `Future.then`)也会记住当前的`zone`,之后`callback`就可以在此`zone`中运行.
+ 之后在上面保留的`zone`中运行注册的`callback`.
这些通常都有平台处理,用户无需操心.如果要根据底层提供的功能或`native extensions`开发自定义的异步规则,则必须实现上面两步.

`bindCallback`、`bindUnaryCallback`、`bindBinaryCallback` 则简化了上面的步骤,直接调用即可.

`bindCallbackGuarded`、`bindUnaryCallbackGuarded`、`bindBinaryCallbackGuarded`可以通过`Zone.runGuarded`来调用.

> Dart 构造方法不可见的实现方式: Zone._();

所有的隔离入口函数被调用时(`main`或`spawned` 函数)都运行在根`zone`(即 `Zone.current`等于`Zone.root`).如果没有创建自定义的`zone`,后面的代码都会运行在此根`zone`中.

如果异步回调如`Future`或`Stream`没有捕获异常,则会调用`zone.handleUncaughtError`来捕获异常.

`error zone`(`Zone.current.errorZone`)是处理未捕获异常的地方.异步异常不会传递到不同的error handler.

```dart
import 'dart:async';

main() {
  var future;
  runZoned(() {
    future = Future.error("asynchronous error");
  },onError:(e){print(e);});
  future.catchError(e) {
    throw "is never reached";
  }
}
```