---
title: LiveData
date: 2019-02-28 16:36:39
tags:
  - Architecture Components
---

### LiveData 的优势

- 确保 UI 和数据状态匹配
  > LiveData 遵循观察者模式。
- 无内存泄漏
- 不会因为 Activity 被终止而崩溃
  > 如果观察者处于 inactive 状态，例如 activity 处于回退栈中，那么它不会接收到任何 LiveData 事件.
- 不用手动处理生命周期事件
- 时刻更新数据状态
  > 如果一个观察者的变为 inactive，那么它会在重新 active 时获取最新的数据状态。比如，一个 activiy 如果处于后台，那么它将在重新返回前台时获取到最新的数据。
- 应对 configuration change
  > 如果一个 activity 或 fragment 由于 configuration change(设备旋转) 导致重新创建，它会立即获取最新可用的数据.
- 共享资源
  > 可以使用单例模式扩展 LiveData，封装系统服务在 app 内共享。

> 在 ViewModel 对象中保存可以更新 UI 的 LiveData 对象，而不是在 activity 或 fragment 的原因是：
>
> - 避免 activty 或 framgent 过度膨胀。UI controller 仅负责展示数据而不是保存数据状态
> - 从特性的 activity 或 fragment 中剥离 LiveData 实例，使得 LiveData 对象可以在 configuration change 中存活。

_请在主线程中调用 setValue(T) 更新 LiveData 对象.如果是在工作线程，请调用 postValue(T)._
