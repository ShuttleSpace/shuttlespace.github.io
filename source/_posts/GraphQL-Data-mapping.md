---
title: GraphQL-Data mapping
date: 2019-05-05 13:02:31
tags:
---
data mapping
<!-- more -->
## Mapping data

### graphql 是如何把对象数据匹配到类型的

graphql 内部全部是关于声明类型 schema,然后在运行匹配到数据.
作为类型 schema 的设计者,你应该在处理这些元素.

```graphql
type Query {
	products(match: String): [Product] # a list of products
}
type Product {
	id: ID
	name: String
	description: String
	cost: Float
	tax: Float
}
```

然后可以执行查询

```graphql
query ProductQuery {
	products(match: "Paper*") {
		id
		name
		cost
		tax
	}
}
```

对于 `Query.products`属性有一个绑定的 `DataFetcher`负责查找匹配输入参数的 product s 列表.
假设我们有 3 个下游服务.一个获取产品信息,一个获取产品价格信息,一个计算查新税收信息.
graphql-java 使用这些对象运行 data fetcher,获取信息然后将其匹配到 schema 指定的类型中.
我们的目标是获取到这 3 个源的信息,然后把它们作为一个 unified 类型展示.
我们可以对 cost 和 tax 需要计算的属性指定 data fetcher,但这需要更多的维护精力,可能导致 N+1 性能问题.
我们最好在 `Query.products` data fetcher 中获取所有的信息,同时创建一个 unified 数据视图.

```java
DataFetcher produtctsDataFetcher = new DataFetcher() {
    @Override
    public Object get(DataFetchingEnvironment env) {
        String matchArg = env.getArgument("match");
        List<ProductInfo> productInfos = getMatchingProducts(matchArg);
        List<ProductCostInfo> productConstInfo = getProdutConsts(productInfo);
        List<ProductTaxInfo> productTaxInfo = getProductTax(productInfo);
        return mapDataTogether(productInfo,productCostInfo,productTaxInfo);
    }
}
```

上面有 3 个类型的信息需要被整合为一个以便 graphql 查询可以访问 id,name,cost,tax 属性.
有 2 中方法可以创建这个映射.一个是使用类型不安全的 `List<Map>` 结构,另一个是使用类型安全的 `List<ProductDTO>`封装这些数据.

```java
private List<Map> mapDataTogetherViaMap(List<ProductInfo> productInfo,List<ProductCostInfo> productCostInfo,List<ProductTaxInfo> productTaxInfo) {
    List<Map> unifiedView = new ArrayList<>();
    for (int i = 0;i < productInfo.size();i++) {
        ProductInfo info = productInfo.get(i);
        ProductCostInfo cost = productCostInfo.get(i);
        ProductTaxInfo tax = productTaxInfo.get(i);

        Map<String,Object> objectMap = new HashMap<>();
        objectMap.put("id",info.getId());
        objectMap.put("name",info.getName());
        objectMap.put("descriptioin",info.getDescription());
        objectMap.put("cost",cost.getCost());
        objectMap.put("tax",tax.getTax());

        unifiedView.add(objectMap);
    }
    return unifiedView;
}
```

```java
    class ProductDTO {
        private final String id;
        private final String name;
        private final String description;
        private final Float cost;
        private final Float tax;

        public ProductDTO(String id, String name, String description, Float cost, Float tax) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.cost = cost;
            this.tax = tax;
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public Float getCost() {
            return cost;
        }

        public Float getTax() {
            return tax;
        }
    }

    private List<ProductDTO> mapDataTogetherViaDTO(List<ProductInfo> productInfo, List<ProductCostInfo> productCostInfo, List<ProductTaxInfo> productTaxInfo) {
        List<ProductDTO> unifiedView = new ArrayList<>();
        for (int i = 0; i < productInfo.size(); i++) {
            ProductInfo info = productInfo.get(i);
            ProductCostInfo cost = productCostInfo.get(i);
            ProductTaxInfo tax = productTaxInfo.get(i);

            ProductDTO productDTO = new ProductDTO(
                    info.getId(),
                    info.getName(),
                    info.getDescription(),
                    cost.getCost(),
                    tax.getTax()
            );
            unifiedView.add(productDTO);
        }
        return unifiedView;
    }
```

graphql 引擎现在可以使用 object 列表然后运行查询获取 id,name,cost,tax 属性.
graphql-java 默认的 data fetcher `graphql.schema.PropertyDataFetcher` 同时支持 map 和 POJO.
对于列表的每一个对象都会通过 id 属性,或使用 name 在 map 里查找,或通过 getId() 方法获取,然后返回给 graphql response.对于查询中的每个类型都会执行这样的操作.
通过在高级 data fetcher 中创建一个 unified view,你就可以在运行时数据和 graphql schema 之间建立一个映射.
