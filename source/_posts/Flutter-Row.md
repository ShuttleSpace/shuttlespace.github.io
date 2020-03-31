---
title: Flutter-Row
date: 2019-06-04 13:28:18
tags:
---

以横向数组的方式显示子组件的组件.
<!-- more -->
为了使其一个组件填充剩余可用空间,可以使用 `Expanded`对其进行包装.

`Row` 组件不会滑动(通常一个`Row`组件中的子组件过多已经超出了可用空间,则会导致错误).如果在不足的空间中想要一排组件能够滑动,可以考虑使用 `ListView`.

`Column` 竖向排列.

如果仅有一个子组件,那么可以考虑使用 `Align` 或 `Center` 定位该子组件.

#### 为什么我的 row 有一条黄黑相间的条纹?

如果 `Row`的内容是不可伸缩扩展的(没有使用 `Expanded` 或 `Flexible` 组件包装),连在一起比 row 本身更宽,那么我们就称 row 溢出了.
如果 row 溢出了,那么 row 就没有多余的空间去分配给它的`Flexible` 和 `Expanded` 子组件. row 会在边上显示一条黄黑相间的条表示溢出了.如果 row 外有空间,那么溢出亮将会以红色字体打印出来.

## 布局算法

> 接下来介绍 framework 是如何渲染 `Row` 的.查看 `BoxConstraints` 了解盒布局模型.

`Row` 的布局分以下 6 步:
1、使用无边界的水平约束和传入的垂直约束设置每个子组件 flex 因子为 null 或 0.如果 `crossAxisAlignment` 值为 `CrossAxisAlignment.stetch`,使用满足传入的垂直约束的最大高度而不是使用准确的垂直约束.
2、对非 0 flex 因子的子组件,按照其 flex 因子将剩下的水平空间分割.如一个 flex 因子为 2.0 的子组件在水平空间上将比 flex 因子是 1.0 的子组件宽 2 倍.
3、使用相同的垂直约束按照步骤 1 布局剩下的子组件,使用基于步骤 2 申请到的空间作为水平约束而不是无边界水平约束布局.`Flexible.fit` 属性值为 `FlexFit.tight` 的子组件受到严格约束(如强制填充申请到的空间),而 `Flexible.fit` 属性值为 `FlexFit.tight` 的子组件约束宽松(如不强制填充申请到的空间).
4、`Row` 的高度总是最大子组件的高度(一般满足传入的垂直约束).
5、`Row` 的宽度由 `mainAxisSize` 属性决定.如果 `mainAxisSize` 属性值为 `MainAxisSize.max`,那么 `Row` 的宽度是传入约束的最大宽度.如果 `mainAxisSize` 的值为 `MainAxisSize.min`,那么 `Row` 的宽度是所有子组件的宽度之和(受传入约束).
6、根据 `mainAxisAlignment` 和 `crossAxisAlignment` 确定每个子组件的位置.例如,如果 `mainAxisAlignment`是 `MainAxisAlignment.spaceBetween`,
没有被分配给子组件的空间将会平均分配到各个子组件之间.

## 继承 🌲

`Object > Diagnosticable > DiagnosticableTree > Widget > RenderObjectWidget > MultiChildRenderObjectWidget > Flex > Row`
