---
title: ObjectBox高级-3-自定义类型
date: 2019-02-26 10:22:46
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
ObjectBox 支持以下类型（Java）:

```java
boolean, Boolean
int, Integer
short, Short
long, Long
float, Float
double, Double
byte, Byte
char, Character
byte[]
String
Date
```

### 转换器注解和属性转换

使用 @Convert 注解将其他类型属性转为内置属性。此处需要提供 PropertyConverter 实现。

```java
// enum 转为 Integer
@Entity
public class User {
    @Id
    private Long id;

    @Convert(converter = RoleConverter.class, dbType = Integer.class)
    private Role role;

    public enum Role {
        DEFAULT(0), AUTHOR(1), ADMIN(2);

        final int id;

        Role(int id) {
            this.id = id;
        }
    }

    public static class RoleConverter implements PropertyConverter<Role, Integer>; {
        @Override
        public Role convertToEntityProperty(Integer databaseValue) {
            if (databaseValue == null) {
                return null;
            }
            for (Role role : Role.values()) {
                if (role.id == databaseValue) {
                    return role;
                }
            }
            return Role.DEFAULT;
        }

        @Override
        public Integer convertToDatabaseValue(Role entityProperty) {
            return entityProperty == null ? null : entityProperty.id;
        }
    }
}
```

### more

- 如果是在 entity 类中定义自定义转换器，那么该转换器应该为 static.
- 别忘记正确处理 null,通常如果 input 是 null，也应返回 null.
- 推荐使用基本数据类型，更易转换.
- 绝对不能在转换器中调用数据库(Box,BoxStore),转换器方法在事务中调用，例如读取或写入对象到 box 中将会失败。
- 为提高性能，ObjectBox 使用了对所有的转换器使用了唯一一个实例。请保证除默认无参构造方法外没有自定义其他构造方法。同时请保证线程安全，应为在 multiple entities 中可能涉及到并发.

### List/Array 类型

可以使用转换器转换 List 类型。例如把 List<String> 转为一条 String 的 JSON 数组.
当前不支持 Array 转换器.查看特性实现进度[Array](https://github.com/objectbox/objectbox-java/issues/42)

### Enums

最佳实践:

- 不要持久化 enum 的 ordinal 或 name: 二者都不稳定，且在下次你修改 enum 定义时会改变
- 使用稳定的 ids: 在 enum 中定义自定义属性(integer,string) 都可以保证稳定。使用该特性作为你的持久化映射.
- 准备好应对未知: 定义一个 UNKNOWN 的 enmu 值。可以应对 null 或 unknown 值的情况。例如可以确保已经被移除的 enum 值不会导致 App 崩溃.

### 查询时的自定义类型

`QueryBuilder` 是不关心自定类型的。请使用内置类型查询。
