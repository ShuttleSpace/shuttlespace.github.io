---
title: Flutter-Column
date: 2019-06-04 23:25:10
tags:
---

以垂直数组方式显示子组件的组件.

想要某个子组件扩展填充垂直空间,使用 `Expanded` 组件包装即可.

`Column` 组件不会滑动(通常如果 `Column` 中的多个子组件超出了可用空间,则会报错).如果有一排组件,而且想要在空间不足时能滑动,考虑使用 `ListView`.

横向排列考虑使用 `Row`.

如果只有一个子组件,考虑使用 `Align` 或 `Center` 定位组件.

#### 如果传入的垂直约束是无边界的

如果一个 `Column` 组件有一个或多个 `Expanded` 或 `Flexible` 组件,并且被放在另一个 `Column` 或 `ListView` 或其他不提供最大高度约束上下文的组件中,那么将会收到一个运行时异常,表明有非 0 flex 的子组件,但是其垂直约束是无边界的.

正如异常表现出来的问题,使用 `Flexible` 或 `Expanded` 意味着接下来布局其他的子组件时必须把剩余的空间平均分配,而如果传入的垂直约束是无边界的话,剩余的空间就变成无限的.

解决该问题的关键在于为什么 `Column` 会接收到无边界的垂直约束.

一个可能的原因是 `Column` 被放在了另一个 `Column` (内部的 `Column` 没有使用 `Expanded` 或 `Flexible` 包装)中.当一个 `Column` 布局它的非 flex 子组件(没有使用 `Expanded` 或 `Flexible` 包装)时,该 `Column` 就给了其子组件无边界的约束,这样子组件可以自己决定他们的维度(传递无边界的约束意味着该子组件可能需要收缩以包装其内容).对应的解决方案是使用 `Expanded` 包装内部的 `Column`,表明内部的 `Column` 应该填充外部 `Column` 的剩余空间,而不是去获取它想要的空间大小.

另一个可能的原因是一个 `Column` 可能嵌套在 `ListView` 或其他可滑动的垂直布局组件中.在这种场景下,确实存在无限的垂直空间(垂直滑动列表的重点在于允许无限垂直滑动).通常应该检查为什么内部的 `Column` 会有一个 `Expanded` 或 `Flexible` 子组件:它的大小真的是内部子组件的大小吗?解决方案是从包装内部子组件的父组件中移除 `Expanded` 或 `Flexible` 组件.

查看 `BoxConstraints` 获取更多关于约束的信息.

#### 黄黑相间条

当一个 `Column` 的内容超过了可用空间,即 `Column` 溢出,那么内容将被裁剪.在 debug 模式下,在溢出边角上会显示一个黄黑相间条指出该问题,在 `Column` 下会打印一个溢出多少的信息.

最普遍的解决方案是当垂直空间受限时确保内容滑动使用 `ListView` 而不是 `Column`.

## 布局算法

> 接下来是 framework 如何渲染 `Column`,查看 `BoxConstraints` 获取盒布局模型信息.

布局 `Column` 需要 6 步.
1、使用无边界的水平约束和传入的垂直约束设置每个子组件 flex 因子为 null 或 0.如果 `crossAxisAlignment` 值为 `CrossAxisAlignment.stetch`,使用满足传入的垂直约束的最大高度而不是使用准确的垂直约束.
2、对非 0 flex 因子的子组件,按照其 flex 因子将剩下的水平空间分割.如一个 flex 因子为 2.0 的子组件在水平空间上将比 flex 因子是 1.0 的子组件宽 2 倍.
3、使用相同的垂直约束按照步骤 1 布局剩下的子组件,使用基于步骤 2 申请到的空间作为水平约束而不是无边界水平约束布局.`Flexible.fit` 属性值为 `FlexFit.tight` 的子组件受到严格约束(如强制填充申请到的空间),而 `Flexible.fit` 属性值为 `FlexFit.tight` 的子组件约束宽松(如不强制填充申请到的空间).
4、`Row` 的高度总是最大子组件的高度(一般满足传入的垂直约束).
5、`Row` 的宽度由 `mainAxisSize` 属性决定.如果 `mainAxisSize` 属性值为 `MainAxisSize.max`,那么 `Row` 的宽度是传入约束的最大宽度.如果 `mainAxisSize` 的值为 `MainAxisSize.min`,那么 `Row` 的宽度是所有子组件的宽度之和(受传入约束).
6、根据 `mainAxisAlignment` 和 `crossAxisAlignment` 确定每个子组件的位置.例如,如果 `mainAxisAlignment`是 `MainAxisAlignment.spaceBetween`,
没有被分配给子组件的空间将会平均分配到各个子组件之间.

## 继承 🌲

`Object > Diagnosticable > DiagnosticableTree > Widget > RenderObjectWidget > MultiChildRenderObjectWidget > Flex > Column`
