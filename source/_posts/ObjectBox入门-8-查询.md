---
title: ObjectBox入门-8-查询
date: 2019-02-24 23:58:51
tags:
  - ObjectBox
  - 数据库
---

## Queries

- 使用 QueryBuilder 定义查询标准，Query 类运行查询并返回匹配结果

### QueryBuilder

- QueryBuilder 使用编译生成的元信息类来指定要匹配的属性值。

```java
List<user> joes = userBox.query().equal(User_.firstName,"Joe").build().find();

QueryBuilder<User> builder = userBox.query();
builder.equal(User_.firstName,"Joe")
        .greater(User_.yearOfBirth,1970)
        .startsWith(User_.lastName,"O");
List<User> youngJoes = builder.build().find();
```

### 边界条件

- `equal(),notEqual(),greater(),less()`
- `isNull(),notNull()`
- `between()`
- `in(),notIn()`
- `startsWith(),endsWith(),contains()`
- `and(),or()`

### 排序

```java
userBox.query().equal(User_.firstName,"Joe")
        .order(User_.lastName) // 升序排列,忽略大小写
        .find();

userBox.query().equal(User_.firstName,"Joe")
        .order(User_.lastName,QueryBuilder.DESCENDING | QueryBuilder.CASE_SENSITIVE)
        .find();
```

### Query

```java
Query<User> query = builder. build();
// 返回所有匹配的对象
List<User> joes = query.find();
// 返回第一个匹配的对象，如果不存在返回 null
User joe = query.findFirst();
// 返回唯一一个匹配的对象，如果不存在返回 null,如果有多个值抛出异常
User joe = query.findUnique();
```

- 如果是不断的执行 Query,那么应该缓存 Query 对象，重复使用。为了复用 Query 对象，可以改变它的属性值，或查询参数，或添加的各种边界条件。
  ```java
  // 假设已经构建了一个 Query 对象，但是为了后面复用，此处 equal 边界条件的值设置为 ""
  Query<User> query = userBox.query().equal(User_.firstName,"").build();
  // 接下来可以根据具体情况改变参数值
  List<User> joes = query.setParameter(User_.firstName,"Joe").find();
  List<User> jakes = query.setParameter(User_.firstName,"Jake").find();
  ```
- 如果是多个边界条件，可以在边界条件后给每一个参数设置一个别名

```java
// 给 equal() 查询参数设置 name 别名
Query<User> query = userBox.query().equal(User_.firstName,"").parameterAlias("name");
// 然后可以传入键值对来代替属性
List<User> joes = query.setParameter("name","Joe").find();
```

### Limit,Offset,Pagination

```java
Query<User> query = userBox.query().equal(User_.firstName,"Joe").build();
List<User> joes = query.find(/*offset*/10,/*limit*/5,/*results*/);
```

### 延迟加载

- `findLazy(),findLazyCached()` 返回 `LazyList` 查询结果。
- `LazyList` 是线程安全的，不可修改的只读 list,只有在访问时才会加载数据。缓存 LazyList 可以保留之前访问过的数据以避免重复加载。

### 删除

`query.remove()` 删除所有匹配的结果

### 属性查询

如果只想返回某个指定属性的值而不是匹配的全部对象列表，那么请使用 `PropertyQuery`.在构建 query 后调用 `property(Property)` 即可

```java
String[] emails = userBox.query().build()
        .property(User_.mail)
        .findStrings();
```

- `findString()` 返回第一条结果，`findStrings()` 返回所有结果
- 返回的是没有排序的结果，即使在构建 query 时指定了排序规则.

### 处理 null 值

默认不返回 null 值。如果属性为 null，可以指定一个替代返回值

```java
// 如果 email 为 null,返回 unknown
String[] emails = userBox.query()
        .property(UserBox_.mail)
        .nullValue("unknown")
        .findStrings();
```

### distinct，unique

