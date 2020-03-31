---
title: GraphQL-Batching
date: 2019-05-05 23:38:54
tags:
---
bactching
<!-- more -->
## 批处理

### 使用 Dataloader

如果你正在使用 graphql,那么你可能遇到数据图查询.这可以通过本地数据图加载轻松实现.
使用 `java-dataloader` 将帮助你更高效的处理数据图条目的缓存和批量请求.如果 dataloader 已经发现了一个之前的数据条目,它将会缓存数据并且直接返回不再发起请求.
假设我们需要查询一个英雄和他们朋友的名字及他们朋友的朋友的名字.

```gaphql
{
    hero {
        name {
            friends {
                name {
                    friends {
                        name
                    }
                }
            }
        }
    }
}
```

这个查询的结果如下.

```json
{
	"hero": {
		"name": "R2-D2",
		"friends": [
			{
				"name": "Luke Skywalker",
				"friends": [
					{
						"name": "HanSolo"
					},
					{
						"name": "Leia Organa"
					},
					{
						"name": "C-3P0"
					},
					{
						"name": "R2-D2"
					}
				]
			},
			{
				"name": "Han Solo",
				"friends": [
					{ "name": "Luke Skywalker" },
					{ "name": "Leia Organa" },
					{ "name": "R2-D2" }
				]
			},
			{
				"name": "Leia Organa",
				"friends": [
					{ "name": "Luke Skywalker" },
					{ "name": "Han Solo" },
					{ "name": "C-3PO" },
					{ "name": "R2-D2" }
				]
			}
		]
	}
}
```

最差的办法是每次调用 `DataFetcher`获取 person 对象.
本例中将发起 15 次网络请求.即使很多人有共同的朋友.使用 `dataloader`你可以使 graphql 查询变得更高效.
当 graphql 降序查询每个层级时(hero -> friends -> friends),dataloader 调用 promise 传递 person 对象.在每个层级中调用 `dataloader.dispatch()` 批量发起部分查询请求.加上缓存(默认使用),之前的 person 将被返回.
上例中只涉及到 5 个独立的 people,合理的使用缓存和批量请求将只有 3 个批量加载函数被调用,3 个网络请求或数据库查询总比 15 个要好.
如果你使用了 `java.util.concurrent.CompletableFuture.supplyAsync()`,那么你可以通过异步调用使查询变得更高效.

```java
//  batch loader 可能被调用多次，因为它的无状态性，所以适合作为单例使用
BatchLoader<String,Object> characterBatchLoader = new BatchLoader<String,Object>() {
    @Override
    public CompletableStage<List<Object>> load(List<String> keys) {
        // 使用 supplyAsync() 最大化并行执行
        return CompletableFuture.supplyAsync(() -> getCharacterDataViaBatchHTTPApi(keys));
    }
};

// 这个 data laoder 获取关联的人物，把他们放入 graphql schema
DataFetcher heroDataFetcher = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        DataLoader<String,Object> dataloader = environment.getDataLoader("character");
        return dataloader.load("2001");
    }
};

DataFetcher friendsDataFetcher = new DataFetcher() {
     @Override
    public Object get(DataFetchingEnvironment environment) {
        StarWarsCharacter starWarsCharacter = environment.getSource();
        List<String> friendsIds = starWarsCharacter.getFriendIds();
        DataLoader<String,Object> dataloader = environment.getDataLoader("character");
        return dataloader.loadMany(friendsIds);
    }
}
DataLoaderDispatcherInstrumentationOptions options = DataLoaderDispatcherInstrumentationOptions.newOptions().includeStatistics(true);
DataLoaderDispatcherInstrumentation dispatcherInstrumentation = new DataLoaderDispatcherInstrumentation(options);
GraphQL graphql = GraphQL.newGraphQL(buildSchema())
    .instrumentation(dispatcherInstrumentation)
    .build();
// 因为 data loader 是有状态的,所以每次请求都会被执行
DataLoader<String,Object> characterDataLoader = DataLoader.newDataLoader(characterBatchLoader);
DataLoaderRegistry registry = new DataLoaderRegistry();
registry.register("character",characterDataLoader);

ExecutionInput executionInput = newExecutionInput()
    .query(getQuery())
    .dataLoaderRegistry(registry)
    .build();
ExecutionResult executionResult = graphql.execute(executionInput);
```

本例中因为我们需要微调 `DataLoaderDispatcherInstrumentation`选项,所以手动添加.如果不要的话,默认会自动添加的.

### 仅适用于 AsyncExecutionStrategy 的 Data Loader

这是因为此执行策略知道在最佳时机分发你的 load 调用.它通过深度追踪你有多少个突出的属性及他们是否是列表值等实现.
其他策略如 `ExecutorServiceExecutionStrategy`无法实现这个功能,因为如果 data loader 代码检测到你没有使用 `AsyncExecitionStrategy`,那么当碰到每个属性时,它将简单的分发 data loader.你可能会得到值的 `caching`,但你绝对拿不到他们的 `batching`.

### Data Loader 的每一个请求

如果你正在为 web 请求提供服务,那么可以为用户请求指定数据.如果你有用户指定的数据,你可能不会缓存用户 a 的数据,然后在后续的请求中把它传递给用户 b.
你的 DataLoader 实例的范围是很重要的.你可能想每个 web 请求创建一个 dataloader 以确保数据只对特定的 web 请求缓存.同时确保 `dispatch`调用不影响其他的 graphql 执行.
DataLoader 默认行为类似缓存.如果发现之前存在某个 key 对应的值,那么会自动返回它.
如果你的数据可以跨 web 请求分享,那么你可能需要改变你的 data loader 缓存实现,这样他们就能通过如 memcached 或 redis 这样的缓存层进行数据分享.
下例中仍然每个请求创建一个 data loader,然而缓存层允许数据分享.

