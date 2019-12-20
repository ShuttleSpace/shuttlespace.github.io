---
title: GraphQL-Execution
date: 2019-05-04 21:25:19
tags:
---

## Execution

### Queries

对 schema 执行 query,使用合适的参数构建一个新的 GraphQL 对象,然后调用`execute()`.
query 的结果是包含查询数据或者（并且）一系列错误的`ExecutionResult` 对象.

```java
GraphQLSchema schema = GraphQLSchema.newSchema().query(queryType).build();
GraphQL graphQl = GraphQL.newGraphQL(schema).build();
ExecutionInput executionInput = ExecutionInput.newExecutionInput().query("query { hero { name }}");
ExectionResult executionResult = graphQl.execute(executionInput);
Object data = executionResult.getData();
List<GraphQLError> errors = executionResult.getErrors();
```

更多复杂的查询示例请参考[StarWars query tests](https://github.com/graphql-java/graphql-java/blob/master/src/test/groovy/graphql/StarWarsQueryTest.groovy);

### Data Fetchers

每个 graphql 属性类型都有一个 `graphql.schema.DataFetcher` 与之关联.其他 graphql 实现通常把这个类型成为 `resolvers`.
通常可以使用`graphql.schema.PropertyDataFetcher`来检查 提供属性值的 Java POJO 对象.如果某个属性未指定 data fetcher,默认会使用这个.
然而你可能需要使用自定义的 data fetcehr 获取你的顶级域对象.可能涉及到数据库调用或通过 HTTP 请求其他系统.
`graphql-java`不关心你是如何获取你的域对象,这是你需要关心的地方.同时也不关心用户访问数据授权.这些都应该放到你自己的逻辑处理层.
data fetcher 示例如下:

```java
DataFetcher userDataFetcher = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        return fetchUserFromDatabase(environment.getArgument("userId"));
    }
};
```

每个 `DataFetcher`都会传递一个 `graphql.schema.DataFetchingEnvironment` 对象(包含了将要获取的属性,获取该属性所需提供的参数和其他信息如属性的父对象,query 根对象或 query 上下文对象).
上例中,`execution`将会在 data fetcher 返回结果后才继续执行.可以通过返回`CompletionStage` 对象使 `DataFetcher` 异步执行,详情请继续阅读.

### 当获取数据时发生异常

如果在 data fetcher 调用中发生异常,那么默认执行策略将生成`graphql.ExceptionWhileDataFetching` 错误,然后添加到结果中的错误集中.切记 graphql 允许带错误的部分结果.
下面是标准的行为.

```java
public class SimpleDataFetcherExceptionHandler implements DataFetcherExceptionhandler {
    private static final Logger log = LoggerFactory.getLogger(SimpleDataFetcherExceptionHandler.class);

    @Override
    public void accept(DataFetcherExceptionHandlerParameters handlerParameters) {
        Throwable exception = handlerParameters.getException();
        SourceLocation sourceLocation = handlerParameters.getField().getSourceLocation();
        ExecutionPath path = handlerParameters.getPath();

        ExceptionWhileDataFetching error = new ExceptionWhileDataFetching(path,exception,sourceLocation);
        handlerParameters.getExecutionContext().addError(error);
        log.warn(error.getMessage(),exception);
    }
}
```

如果你抛出的是`GraphqlError`,那么它会从 exception 中转换 message 和自定义扩展属性到 `ExceptionWhileDataFetching`对象.此处允许你向调用者返回自定义的属性到 graphql error.
例如想象你的 data fetcher 将抛出这个异常.`foo` 和 `fizz` 属性将被添加到返回的 graphql error 中.

```java
class CustomRuntimeException extends RuntimeException implements GrapQLError {
    @Override
    public Map<String,Object> getExtension() {
        Map<String,Object> customAttributes = new LinkedHashMap<>();
        customAttributes.put("foo","bar");
        cutomAttributes.put("fizz","whizz");
        return customAttributes;
    }

    @Override
    public List<SourceLocation> getLocation() {
        return null;
    }

    @Override
    public ErrorType getErrorType() {
        return ErrorType.DataFetchingException;
    }
}
```

你可以通过创建自己的 `graphql.execution.DataFetcherExceptionHandler`异常处理代码改变此默认行为,给出你自己的执行策略.
例如上面的代码记录了基础异常和堆栈跟踪.有的人可能不喜欢在输出错误列表中看到这些.所以你可以使用这个机制改变这个行为.

```java
DataFetcherExceptionHandler handler = new DataFetcherExceptionHandler() {
    @Override
    public void accept(DataFetcherExceptionHandlerParameters handlerParameters) {

    }
};
ExecutionStrategy executionStrategy = new AsyncExecutionStrategy(handler);
```

### 返回值和错误

在`DataFetcher`实现中通过直接或者使用 `CompletableFuture` 实例包装异步执行返回 `graphql.execution.DataFetcherResult` 来实现同时返回数据和多个错误.当你的`DataFetcher` 需要从多个数据源或其他 GraphQL 资源获取数据时特别有用.
在这个 🌰 中,`DataFetcher` 从另一个 GraphQL 资源中获取 user 同时返回数据和错误.

```java
DataFetcher userDataFetcher = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        Map response = fetchUserFromRemoteGraphQLResource(environment.getArgument("userID"));
        List<GralhQLError> errors = response.get("errors)
                                            .stream()
                                            .map(MyMapGraphQLError::new)
                                            .collect(Collections.toList());
        return new DataFetcherResult(response.get("data"),errors);
    }
}
```

### 将结果序列化为 JSON

调用 graphql 最常见的方法是通过 HTTP,返回 JSON 响应.所以你需要将 `graphql.ExecutionResult` 转为 JSON.
最常用的实现是使用 Jackson 或 GSON 这样的 JSON 序列化库.然而它们解析数据的方式有它们自己的一套方式.例如 `nulls`对 graphql 结果是很重要的,所以你必须在设置 json mapper 时包含它.
为了保证你获取的 JSON 结果 100% 符合 graphql 的需求,你应该对结果调用`toSpecification`,然后将其作为 JSON 返回.
这将会确保返回的结果符合[规范](http://facebook.github.io/graphql/#sec-Response).

```java
ExecutionResult executionResult = graphQL.execute(executinInput);
Map<String,Object> toSpecificationResult = executionResult.toSpecification();
sendAsJson(toSpecificationResult);
```

### Mutations

[在这儿](http://graphql.org/learn/queries/#mutations)学习 mutations.
本质上你需要定义一个接收参数作为输入的 `GraphQLObjectType` .这些参数你可以通过 data fetcher 调用修改你的数据存储.

```graphql
mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
	createReview(episode: $ep, review: $review) {
		stars
		commentary
	}
}
```

在执行 mutation 操作中需要传递参数,本例中是 `$ep` 和 `$review` 参数.
你可以像这样创建类型处理 mutation 操作.

```java
GraphQLInputObjectType episodeType = newInputObject()
                .name("Episode")
                .field(newInputObjectField()
                        .name("episodeNumber")
                        .type(Scalars.GraphQLInt))
                .build();

GraphQLInputObjectType reviewInputType = newInputObject()
        .name("ReviewInput")
        .field(newInputObjectField()
                .name("stars")
                .type(Scalars.GraphQLString)
                .name("commentary")
                .type(Scalars.GraphQLString))
        .build();

GraphQLObjectType reviewType = newObject()
        .name("Review")
        .field(newFieldDefinition()
                .name("stars")
                .type(GraphQLString))
        .field(newFieldDefinition()
                .name("commentary")
                .type(GraphQLString))
        .build();

GraphQLObjectType createReviewForEpisodeMutation = newObject()
        .name("CreateReviewForEpisodeMutation")
        .field(newFieldDefinition()
                .name("createReview")
                .type(reviewType)
                .argument(newArgument()
                        .name("episode")
                        .type(episodeType)
                )
                .argument(newArgument()
                        .name("review")
                        .type(reviewInputType)
                )
        )
        .build();

GraphQLCodeRegistry codeRegistry = newCodeRegistry()
        .dataFetcher(
                coordinates("CreateReviewForEpisodeMutation", "createReview"),
                mutationDataFetcher()
        )
        .build();


GraphQLSchema schema = GraphQLSchema.newSchema()
        .query(queryType)
        .mutation(createReviewForEpisodeMutation)
        .codeRegistry(codeRegistry)
        .build();
```

请注意输入参数类型是 `GraphQLInputObjectType`.这是很重要的.输入类型只能是这种类型,绝不能使用输出类型如 `GraphQLObjectType`.标量类型既可以是输入类型也可以是输出类型.
这个 data fetcher 执行 mutation,返回一些有意义的输出值.

```java
private DataFetcher mutationDataFetcher() {
    return new DataFetcher() {
        @Override
        public Review get(DataFetchingEnvironment environment) {
            Map<String,Object> episodeInputMap = environemnt.getArugment("episode");
            Map<String,Object> reviewInputMap = environment.getArugment("review");

            EpisodeInput episodeInput = EpisodeInput.fromMap(episodeInputMap);
            ReviewInput reviewInput = ReviewInput.fromMap(reviewInputMap);
            Review updatedReview = reviewStore().update(episodeInput, reviewInput);
            return updatedReview;
        }
    }
}
```

### 异步执行

graphql-java 执行查询时可以完全支持异步执行.你可以通过调用 `executeAsync()` 获取 `CompletableFuture`的结果.

```java
GraphQL graphql = buildSchema();
ExecutionInput executionInput = ExecutionInput.newExecutionInput().query("query { hero { name }}").build();
CompletableFuture<ExecutionResult> promise = graphql.executeAsync(executionInput);
promise.thenAccept(executinoResult -> {
    encodeResultToJsonAndSendResponse(executionResult);
});
promise.join();
```

使用 `CompletableFuture` 可以在执行完成时组合 action 和 function.最终调用 `join()` 等待执行完成.
graphql-java 使用异步执行的原理是通过 join 调用通过方法`execute()`.所以下面的代码效果是一样的.

```java
ExecutionResult executionResult = graphql.execute(executionInput);
CompletableFuture<ExecutionResult> promise = graphql.executeAsync(executionInput);
ExecutionResult executionResult = promise.join();
```

如果 `graphql.schema.DataFetcher` 返回的是 `CompletableFuture<T>` 对象,那么这个结果将被组合进整个异步查询执行中.这意味着你可以并行发起多个属性查询请求.你使用的线程池策略取决于你的 data fetcher 代码.
下面的代码采用了标准的 `java.util.concurrent.ForkJoinPool.commonPool()` 线程执行器在另外一个线程提供数据.

```java
DataFetcher userDataFetcher = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        CompletableFuture<User> userPromise = CompletableFuture.supplyAsync(() -> {
            return fetchUserViaHttp(environment.getArgument("userId"));
        });
        return userPromise;
    }
}
```

上面的代码用 Java8 Lambdas 可以简略为:

```java
DataFetcher userDataFetcher = environment -> CompletableFuture.supplyAsync(() -> fetchUserViaHttp(environment.getArgument("userId"));
```

graphql-java 引擎确保所有的 `CompletableFuture` 对象遵照 graphql 规范组合在一起提供执行结果.
这是 graphql-java 创建异步 data fetcher 的快捷方式.使用 `graphql.schema.AsyncDataFetcher.async(DataFetcher<T>)` 包装一个 DataFetcher.可以使用静态导入创建更易读的代码.

```java
DataFetcher userDataFetcher = async(environment -> fetchUserViaHttp(environment.getArgument("userId")));
```

### 执行策略

继承 `graphql.execution.ExecutionStrategy` 的类可以用于运行一个查询或修改. graphql-java 提供了大量不同的策略,如果你非常迫切,也可以使用自定义的.
当你创建 Graphql 对象时可以确定执行策略.

```java
GraphQL.newGraphQL(schema)
        .queryExecutionStrategy(new AsyncExecutionStrategy())
        .mutationExecutionStrategy(new AsyncSerialExecutionStrategy())
        .build();
```

实际上上面的代码和默认设置一致,大多数情况下是一个明智的策略选择.

### 异步执行策略

默认的查询执行策略是 `graphql.execution.AsyncExecutionStrategy`,会把每一个属性作为 `CompletableFuture` 对象分发,并且不关心哪个最先完成.此策略是性能最佳的执行策略.
data fetchers 本身会返回 `CompletionStage` 值,这将导致完全异步的行为.

```graphql
query {
	hero {
		enemies {
			name
		}
		friends {
			name
		}
	}
}
```

`AsyncExecutionStrategy` 自由分发 <i>enemies</i> 属性和 <i>friends</i>属性.<i>enemies</i> 属性不必等待 <i>friends</i>属性返回.这是非常低效的.
无论如何,最终会将结果按顺序排列.查询结果将遵照 graphql 规范,返回结果对应 query 属性顺序.只有 data fetcher 的执行是随机顺序.

### 异步序列化执行策

graphql 规范要求 mutation 必须按照 query 属性的顺序序列化执行.
所以 mutation 默认使用 `graphql.execution.AsyncSerialExecutionStrategy` 策略.它会保证在执行下一个和后面前当前的每个属性执行完毕.也可以在 mutation data fetcher 中返回 `CompletionStage` 对象,并且会按顺序在下一个 mutation 属性 data fetcher 被分发之前执行完毕.

### 订阅执行策略

graphql 允许对 graphql data 创建有状态的订阅.可以使用 `SubscriptionExecutionStrategy`实现,同时支持 reactive-stream API.
[查看](https://www.graphql-java.com/documentation/v12/subscriptions)了解更多基于 graphql 服务的订阅支持.

### 查询缓存

在 graphql-java 引擎执行查询之前必须被解析和检验,并且这个处理过程可能有些耗时.
为了避免重复解析/校验`GraphQL.Builder`允许`PreparsedDocumentProvider`实例复用`Document`实例.
注意 ⚠️,这只缓存解析的 `Document`,不缓存查询结果

```java
Cache<String,PreparsedDocumentEntry> cache = Caffeine.newBuilder().maximumSize(10_000).build();
GraphQL graphql = GraphQL.newGraphQL(StarWarsSchema.starWarsSchema)
        .preparsedDocumentProvider(cache::get)
        .build();
```

- 这个缓存实例应该是线程安全共享的.
- `PreparsedDocumentProvider` 是一个只有一个 get 方法的函数接口,我们可以传递一个方法引用到里面以匹配 builder 的签名.

为了实现高缓存覆盖率,推荐属性参数通过变量传递而不是直接在 query 中定义.
下面的查询:

```graphql
query HelloTo {
	sayHello(to: "ME") {
		greeting
	}
}
```

应该这样写:

```graphql
query HelloTo($to: String!) {
	sayHello(to: $to) {
		greeting
	}
}
```

和变量

```graphql
{
    "to": "Me"
}
```

现在就可以不管提供的变量是什么而重用查询.
