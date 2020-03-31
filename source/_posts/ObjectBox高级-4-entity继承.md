---
title: ObjectBox高级-4-entity继承
date: 2019-02-26 12:15:42
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
ObjectBox 允许子类继承 entity 父类持久化的属性。同样也支持继承非 entity 类。1.4+ 也支持多继承.
对于父类来说可以使用 @BaseEntity.

- 无注解: 类本身及其属性不需要持久化
- @BaseEntity: 属性在子类中持久化，类本身不持久化
- @Entity: 属性在子类中持久化，类本身也持久化

```java
// base class:
@BaseEntity
public abstract class Base {

    @Id long id;
    String baseString;

    public Base() {
    }

    public Base(long id, String baseString) {
        this.id = id;
        this.baseString = baseString;
    }
}

// sub class:
@Entity
public class Sub extends Base {

    String subString;

    public Sub() {
    }

    public Sub(long id, String baseString, String subString) {
        super(id, baseString);
        this.subString = subString;
    }
}
```

```java
// entities inherit properties from entities
@Entity
public class SubSub extends Sub {

    String subSubString;

    public SubSub() {
    }

    public SubSub(long id, String baseString, String subString, String subSubString) {
        super(id, baseString, subString);
        this.subSubString = subSubString;
    }
}
```

#### 使用前注意

- 在继承链中可能存在由 @BaseEntity 注解的类，它们的属性将被忽略，不会成为 entity model 的一部分
- 不推荐继承一个仅含有 ID 属性的 base entity 类.
- 某些情况下可以使用 interface 更简单明了

### 限制

- @BaseEntity 注解的父类不能成为 library 的一部分。
- 没有多态查询(例如查询父类却希望得到子类)
- 当前无论是 @Entity 还是 @BaseEntity 注解的父类，都不能使用 ToOne ToMany 关联