```java
CacheMap<String,Object> crossRequestCacheMap = new CacheMap<String,Object>() {
    @Override
    public boolean containsKey(String key) {
        return redisIntegration.containsKey(key);
    }

    @Override
    public Object get(String key) {
        return redisIntegration.getValue(key);
    }

    @Override
    public CacheMap<String,Object> set(String key,Object value) {
        redisIntegration.setValue(key,value);
        return this;
    }

    @Override
    public CacheMap<String,Object> delete(String key) {
        redisIntegration.clearKey(key);
        return this;
    }

    @Override
    public CacheMap<String,Object> clear() {
        redisIntegration.clearAll();
        return this;
    }
};

DataLoaderOptions options = DataLoaderOptions.newOptions().setCacheMap(crossRequestCacheMap);
DataLoader<String,Object> dataloader = DataLoader.newDataLoader(batchLoader,options);
```

### 只能异步调用的批量加载功能

此 dataloader 代码模式整合所有明显的 data loader 调用到一个更有效的批量加载调用.
graphql-java 追踪已发起的明显的 data loader 调用,然后在最合适的时机(即所有的 graphql 属性已经校验成功并分发)在后台调用`dispatch`.
然而有些情况下将导致你的 data loader 调用永不会完成,这中情况必须避免.这种情况包括在异步线程调用 `DataLoader`.
下面的 🌰 不会成功(将永远无法完成).

```java
BatchLoader<String,Object> batchLoader = new BatchLoader<String,Object>() {
    @Override
    public CompletionStage<List<Object>> load(List<String> keys) {
        return CompletableFuture.completedFuture(getTheseCharacters(keys));
    }
};

DataLoader<String,Object> characterDataLoader = DataLoader.newDataLoader(batchLoader);

DataFetcher dataFetcherThatCallsTheDataLoader = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        // 千万要避免这样做
        return CompletableFuture.supplyAsync(() -> {
            String argId = environment.getArgument("id");
            DataLoader<String,Object> characterLoader = environment.getDataLoader("characterLoader");
            return characterLoader.load(argId);
        })
    }
}
```

上面的 🌰 中,`characterDataLoader.load(argId)` 可以在另外一个线程的未来某个时刻被调用. graphql-java 引擎不知道何时是最佳时机去分发明显的 `DataLoader` 调用,因此这个 data loader 可能永远不会如期执行,也不会有结果返回.
请记住,data loader 调用仅仅是一个保证,后面会将明显的调用批量调用在合适的时机获取结果.最佳时机是 graphql 属性树已经校验过,且所有的属性值已经被分发.
下面的 🌰 依然是异步代码,但是把它放在 `BatchLoader` 里.

```java
BatchLoader<String,Object> batchLoader = new BatchLoader<String,Object>() {
    @Override
    public CompletionStage<List<Object>> load(List<String> keys) {
        return CompletableFuture.supplyAsync(() -> getThreseCharacters(keys));
    }
};

DataLoader<String,Object> characterDataLoader = DataLoader.newDataLoader(batchLoader);

DataFetcher dataFetcherThatCallsTheDataLoader = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        // 这是阔以滴
        String argId = environment.getArgument("id");
        DataLoader<String,Object> characterLoader = environment.getDataLoader("characterLoader");
        return characterLoader.load(argId);
    }
}
```

上面的 🌰 `characterDataLoader.load(argId)` 会立即返回.这将会把 data 请求入队列,z 当所有的 graphql 属性都分发后再执行.
然后当 `DataLoader` 被分发后,他的 `BatchLoader` 函数被调用.这个代码可以异步执行,所以你可以有多个批量加载函数,他们可以同时执行.在上例中 `CompletableFuture.supplyAsync(() -> getTheseCharacters(keys));` 将再另一个线程中返回 `getTheseCharacters()` 方法.

### 向你的 data loader 传递 context

data load 库支持传递两个类型的 context 到 batch loader.第一个是每个 dataloader 一个全局的 context 对象,第二个是一个 loaded key 一个 context 对象的 map.
这允许你传递下游需要的额外信息.dataloader key 用在缓存结果,而 context 对象可以用在调用中.
在下面的 🌰 中,我们有一个全局的安全 context 对象,提供了一个调用 token,同时可以传递 graphql 原对象到每个 `dataLoader.load()` 调用中.

```java
BatchLoaderWithContext<String,Object> batchLoaderWithCtx = new BatchLoaderWithContext<String,Object>() {
    @Override
    public CompletionStage<List<Object>> load(List<String> keys,BatchLoaderEnvironment loaderContext) {
        // 获取全局 context 对象
        SecurityContext sercurityCtx = loaderContext.getContext();
        // 每个键都有一个 context 对象集
        Map<Object,Object> keysToSOurceObjects = loaderContext.getKeyContexts();
        return CompletableFuture.supplyAsync(() -> getTheseCharacters(securityCtx.getToken(),keys,keysToSourceObjects));
    }
};
SecurityContext securityCtx = SecurityContext.newSecurityContext();
BatchLoaderContextProvider contextProvider = new BatchLoaderContextProvider() {
    @Override
    public Object getÇontext() {
        return securityCtx;
    }
};
DataLoaderOptions loaderOptions = DataLoaderOptions.newOptions().setBatchLoaderContextProvider(contextProvider);
DataLoader<String,Object> characterDataLoader = DataLoader.newDataLoader(batchLoaderWithCtx,loaderOptions);

DataFetcher dataFetcherCallsTheDataLoader = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment environment) {
        String argId = environment.getArgument("id");
        Object source = environment.getSource();
        return characterDataLoader.load(argId,source);
    }
}
```
