---
title: GraphQL-Scalars
date: 2019-05-05 22:42:08
tags:
---
scalars
<!-- more -->
## graphql 中的常量

### scalars

graphql 类型系统的叶子节点被称为 scalars.一旦到达了 scalar 类型则无法在沿着类型结构继续向下了.scalar 类型是指不可再分割的值.
graphql 规范明确要求所有的语言实现必须具有以下 scalar 类型.

- String 即 `GraphQLString`- 一个 UTF-8 字符串序列.
- Boolean 即 `GraphQLBoolean`- true or false.
- Int 即 `GraphQLInt`- 有符号的 32 整型数.
- Float 即 `GraphQLFloat`- 有符号的双精度浮点数.
- ID 即 `GraphQLID`- 类似于 String 的唯一标识符.定义一个 ID 标识符即表示该属性不是人类可识别的用途.
  graphql-java 为 java 系统添加了以下有用的 scalar 类型.
- Long 即 `GraphQLLong`- 基于 java.lang.Long 的 scalar.
- Short 即 `GraphQLShort`- 基于 java.lang.Short 的 scalar.
- Byte 即 `GraphQLByte`- 基于 java.lang.Byte 的 scalar.
- BigDecimal 即 `GraphQLBigDicimal` 基于 java.math.BigDecimal 的 scalar.
- BigInteger 即 `GrapQLBigInteger` 基于 java.math.BigInteger 的 scalar.

`graphql.Scalars`类包含了提供 scalar 类型的单例实例.

### 自定义 scalars

你可以实现自定义 scalar.在运行时你需要完成类型强制转换,后面会解释.假设我们需要一个 email 的 scalar 类型.它把 email 地址作为输入输出.
我们将创建一个如下的 `graphql.schema.GraphQLScalarType` 单例实例.

```java
public static final GraphQLScalarType EMAIL = new GraphQLScalarType("email","A cusom scalar that handles emails",new Coercing() {
    @Override
    public Object serialize(Object dataFetcehrResult) {
        return serilizeEmail(dataFetcherResult);
    }

    @Override
    public Object parseValue(Object input) {
        return parseEmailFromVariable(input);
    }

    @Override
    public Object parseLiteral(Object input) {
        return parseEmailFromAstLiteral(input);
    }
});
```

### 强制类型转换

自定义 scalar 实现的真正作用点在 `graphql.schema.Coercing`实现.有 3 个函数需要实现

- `parseValue`- 接收一个输入变量,转换为 java 运行时实现.
- `parseLiteral`-接收一个 AST 字符 `graphql.language.Value` 作为输入,转换为 java 运行时实现.
- `serialize`-接收一个 Java 对象,最终转为 scalar 输出类型.
  所以你自定义的 scalar 实现需要处理 2 中类型的输入(parseValue/parseLiteral)和 1 中输出(serialize).
  如下查询,使用了变量,AST 字符然后输出我们需要的 scalar 类型 email.

```graphql
mutation Contact($mainContact: Email!) {
	makeContact(
		mainContactEmail: $mainContact
		backupContactEmial: "backup@company.com"
	) {
		id
		mainContactEmail
	}
}
```

我们的自定义 email scalar 类型将

- 调用 `parseValue` 将 `$mainContact`变量转为运行时对象.
- 调用 `parseLiteral` 将 AST `graphql.language.StringValue` "backup@company.com" 转换为运行时对象.
- 调用 `serialize` 将 mainContactEmial 运行时实现转为输出对象形式.

### 输入输出校验

例如我们的 email scalar 将会校验输入输出是否是真是的 email 地址.
`graphql.schema.Coercing` 协议如下:

- `serialize` 只允许抛出 `graphql.schema.CoercingSerializeException`.这表明值无法被序列化为合适的形式.决不允许指定其他运行时异常以取得普通的 graphql 校验行为.必须返回一个非 `null` 值.
- `parseValue` 只允许抛出 `graphql.schema.CoercingParseValueException`.这表明值无法被作为输入解析为合适的形式..决不允许指定其他运行时异常以取得普通的 graphql 校验行为.必须返回一个非 `null` 值.
- `parseLiteral` 只允许抛出 `graphql.schema.CoercingParseLiterialException`.这表明 AST 值无法被作为输入解析为合适的形式..决不允许指定其他运行时异常以取得普通的 graphql 校验行为.
  有的人尝试依赖运行时异常校验以期获取普通的 graphql 错误.这是行不通的.必须遵照 `Coercing` 方法协议使 graphql-java 引擎按照 grapqhl 的 scalar 类型规范运行.

### 示例实现

下面是一个简单的 email scalar 类型实现,展示了如何通过继承 `Coercing` 实现一个 scalar.

```java
public static class EmailScalar {
    public static final GraphQLScalarType EMAIL = new GraphQLScalarType("email","A custom scalar that handles emails",new Coercing() {
        @Override
        public Object serialize(Object dataFetcherResult) {
            return serializeEmail(dataFetcherResult);
        }
        @Override
        public Object parseValue(Object input) {
            return parseEmailFromVariable(input);
        }
        @Override
        public Object parseLiterial(Object input) {
            return parseEmialFromAstLiterial(input);
        }
    });

    private static boolean looksLikeAnEmailAddress(String possibleEmailValue) {
        return Pattern.matches("[A-Za-z0-9]@[.*]",possibleEmailValue);
    }
    private static Object serialzeEmail(Object dataFetcherResult) {
        String possibleEmailValue = String.valueOf(dataFetcherResult);
        if (looksLikeAnEmailAddress(possibleEmailValue)) {
            return possibleEmailValue;
        } else {
            throw new CoercingSerializeException("Unable to serialize" + possibleEmailValue + " as an email address");
        }
    }
    private static Object parseEmailFromVariable(Object input) {
        if (input instanceof String) {
            String possibleEmailValue = input.toString();
            if (looksLikeAnEmailAddress(possibleEmailValue)) {
                return possibleEmailValue;
            }
        }
        throw new CoercingParseValueException("Unable to parse variable value " + input + " as an email address");
    }
    private static Object parseEmailFromAstLiterial(Object input) {
        if (input instanceof StringValue) {
            String possibleEmailValue = ((StringValue)input).getValue();
            if (looksLikeAnEmailAddress(possibleEmailValue)) {
                return possibleEmailValue;
            }
        }
        throw new CoercingParseLiterialException("Unable to parse variable value " + input + " as an email address");
    }
    }
}
```
