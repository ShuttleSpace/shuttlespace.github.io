---
title: ObjectBox入门-7-kotlin支持
date: 2019-02-24 23:40:41
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
## Kotlin 支持

### kotlin Entity

- 在 kotlin 中，ID 属性应该这样定义 `@Id var id: Long = 0`.ID 必须是 var.

### 构造器

- ObjectBox 优先调用全参的构造方法。如果自定义属性或 transient 属性 或关联属性是构造方法的一部分参数，ObjectBox 将不会调用此构造方法.所以应该提供为这些参数提供默认值以确保无参构造方法存在。

```kotlin
@Entity
data class Note(
    @Id var id: Long = 0,
    val text: String = "",
    @Convert( converter = StringsConverter::class, dbType = String::class)
    val strings: List<String> = listOf()
)
```

### kotlin Entity 中定义关联属性

在 kotlin 中定义关联属性可能比较麻烦。但请注意：关联属性必须为 `var`. 否则 `initialization magic` 将不起作用.
通常可以使用 `lateinit` 修饰关联属性

```kotlin
@Entity
class Order {
    @Id var id: Long = 0
    lateinit var customer: ToOne<Customer>
}

@Entity
class Customer {
    @Id var id: Long = 0
    @Backlink( to = "customer")
    latelinit var orders: List<Order>
}
```

### kotlin 扩展函数

```groovy
dependencies {
    implementation "io.objectbox:objectbox-kotlin:$objectboxVersion"
}
```

kotlin

```kotlin
val box: Box<DataClassEntity> = store.boxFor()

val query = box.query {
    equal(property,value)
    order(property)
}

val query = box.query().inValues(property,array).build()

toMany.applyChangesToDb(resetFirst = true) { // 默认 false
    add(entity)
    removeById(id)
}
```
