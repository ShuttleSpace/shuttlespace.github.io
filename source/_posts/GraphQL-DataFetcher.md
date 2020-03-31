---
title: GraphQL-DataFetcher
date: 2019-04-27 23:07:22
tags:
  - DataFetcher
---
data fetcher
<!-- more -->
## 获取数据

### graphql 如何获取数据

graphql 中的每个属性都关联了一个 graphql.schema.DataFetcher.
一些属性会使用专用的 data fetcher 从数据库获取该属性的相关信息.而大多数简单的使用属性名和 Plain Old Java Object(POJO)模式 从内存中获取数据.
`在其他 graphql 实现中，Data fetcher 被称为 resolver`
现在声明一个类型定义:

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
	launchDate(dateFormat: String = "dd,MM,yyyy"): String
}
```
