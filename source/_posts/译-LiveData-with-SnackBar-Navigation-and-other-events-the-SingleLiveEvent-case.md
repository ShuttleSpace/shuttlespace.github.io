---
title: >-
  [译]-LiveData with SnackBar,Navigation and other events(the SingleLiveEvent
  case)
date: 2019-02-28 20:23:11
tags:
  - 翻译
  - LiveData
  - Navigation
---

[原文](https://medium.com/androiddevelopers/livedata-with-snackbar-navigation-and-other-events-the-singleliveevent-case-ac2622673150)

view(activity/fragment) 和 ViewModel 交流的比较好的方式是 LiveData observables. view 订阅 LiveData 的改变且随时响应。这适用于连续不断的显示在一个屏幕的数据。
![LiveData](http://qiniu.picbed.dang8080.cn/20190228202711.png)
但是某些数据却更应该被消费一次，比如 Snackbar 消息，navigation 事件 或 dialog 触发器。
![LiveData once](http://qiniu.picbed.dang8080.cn/20190228202852.png)
与其试着通过扩展 Architecture Components 扩展或库解决这个问题，不如我们可以直面这是个设计缺陷。我们推荐你把你的事件看作是状态的一部分。本文我们将列举一些常见的错误和推荐的解决方案。

### ❌ Bad: 1. 对事件使用 LiveData

在 LiveData 对象内部直接持有 Snackbar 消息或 navigation 信号。原则上普通的 LiveData 对象可以这样使用，但实际上会暴露一些问题。
在 master/detail 架构的 app 中，如下是 maters 的 ViewModel

```kotlin
// 请不要对事件这样用
class ListViewModel : ViewModel {
  private val _navigateToDetails = MutableLiveData<Boolean>()
  val navigateToDetails : LiveData<Boolean>
      get() = _navigateToDetails

  fun userClicksOnButton() {
    _navigateToDetails.value = true
  }
}
```

在 View(activity/fragment) 中

```kotlin
myViewModel.navigateToDetails.observe(this,Observer {
  if (it) startActivity(DetailsActivity....)
})
```

此方案的不足在于 `_navigateToDetails`将会一直为 true,而且不可能回到首屏:

- 用户点击按钮启动 Details Activity
- 用户按返回按钮，回到主 Activity
- 当 activity 进入回退栈时 observers 失活，现在再次激活

从 ViewModel 中调用 navigation 且立即将其设为 false

```kotlin
fun userClicksOnButton() {
  _navigateToDetails.value = true
  _navigateToDetails.value = false
}
```

但是请注意： LiveData 保存数据但不会保证在接受到事件时发送任何数据。例如，当没有观察者活跃时更新值，那么一个新值将替换原来的值。同时，从不同线程设置属性将会导致竞争状态，此时仅能保证一个观察者被调用。

最主要的问题是，这个方案很难理解而且代码垃圾。所以我们如何保证在 navigation 事件发生时值重置？

### ❌Better: 2.使用 LiveData wrapper 事件，在观察者中重置属性.

```kotlin
listViewModel.navigateToDetails.observe(this,Observer {
  if (it) {
    myViewModel.navigateToDetailsHandled()
    startActivity(DetailsActivity...)
  }
})
```

```kotlin
class ListViewModel: ViewModel {
  private val _navigateToDetails = MutableLiveData<Boolean>()

  val navigateToDetails: LiveData<Boolean>
    get() = _navigateToDetails

  fun userClicksOnButton() {
    _navigateToDetails.value = true
  }

  fun navigateToDetailsHandled() {
    _navigateToDetails.value = false
  }
}
```

此方案的不足之处在于有些冗余代码

### ✅ ok：使用 SingleLiveEvent

SingleLiveEvent 只适用于部分场景。只发送和更新一次状态的 LiveData

```kotlin
class ListViewModel: ViewModel {
  private val _navigateToDetails = SingleLiveEvent<Any>()

  val navigateToDetails: LiveData<Any>
    get() = _navigateToDetails

  fun userClicksOnButton() {
    _navigateToDetails.call()
  }
}
```

```kotlin
myViewModel.navigateToDetails.observe(this, Observer {
    startActivity(DetailsActivity...)
})
```

```java
// SingleLiveEvent
public class SingleLiveEvent<T> extends MutableLiveData<T> {

    private static final String TAG = "SingleLiveEvent";

    private final AtomicBoolean mPending = new AtomicBoolean(false);

    @MainThread
    public void observe(LifecycleOwner owner, final Observer<T> observer) {

        if (hasActiveObservers()) {
            Log.w(TAG, "Multiple observers registered but only one will be notified of changes.");
        }

        // Observe the internal MutableLiveData
        super.observe(owner, new Observer<T>() {
            @Override
            public void onChanged(@Nullable T t) {
                if (mPending.compareAndSet(true, false)) {
                    observer.onChanged(t);
                }
            }
        });
    }

    @MainThread
    public void setValue(@Nullable T t) {
        mPending.set(true);
        super.setValue(t);
    }

    /**
     * Used for cases where T is Void, to make calls cleaner.
     */
    @MainThread
    public void call() {
        setValue(null);
    }
}

```

此方案的不足之处在于只有一个订阅者。如果你有多个观察者，那么只有一个被调用且不保证顺序。
![SingleLiveEvent](http://qiniu.picbed.dang8080.cn/20190303082724.png)

### ✅ 推荐：使用 Event Wrapper

```kotlin
open class Event<out T>(private val content: T) {
  val hasBeenHandled = false
    private set // 只读属性

  /**
  * 返回 content, 阻止其再次调用
  fun getContentIfNotHandled(): T? {
    return if (hasBeenHandled) {
        null
    } else {
        hasBeenHandled = true
        content
    }
  }

  fun peekContent(): T = content
}
```

```kotlin
class ListViewModel : ViewModel {
    private val _navigateToDetails = MutableLiveData<Event<String>>()

    val navigateToDetails : LiveData<Event<String>>
        get() = _navigateToDetails


    fun userClicksOnButton(itemId: String) {
        _navigateToDetails.value = Event(itemId)  // Trigger the event by setting a new Event as a new value
    }
}
```

```kotlin
class ListViewModel : ViewModel {
    private val _navigateToDetails = MutableLiveData<Event<String>>()

    val navigateToDetails : LiveData<Event<String>>
        get() = _navigateToDetails


    fun userClicksOnButton(itemId: String) {
        _navigateToDetails.value = Event(itemId)  // Trigger the event by setting a new Event as a new value
    }
}
```

此方案的优势是用户需要使用 `getContentIfNotHandled() 或 peekContent()`指定意图。此方法把事件抽象为 state 的一部分：变成仅表示是否被消费的消息。
![使用 Event wrapper,可以在单一用户事件上添加多个观察者](http://qiniu.picbed.dang8080.cn/20190303074902.png)

#### 结论

总之，把事件作为状态的一部分。
使用这个 EventObserver 在大量事件结束后移除它

```kotlin
class EventObserver<T>(private val onEventUnhandledContent: (T) -> Unit) : Observer<Event<T>> {
    override fun onChanged(event: Event<T>?) {
        event?.getContentIfNotHandled()?.let { value ->
            onEventUnhandledContent(value)
        }
    }
}
```

```kotlin
inline fun <T> LiveData<Event<T>>.observeEvent(owner: LifecycleOwner, crossinline onEventUnhandledContent: (T) -> Unit) {
    observe(owner, Observer { it?.getContentIfNotHandled()?.let(onEventUnhandledContent) })
}
```