```java
// 返回 ‘joe'
String[] names = userBox.query()
        .property(User_.firstName)
        .distinct()
        .findStrings();
```

默认 strings 忽略大小写。当然可以定制

```java
// 返回 'joe' 'Joe' 'JOE'
String[] names = userBox.query()
        .property(User_.firstName)
        .distinct(StringOrder.CASE_SENSITIVE)
        .findStrings();
```

只查询一个值，没有则抛出异常

```java
String[] names = userBox.query().build().equal(User_.isAdmin, true)
    .property(User_.firstName)
    .unique()
    .findStrings();
```

- distinct 和 unique 可以组合

### 统计

属性查询同时提供了统计函数。

- `min(),minDouble()`
- `max(),maxDouble()`
- `sum,sumDouble()`: sum() 可能溢出并抛出异常
- `avg()`: 返回 double
- `count()`: 比查询到对象列表然后求列表长度要快。可以和 distinct() 组合

### 为关联属性添加查询条件

创建关联属性后，可能想为只存在于关联 entity 的属性添加查询条件。SQL 中使用 JOIN.

```kotlin
@Entity
class Person {
    @Id var id: Long = 0
    var name: String? = null
    lateinit var address: ToManay<Address>
}

@Entity
class Address {
    @Id var id: Long = 0
    var street: String? = null
    var zip: String? = null
}
```

查询住在指定街道(Address)的 xxx(Person)。可以使用`link(RelationInfo`

```java
// 获取所有名为 elmo 的对象
val builder = box.query().equal(Person_.name,"Elmo");
// 住在 Sesame 街道
builder.link(Person_.address).equal(Address_.street,"Sesame Street");
val elmosOnSesameStreet = builder.build().find()
```

如果想获取到 Address 列表呢？那么可以在 Address 中添加 @Backlint 注解

```kotlin
@Entity
class Address {
    // ...
    @Backlint(to = "addresses")
    lateinit var persons: ToMany<Person>
}
// 获取所有 Sesame 街道对象
val builder = box.query().equal(Address_.street,"Sesame Street");
// 名为 elmo
builder.link(Address_.persons).equal(Person_.name,"Elmo");
val sesameStreetsWithElmo = builder.build().find();
```

当然，也可以不用修改 Address,使用 `backlink(RelationInfo)` 即可实现查询

```kotlin
val builder = box.query().equal(Address_.street,"Sesame Street");
builder.backlink(Person_.address).equal(Person_.name,"Elmo");
val sesameStreetWithElmos = builder.build().find();
```

### 关系属性的激进加载

默认关系属性是懒加载的。第一次访问 ToOne ,ToMany 属性时会到数据库中查询数据，然后都会使用缓存过的数据。

```java
val customers = customerBox.query().build().find()
customers[0].orders[0]; // 第一次访问触发数据库查询
```

如果想在查询结果返回时实现预读取 ToOne,ToMany 数据,请使用 QueryBuilder.eager

```java
 val customers = customerBox.query()
            .eager(Customer_.orders)
            .build()
            .find();
```

eager 加载仅支持一层深度。如果有嵌套的关联层级，可以使用下面的 query filter 实现。

### query filters

应用于复杂的边界条件，QueryBuilder 类不能实现。使用如下规则将会非常高效：

- 使用标准的数据库边界条件缩小目标范围。(使用 QueryBuilder 获取目标)
- 然后使用 QueryFilter 过滤
  QueryFilter 一次检查一个目标对象，符合返回 true

```java
// 缩小范围
songBox.query().equal(Song_.bandId,bandId)
        .filter((song) -> {
            return song.starCount * 2 > song.downloads;
        });
```

关注一下性能:

- ObjectBox 创建对象非常快
- 虚拟机会回收短期对象。
  此处回收将比创建快，所以性能不是问题。

#### query filters 和 ToMany

ToMany 提供了很多函数可以方便的转为 query filters:

- `hasA`
- `hasAll`
- `getById`
