---
title: Flutter-Text
date: 2019-06-06 12:59:46
tags:
---

字符串根据布局约束可能跨越多行或者只显示在一行.
<!-- more -->
`style` 参数是可选的.如果忽略,默认使用最近的父组件的 `DefaultTextStyle`.如果给定的样式 `TextStyle.inherit` 属性为 true(默认),则给定的样式将和最近的父组件的 `DefaultTextStyle` 合并.这个合并操作很有用,例如使用默认的 font family 和大小使字体 bold.

使用 `Text.rich` 构造方法,`Text` 组件可以使用不同的 `TextSpan` 样式显示一段文字.

### 交互

使用 `GestureDetector` 组件,设置 `GestureDetector.onTap` 处理器可以使 `Text` 响应 touch 事件.

在 material design 设计 app 中,可以使用 `FlatButton` 代替,如果不适合的话,最少都应该使用 `InkWell` 代替 `GestureDetector`.

为了使文本分部分交互,使用 `RichText`,在相关部分文本上指定 `TapGestureRecognize` 作为 `TextSpan.recognizer`.

### 继承 🌲

`Object > Diagnosticable > DiiagnosticableTree > Widget > StatelessWidget > Text`
