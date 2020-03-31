---
title: Flutter desktop support
date: 2020-02-18 13:25:49
tags:
---

当前 Flutter 对桌面开发环境的支持正在开发中.
<!-- more -->
### macOS

macOS 是当前最成熟的桌面开发平台(仅 flutter 而言),已经进入 alpha 阶段.

### Windows

Windows shell 处于 technical preview.当前是基于 Win32 的,但计划后续探索 UWP 支持.
注意:最终定型版本的 API 可能和当前有明显差异.

### Linux

当前 Linux shell 仅仅是 GLFW 的替代品,来探索 Linux 桌面实现,未来可能会被替换成其他实现.
将来你的应用无论是使用 GTK+,Qt,WxWidgets,Motif 或其他任意开发工具套件都可以通过 Flutter 来创建 library,但是当前还没想好如何规划.当前计划先无条件支持 GTK+,然后慢慢支持其他.

## 命令

### `create`

当前,只有 macOS 支持`flutter create`.对于 Windows 和 Linux,推荐参考 `flutter-desktop-embedding project`.

#### 覆盖目标平台

大部分应用需要覆盖支持的应用平台对应的值，否则会出现`Unknown platform` 异常.

```
import 'package:flutter/foundation.dart' show debugDefaultTargetPlatformOverride;

void _setTargetPlatformForDesktop() {
    if (Platform.isLiinux || Platform.isWindows) {
        debugDefaultTargetPlatformOverride = TargetPlatform.fuchsia;
    }
}

void main(){
    _setTargetPlatformForDesktop();
}
```
