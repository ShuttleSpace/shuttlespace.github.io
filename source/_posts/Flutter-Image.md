---
title: Flutter-Image
date: 2019-06-05 13:04:47
tags:
---

显示图片的组件.

提供了以下几个不同用途的构造方法:

- `new Image`: 从 `ImageProvider` 中获取图片.
- `new Image.asset`: 使用 key 从 `AssetBundle` 中获取图片
- `new Image.network`: 从 URL 中获取图片
- `new Image.file`: 从 `File` 中获取图片
- `new Image.memory`: 从 `Uint8List` 中获取图片

支持以下图片格式: JPEG,PNG,GIF,Animated GIF,WebP,Animated WebP,BMP,WBMP.

为了自动实现像素密度级的资产管理, 确保在 `MaterialApp`,`WidgetsApp`,`MediaQuery`组件树中使用 `AssetImage` 指定的 `Image` 组件.

图片是用 `paintImage` 画出来的,它包含了 Image 中的不同属性详情描述.

## 类似组件

- `Icon`
- `new Ink.Image`: 在 material app 中推荐使用(特别是图片在 `Material` 中,而且上面有 `InkWell`)
- `Image`: `dart:ui` 提供

## 继承 🌲

`Object > Diagnosticable > DiagnosticableTree > Widget > StatefulWidget > Image`

## 属性

- `alignment` -> `AlignmentGeometry`
- `centerSlice` -> `Rect`: .9 图
- `color` -> `Color`
- `colorBlendMode` -> `BlendMode`: 混合颜色
- `excludeFromSemantics` -> `bool`
- `filterQuality` -> `FilterQuality`
- `fit` -> `BoxFit`
- `gaplessPlayback` -> `bool`: 当 image provider 改变时是否显示旧的图片.
- `heihgt` -> `double`
- `image` -> `ImageProvider`
- `matchTextDirection` -> `bool`
- `repeat` -> `ImageRepeat`
- `semanticLabel` -> `String`
- `width` -> `double`
