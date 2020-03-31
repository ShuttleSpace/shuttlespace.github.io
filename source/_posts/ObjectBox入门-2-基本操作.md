---
title: ObjectBox入门-2-基本操作
date: 2019-02-24 17:36:15
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
### Entity

在一个类中至少需要 `@Entity` 和 `@Id` 两个注解才能定义一个 ObjectBox model.例如:

```java
// User.java
@Entity
public class User {
    @Id public long id;
    public String name;
}
```

然后 make 就可生成 model.

| @Id 的类型必须为 long.
| 如果 entity 发生了很大的变动（如移动类或修改注解）,必须 rebuild 项目以便 ObjectBox 生成的代码得到更新.

### 核心类

- MyObjectBox: 基于 entity 类生成。提供 `builder` 配置 BoxStore.
- BoxStore: ObjectBox 的入口。操作数据库，管理 Boxes 的工具.
- Box: 对 entity 保存和查询。每一个 entity 都有一个对应的 Box（由 BoxStore 提供).

### 核心初始化

实例化 BoxStore 的最好时机是在 app 启动时。推荐在 Application 类的 onCreate 方法中进行.

```java
public class App extends Application {
    private BoxStore boxStore;

    @Override
    public void onCreate() {
        super.onCreate();
        boxStore = MyObjectBox.builder().androidContext(this).build();
    }

    public BoxStore getBoxStore() { return boxStore; }
}
// 然后在 app 生命周期内就可以使用了
notesBox = ((App) getApplicationi()).getBoxStore().boxFor(User.class);
```

### Box 基本操作

- put: 存入一个对象，可能会覆盖具有相同 ID 的对象。即使用 `put` 插入或更新对象。返回 ID。
- get,getAll: 提供一个对象的 ID，可快速的通过 `get`获取它。`getAll` 获取指定的所有的对象。
- remove,removeAll: 从 box 中删除一个对象。`removeAll` 删除指定的所有对象.
- count: 返回该 box 存储的对象数量.
- query: 返回一个 `query builder`.

### Object IDs

- Entity 必须具有一个类型为 `long`,由 @Id 注解属性。当然可以使用可空的 `java.lang.Long`类型，但不推荐。
  如果需要使用另外一种类型的 ID(服务器返回的 String 类型的 UID),把它作为普通属性即可，然后可以通过此 ID 查询.

  ```java
  @Entity class StringIdEntity {
      @Id priavte long id;
      private String uid;
  }

  StringIdEntity entity = box.query().equal(StringIdEntity_.uid,uid).findUnique();
  ```

- 指定 ID
  ObjectBox 默认会为新对象指定 IDs.ID 自增.
  ```java
  User user = new User();
  // user.id == 0
  box.put(user);
  // user.id != 0
  long id = user.id
  ```
  如果插入的对象的 ID 比 box 里的 ID 最大值还大，ObjectBox 将抛出错误.
- 保留 Object IDs
  Object IDs 不能：
  -- 0,null(使用 java.lang.Long)。
  -- 0xFFFFFFFFFFFFFFFF（java 中的 -1）:内部保留

### 事务

- `put` 运行在隐式事务中
- 优先使用 `put` 批量操作列表 （`put(entities)`）
- 如果在循环中操作大量数据，考虑明确使用事务，如`runInTx()`
