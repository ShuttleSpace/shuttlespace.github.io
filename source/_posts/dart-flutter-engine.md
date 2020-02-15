---
title: dart-flutter engine
date: 2019-12-20 10:39:11
tags:
---

# Flutter engine

Flutter Engine 不创建或管理线程,相应的由 embedder 创建管理、message loops.

embedder 提供了 task runner 来执行任务.

Dart VM 会有自己的线程池.而 Flutter engine 和 embedder 都无法访问到线程池的线程.

<!-- more -->

### Task Runner Configuration

Flutter engine 会向 embedder 申请4个 task runner 引用. engine 不在乎引用是不是同一个 task runner,或者多个 task runner 运行在同一个线程中.
为了优化性能, embedder 应该为每个 task runner 分配一个单独的线程.虽然 engine 不关心 task runner 运行的线程情况,但是在 engine 的整个生命周期中线程配置应该保持一致.也就是如果 embedder 为task runner 分配了一个单独的线程,那么直到 engine 销毁,这个 task runner 都只能在这个线程运行.
常用的 task runners:
- Platform Task Runner
- UI Task Runner
- GPU Task Runner
- IO Task Runner

### Platform Task Runner
此 task runner 运行的线程被 embedder 认为是主线程.

此线程执行的 task runner 都是由 embedder 分配的.engine 指派的 task runner 是无意义的.多个 Flutter engine 可以在基于不同线程上运行的 platform task runner 启动.Flutter Content Handler 在 Fuchsia 中就是此原理.每个 Flutter 应用所在的进程会创建一个新的 Flutter engine,同时每个 engine 都会创建一个新的 platform thread.

和 Flutter engine 的任何交互操作必须在 platform thread 中执行.而在其他线程中和 engine 交互, debug 构建中触发断言,release 构建中是非线程安全的.Flutter engine 中的很多组件都是非线程安全的.一旦 engine 配置运行后,只要 embedder API 的访问是在 platform thread 中执行的,embedder 就不必指派 task runner 去配置 engine.

此 task runner 除了在 engine 启动后负责 embedder 和 engine 交互外,同时会执行 platform messages.这是因为只有在 platform 的主线程访问 platform APIs 才是安全的.插件不必将他们的调用重新分配到主线程上.如果插件管理自己的 worker 线程,那么插件在响应结果被提交到 engine 由 Dart 处理前应该将其入队到 platform 线程中.和 engine 的交互必须在 platform 线程执行.

即使 platform 线程被阻塞了很长时间,Flutter rendering pipeline也不会被阻塞.platform 对此线程上的耗时操作进行了诸多限制.所以建议任何耗时操作在将执行结果返回并被入队到 platform 线程之前应该在独立的线程中执行(不是上面讨论的4种线程).如果不这么做可能导致 platform 指定的 watchdog 终结应用.诸如 android、ios 也使用 platform 线程传递用户输入时间.阻塞 platform 线程将导致操作被丢弃.

### UI Task Runner
engine 在 root isolate 通过 UI Task Runner 执行所有的 Dart 代码.root isolate 和 Flutter 绑定才能执行.此 isolate 运行应用程序的 main dart code.engine 绑定此 isolate 提交执行 frames. Flutter 的每一帧:
- root isolate 告诉 engine 要渲染哪一帧
- engine 会询问 platform 在下一次 vsync 时是否需要 be notified.
- platform 等待下一 vsync.
- 在 vsync, engine 会唤醒 dart code执行如下操作:
  - 更新动画插值器
  - 在 build phase 重建应用的 widget.
  - 布局新构建的 widget,将其绘制到层里的 tree 中立即提交给 engine.此处实际没有栅格化.