---
title: ObjectBox高级-2-Object IDs
date: 2019-02-26 10:00:19
tags:
  - ObjectBox
  - 数据库
---

Object 必须具有一个类型为 `long` 的属性.当然可以使用它的包装类 `java.lang.Long`,但是不建议使用包装类.
其他类型的 ID ( UID 等)可以自由定义，查询等操作。

### news vs. persisted entities

当创建一个对象时，还没有存入，它们的 ID 是 0.一旦该对象存入，ObjectBox 将为该对象指定 ID.可以通过 `put()`返回值拿到该 ID.

所以在 ObjectBox 内部通常把 ID 作为一个状态指示器,如果为 0 表示新创建，不为 0 表示已经存储。关联特别依赖这个特性.

### 特殊的 Object IDs

Object IDs 可能是任意 `long` 值，除了以下两种:

- 0: 或者当类型为 `Long` 时为 null,被认为是新创建，还未存储。`put`这个对象总是会插入一个新对象，并指定一个未使用过的 ID.
- 0xFFFFFFFFFFFFFFFF (-1 in Java): ObjectBox 保留。

### ObjectBox 指定 ID

对于每一个新对象，ObjectBox 把比当前 box 中最大的 ID 值大的未使用的值指定给新对象的 ID.比如 box 中有一个 ID 为 1 和 ID 为 100 的对象，那么新创建对象的 ID 将为 101.

默认只有 ObjectBox 可以指定 ID(👇 介绍).如果试图自己存入一个 ID 比当前 ID 值最大的还大的对象，ObjectBox 将抛出错误。

### 手动指定 IDs

如果需要手动指定 ID,那么请添加如下注解:

```java
@Id(assignable = true)
long id;
```

这将会允许存入任意值 ID 的对象。当然设置 ID 为 0 时，ObjectBox 将制定新 ID

> 自定义 ID 会打破自动状态指示监视(new vs. persisted). 所以应该立即存入该自定义 ID 对象，可能还得手动绑定 box，特别在关联状况下.

### ID 的 String 别名 (还在路上...)

查看特性实现进度[String ID alias](https://github.com/objectbox/objectbox-java/issues/167)
