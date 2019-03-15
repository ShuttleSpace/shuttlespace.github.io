---
title: ObjectBox入门-6-Java桌面应用.md
date: 2019-02-24 23:25:24
tags:
  - ObjectBox
  - 数据库
---

## Java 桌面应用

### 嵌入式数据库

ObjectBox 不仅仅适用于 Android 项目，同时也适用于运行在 Windows Linux macOS 上的纯 Java(JVM) 桌面应用.

### 配置

请使用 Gradle 作为构建工具，因为 ObjectBox 使用了 Gradle 插件.

```groovy
buildscript {
    ext.objectboxVersion = '2.3.3'
    repositories {
        jcenter()
        maven{ url "https://plugins.gradle.org/m2/"}
    }
    dependencies {
        classpath "net.ltgt.gradle:gradle-apt-plugin:0.20"
        classpath "io.objectbox:objectbox-gradle-plugin:$objectboxVersion"
    }
}
repositories {
    jcenter()
}
apply plugin: 'java'
apply plugin: 'net.ltgt.apt-idea' // 注解处理器插件
apply plugin: 'io.objectbox'
```

### Native 库

ObjectBox 是由 C/C++写成的可以运行大多数 native code 的对象数据库。

### 改变 Model 文件位置

默认 model 文件存储在 `module-name/objectbox-models/default.json`.可以通过修改 objectbox.modelPath 来改变

```groovy
// 在项目 build.gradle 文件， apply plugin: 'java' 之后添加
tasks.withType(JavaCompile) {
    options.compilerArgs += ["-Aobjectbox.modelPath=$projectDir/schemas/object.json]
}
```

### 改变 MyObjectBox 包名

```groovy
tasks.withType(JavaCompile) {
    options.compilerArgs += [ "-Aobjectbox.modelPath=$projectDir/schemas/objectbox.json" ]
}
```

### 开启 debug 模式

```groovy
// enable debug output for plugin
objectbox {
    debug true
}
// enable debug output for annotation processor
tasks.withType(JavaCompile) {
    options.compilerArgs += [ "-Aobjectbox.debug=true" ]
}
```

#### 可以使用 BoxStore builder 的 name(String) 来改变数据库存储的位置。

### 单元测试

添加 junit 4 库
