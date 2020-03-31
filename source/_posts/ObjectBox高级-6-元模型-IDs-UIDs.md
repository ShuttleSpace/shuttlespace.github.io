---
title: "ObjectBox高级-6-元模型,IDs,UIDs"
date: 2019-02-26 14:19:22
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
不像 SQLite 这样的数据库，ObjectBox 不需要你创建 database schema.这不意味着 ObjectBox 是无 schema 的。为高效起见，ObjectBox 对存储的数据维护了一个元模型(meta model)。此元模型实际上等价于 ObjectBox 的 schema.它包含了所有属性的类型、indexes 等.不同之处在于 ObjectBox 试图自动管理该元模型.某些情况下，这需要你帮忙.

> Object 的 IDs 是 @Id 定义的，而 所有 entity 类型的实例都绑定一个 meta model ID.

### JSON for consistent IDs

ObjectBox 把一部分元模型保存在 JSON 文件中.**此文件应该通过版本控制软件管理**,主要原因是：它可以保证 元模型里的 IDs 和 UIDs 跨设备一致.
