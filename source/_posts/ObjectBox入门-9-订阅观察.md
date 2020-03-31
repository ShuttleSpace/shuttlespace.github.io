---
title: ObjectBox入门-9-订阅观察
date: 2019-02-25 11:46:36
tags:
  - ObjectBox
  - 数据库
description: Data Observers, Reactive Extensions
---
objectbox

<!-- more -->
## Data Observers, Reactive Extensions

订阅观察模式，Rx 支持

```java
Query<Task> query = taskBox.query().equal(Task_.complete,false).build();
query.subscribe(subscriptions)
    .on(AndroidScheduler.mainThread())
    .observer(data -> updateUi(data));
```

### Data Observers

当数据改变时，ObjectBox 会通知所有的订阅者.他们可以订阅确定的数据类型(通过 BoxStore)或查询结果集。实现 `io.objectbox.reactive.DataObserver` 即可创建观察者

```java
interface DataObserver<T> {
    void onData(T data);
}
| onData() 异步调用，不用关心线程
```

#### 订阅普通改变

```java
DataObserver<Class<Task>> taskObserver = new DataObserver<Class<Task>>() {
    @Override
    public void onData(Class<Note> data){}
};
boxStore.subscribe(Task.class).observer(taskObserver);
| subscribe() 会接受所有可用的对象类型改变通知。
```

#### 订阅查询

```java
Query<Task> query = taskBox.query().equal(Task_.completed, false).build();
subscription = query.subscribe().observer(data -> updateUi(data));
```

#### 取消订阅

当调用 observer() 时，返回 `io.objectbox.reactive.DataSubscription`

```java
interface DataSubscription {
    void cancel();
    boolean isCanceled();
}
```

```java
DataSubscription subscription = boxStore.subscribe().observer(myObserver);

// At some later point:
subscription.cancel();
```

通常情况下建议使用 DataSubscriptionList

```java
private DataSubscriptionList subscriptions = new DataSubscriptionList();

protected void onStart() {
  super.onStart();
  Query<X> query = box.query()... .build();
  query.subscribe(subscriptions)... .observe(...);
}

protected void onStop() {
  super.onStop();
  subscriptions.cancel();
}
```

#### 订阅，事务

当事务提交时发出订阅通知。单独调用`box.put(),remove()` ，默认的事务会开启提交。例如如下将触发两次 User.class 通知；

```java
box.put(firendUser);
box.put(myUser);
```

使用 `runInTx(),callInTx()` 可以将多个操作在同一个十五中提交.如上可以修改为:

```java
box.put(friendUser,myUser);
```

#### 响应式扩展

##### 线程切换

```java
Query<Task> query = taskBox.query().equal(Task_.complete, false).build();
query.subscribe().on(AndroidScheduler.mainThread()).observer(data -> updateUi(data));
```

当然可以使用自定义 Looper 创建 AndroidScheduler,或者实现 `io.objectbox.reactive.Scheduler`

- 查询在后台线程执行
- DataTransformer 运行在后台线程
- DataObserver 和 ErrorObserver 运行在后台线程，除非通过 on() 指定

##### 数据转换

如何订阅实际的对象数量:

```java
boxStore.subscribe()
    .transform(clazz -> return boxStore.boxFor(clazz).count())
    .observer(count -> updateCount(count));
```

##### 异常订阅

transformer 可能抛出各种异常，DataObserver 可能抛出 RuntimeException.

```java
public interface ErrorObserver {
    void onError(Throwable th);
}
```

在 subscribe() 后调用 onError() 即可.

##### 一次通知 vs. 改变即通知

当订阅 query 后，DataObserver 具有如下行为：

- 初始化查询结果(就在订阅后)
- 更新查询结果(在数据改变后)

有时候仅对其中一种行为感兴趣.single() 和 onlyChange() 应运而生(在 subscribe() 后调用)
single() 只响应一次通知即自动取消。

##### 弱引用

一般情况下，为了避免内存泄露，通常尽可能在不需要的时候取消订阅。当然，你不在乎的话，在 subscribe() 后调用 weak() 也可以.

#### ObjectBox RxJava 扩展库

```groovy
implementation "io.objectbox:objectbox-rxjava:$objectboxVersion"
```
