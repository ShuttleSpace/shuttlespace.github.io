---
title: ObjectBox高级-5-更新数据模型
date: 2019-02-26 13:52:22
tags:
  - ObjectBox
  - 数据库
---

ObjectBox 大多数情况下自动管理数据模型.当添加/删除 entities 或属性时，ObjectBox 自动作出响应。
对于其他改变如 保留或改变类型，ObjectBox 需要额外信息。

### UIDs

ObjectBox 通过 unique IDs(UIDs) 来追踪 entities 和属性的变化。所有的 UIDs 都存储在 module-name/objectbox-models/default.json 中,可以使用版本控制软件(git)进行管理。

简单来说: 为了使 UID 相关的改变生效，在这些 entity 或 属性上放置 @Uid 然后编译，在获取进一步提示。

### 重命名 entities 和 属性

需要 UID 注解的原因是: 如果仅仅改变 entities 和属性的名字，ObjectBox 只会意识到 old entity 不见了，而创建了新的 entity.
所以告诉 ObjectBox 重命名 entity 和数据，而不是丢弃它们.它们是相同的一个 entity。实际上是在内部给 entity 绑定一个 UID.属性也一样.

### 实践

第一步: 为想要重命名的 entity/属性添加空的 @Uid 注解

```java
@Entity
@Uid
public class MyName { ... }
```

第二步: 编译项目，然后会输出错误信息：给出当前 entity/属性的 UID

```java
error: [ObjectBox] UID operations for entity "MyName":
  [Rename] apply the current UID using @Uid(6645479796472661392L) -
  [Change/reset] apply a new UID using @Uid(4385203238808477712L)
```

第三部: 把上面的 UID 复制到 @Uid() 里

```java
@Entity
@Uid(6645479796472661392L)
public class MyName { ... }
```

第四步: 重命名吧

```java
@Entity
@Uid(6645479796472661392L)
public class MyNewName { ... }
```

> 或者可以在 default.json 中找到 UID,然后直接使用到 @Uid() 上，重命名即可

### 修改属性类型

想要修改属性类型，那么 ObjectBox 内部得创建一个新类型。因为 ObjectBox 不会迁移数据。

- 重命名属性类型：这样该属性就会被认为是新属性(如果该属性已经有 @Uid 注解了，则行不通)

```java
// old:
String year;
// new:
int yearInt;
```

- 告诉 ObjectBox 对新属性使用新 UID.

#### 实践一下

第一步：对想修改类型的属性添加 @Uid 注解

```java
@Uid
String year;
```

第二步: 编译获取错误信息

```java
error: [ObjectBox] UID operations for property "MyEntity.year":
  [Rename] apply the current UID using @Uid(6707341922395832766L) -
  [Change/reset] apply a new UID using @Uid(9204131405652381067L)
```

第三步：为该属性应用新 @Uid,并修改类型.

```java
@Uid(9204131405652381067L)
int year;
```
