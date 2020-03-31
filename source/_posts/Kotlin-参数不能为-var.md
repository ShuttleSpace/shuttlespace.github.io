---
title: Kotlin 参数不能为 var
date: 2020-02-15 10:15:04
tags: kotlin
---
从 Kotlin M5.1 之后不再支持函数参数可变(var).
<!-- more -->
```
fun foo(var x: Int) {
    x = 5
}
```
主要是这回导致歧义:可能认为传递的是引用参数(此特性不支持,需要在 runtime 修改).
另一个原因是主构造函数:主构造函数使用 `val` 或 `var`声明不同性质的属性,而普通函数却不需要这样的功能.
同时可变参数可不是一个好习惯,所以在函数支持可变参数或`for-loop`块都不再支持.

[origin](https://blog.jetbrains.com/kotlin/2013/02/kotlin-m5-1/)