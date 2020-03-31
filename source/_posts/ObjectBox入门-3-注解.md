---
title: ObjectBox入门-3-注解
date: 2019-02-24 20:38:55
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
## Entity 注解

### entity 数据可访问

- ObjectBox 需要访问 entity 的属性(生成 Cursor 类).
  - 属性包内可见。kotlin 中使用 `JvmField`
  - 提供标准 `getters`
- 为了提升性能，请提供具有全部属性的构造方法

```java
@Entity
public class User {
    @Id private long id;
    private String name;
    @Transient private int tempUsageCount;
    public User(){/* 默认构造方法 */}
    public User(id,name){
        this.id = id;
        this.name = name;
    }
    // getters and setters for properties...
}
```

### entity 属性的注解

- `@NameInDb` 可以在数据库中为属性命名。
  - 应该使用 `@Uid` 注解来代替重命名属性和 entity
  - `@NameInDb` 仅支持内联常量来指定列名。
- `@Transient` 保证属性不被持久化，transient，static 修饰符也一样.

### 属性索引 @Index

- `@Index` 当前不支持 `byte[] float double`
- Index typs(String).
  - ObjectBox 2.0 引入了 index types.之前对每一个索引，使用属性的值来完成查询。
    现在 ObjectBox 可以使用 hash 来生成 index.
    由于 String 属性明显比标量值更占空间，ObjectBox 对 strings 使用默认的 index type 完成 hash.
    可以针对 String 类型的属性明确指定 index type 为基于值构建索引。
  ```java
  @Index( type = IndexType.VALUE)
  private String name;
  ```
  - 请注意：对于 String 类型的属性，基于值的索引可能比默认基于 hash 的索引更占空间,这种结论取决于该值的长度。
  - ObjectBox 支持以下索引属性:
    - 未指定或默认: 根据属性的类型决定(HASH for String,VALUE for others)
    - VALUE: 使用属性值生成索引。例如 String,可能更占空间
    - HASH: 使用属性值的 32 位 hash 生成索引。偶尔可能发生 hash 碰撞，但实际概率很小。通常比 HASH64 更佳，因为占空间小
    - HASH64: 使用属性值的长 hash 生成索引。比 HASH 占空间大，所以一般情况下不是首选.

### Unique 约束

如果 unique 约束的属性值冲突，`put()` 操作将被终止且抛出 `UniqueViolationException` 的异常.
Unique 基于 Index,所以可以同时给属性添加 @Index 注解。

### 关系
