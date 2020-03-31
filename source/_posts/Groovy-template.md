---
title: Groovy template
date: 2019-08-16 09:56:58
tags:
  - 译
---
Groovy MarkupTemplateEngine 主要面向生成类 XML(XML,XHTML,HTML5...)的标记语言,但是也支持其他基于内容的文本.和传统的模版引擎相比,此引擎支持基于 DSL 的 builder 语法.
<!-- more -->
```groovy
xmlDeclaration()
cars {
  carsh.each {
    car(make:it.make,model:it.model)
  }
}
```
### 引用
`MarkupTemplateEngine`支持引用来自另一个文件的内容.
- 另一份模版
- 原生内容
- 需要转义的内容
