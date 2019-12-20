---
title: flutter 学习笔记
date: 2019-06-04 13:01:00
tags:
  - flutter
---

flutter 的核心设计是将整个应用的各个部分各个层级都看作 Widget 来渲染,所以按照 Widget 的分类来学习会比较全面。

## 基础组件

### Container

- Row
- Column
- Image
- Text
- Icon
- RaisedButton
- Scaffold
- AppBar
- FlutterLogo
- Placeholder

## Material 组件

### 结构和导航

- Scaffold
- AppBar
- BottomNavigationBar
- TabBar
- TabBarView
- MaterialApp
- WidgetsApp
- Drawer

### 按钮

- RaisedButton
- FloatingActionButton
- FlatButton
- IconButton
- PopupMenuButton
- ButtonBar

### 输入框和选择框

- TextField
- Checkbox
- Radio
- Switch
- Slider
- Date & Time Pickers

### 对话框,Alert Panel

- SimpleDialog
- AlertDialog
- BottomSheet
- ExpansionPanel
- SnackBar

### 信息展示

- Image
- Icon
- Chip
- Tooltip
- DataTable
- Card
- LinearProgressIndicator

### 布局

- ListTile
- Stepper
- Divider

## Cupertino

- CupertinoActivityIndicator
- CupertinoAlertDialog
- CupertinoButton
- CupertinoDialog
- CupertinoDialogAction
- CupertinoSlider
- CupertinoSwitch
- CupertinoPageTransition
- CupertinoFullScreenDialogTransition
- CupertinoNavigationBar
- CupertinoTabBar
- CupertinoPageScaffold
- CupertinoTabScaffold
- CupertinoTabView

## Layout

### 单个元素

- Container
- Padding
- Center
- Align
- FittedBox
- AspectRatio
- ConstrainedBox
- Baseline
- FractionallySizedBox
- IntrinsicHeight
- IntrinsicWidth
- LimitedBox
- Offstage
- OverflowBox
- SizedBox
- SizedOverflowBox
- Transform
- CustomSingleChildLayout

### 多个元素

- Row
- Column
- Stack
- IndexedStack
- Flow
- Table
- Wrap
- ListBody
- ListView
- CustomMultiChildLayout

### LayoutBuilder

## Text

- Text
- RichText
- DefaultTextStyle

## Assets

- Image
- Icon
- RawImage
- AssetBundle

## Input

- Form
- FormField
- RawKeyboardListener

## Animation

- AnimatedContainer
- AnimatedCrossFade
- Hero
- AnimatedBuilder
- DecoratedBoxTransition
- FadeTransition
- PositionedTransition
- RotationTransition
- ScaleTransition
- SizeTransition
- SlideTransition
- AnimatedDefaultTextStyle
- AnimatedListState
- AnimatedModalBarrier
- AnimatedOpacity
- AnimatedPhysicalModal
- AnimatedPositioned
- AnimatedSize
- AnimatedWidget
- AnimatedWidgetBaseState

## 交互

- LongPressDraggable
- GestureDetector
- DragTarget
- Dismissible
- IgnorePointer
- AbsorbPointer
- Navigator
- Scrollable

## 样式

- Padding
- Theme
- MediaQuery

## Draw

- Opacity
- Transform
- DecoratedBox
- FractionalTransition
- RotatedBox
- ClipOval
- ClipPath
- ClipRect
- CustomPaint
- BackdropFilter

## Async

- FutureBuilder
- StreamBuilder

## 滚动

- ListView
- NestedScrollView
- GridView
- SingleChildScrollView
- Scrollable
- Scrollbar
- CustomScrollView
- NotificationListener
- ScrollConfiguration
- RefreshIndicator

## 辅助

- Semantics
- MergeSemantics
- ExcludeSemantics
