---
title: ObjectBox入门-1-简介
date: 2019-02-24 14:58:55
tags:
  - ObjectBox
  - 数据库
---

## 关于

ObjectBox 定位是: 针对移动端和 IoT 超快的 `(superfast edge database)` 面向对象的数据库 .为小型设备提供了边缘计算能力，使得数据可以快速高效地在本地存储、处理、安全管理.ObjectBox 小于 `1MB`,最适合移动 APP、小型 IoT 设备及路由。并且 ObjectBox 也是第一个在边缘设备上兼容 ACID 的高性能的 NoSQL 数据库.所有的产品都是基于工程师思维开发的，所以可以使用最少的代码去实现想要的功能。

### 优点

- 比同类竟品快 10 倍以上。[BenchMark](https://github.com/objectbox/objectbox-performance)
- 跨平台。支持 Linux、Windows、Mac/iOS、Android、Raspberry Pi、ARM 等嵌入式设备和容器。
- 小于 1MB,特别针对小型设备设计和优化。
- 易使用。
- 支持 reactive.
- 无缝结合 greenDAO.(同一家公司出品)
- 更好地支持关系型数据. 提供了改变追踪(change tracking)，级联添加(cascading puts)，灵活的加载策略(eager,lazy)
- 无需掌握 SQL:ObjectBox 设计简单，使用方便，不需要掌握 SQL 即可上手.
- 支持 kotlin: 包括 data class.

## 使用

### Android(Java)

```groovy
// root 目录 build.gradle
buildscript {
    ext.objectboxVersion = '2.3.3'
    repositories {
        jcenter()
    }
    dependencies {
        // Android Gradle plugin 最低版本为 3.0.0
        classpath 'com.android.tools.build:gradle:3.3.1'
        classpath "io.objectbox:objectbox-gradle-plugin:$objectboxVersion"
    }
}
```

```groovy
// app 或其他 module build.gradle
apply plugin: 'com.android.application'
apply plugin: 'io.objectbox' 放在最下面
```

#### Android(Kotlin)

```groovy
// app 或其他 module build.gradle
apply plugin: 'com.android.application'
apply plugin: 'kotlin-android'
apply plugin: 'kotlin-kapt' 如果使用 kotlin-android 插件，必须加 kotlin -kapt 插件
apply plugin: 'io.objectbox' 放在最下面
```

Sync gradle 即可自动添加 ObjectBox 依赖.

### 配置

1、首先添加 ObjectBox 插件.
2、如果 ObjectBox 插件没有自动添加依赖库和注解处理器，请手动添加依赖。

```groovy
// Android(Java)
// /app/build.gradle
dependencies {
    compile "io.objectbox:objectbox-androoid:$objectboxVersion"
    annotationProcessor "io.objectbox:objectbox-processor:$objectboxVersion"
}
```

```groovy
// Android(kotlin)
// /app/build.gradle
dependencies {
    compile "io.objectbox:objectbox-android:$objectboxVersion"
    kapt "io.objectbox:objectbox-processor:$objectboxVersioni"
    // 针对 kotlin 的扩展函数(可选)
    compile "io.objectbox:objectbox-kotlin:$objectboxVersion"
}
```

3、改变 Model 文件的路径

ObjectBox Model 文件默认保存在 `module-name/objectbox-models/default.json`。

```groovy
// Android(Java)
// /app/build.gradle
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = ["objectbox.modelPath":"$projectDir/schemas/objectbox.json".toString()]
            }
        }
    }
}
```

```groovy
// Android(Kotlin)
// /app/build.gradle
kapt {
    arguments {
        arg("objectbox.modelPath":"$projectDir/schemas/objectbox.json")
    }
}
```

4、改变 `MyObjectBox` 的包名

MyObjectBox 类的包名默认和 entitiy 类的包名或其上一级报名一致。

```groovy
// Android(Java)
// /app/build.gradle
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = ["objectbox.myObjectBoxPackage":"com.example.custom"]
            }
        }
    }
}

```

```groovy
// Android(Kotlin)
// /app/build.gradle
kapt {
    arguments {
        arg("objectbox.myObjectBoxPackage", "com.example.custom")
    }
}
```

5、开启 Debug 模式

在 /app/build.gradle 中添加必要的选项后，运行 `./gradlew --info` 即可查看 debug 输出

```groovy
// Android(Java)
// /app/build.gradle
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = ['objectbox.debug' : 'true']
            }
        }
    }
}

```

```groovy
// Android(Kotlin)
// /app/build.gradle
kapt {
    arguments {
        arg("objectbox.debug", true)
    }
}
```

6、开启 DaoCompat 兼容模式

从 greenDAO 迁移过来，生成和 greenDAO 相似的 API,使 ObjectBox 看起来就像 SQLite 一样。

```groovy
// /app[module]/build.gradle
depdendencies {
    compile "org.greenrobot:objectbox-daocompat:1.10"
}
```

然后开启 DaoCompat 模式

```groovy
// Android(Java)
// /app[module]/build.gradle
android {
    defaultConfig {
        javaCOmpileOptions {
            annotationProcessorOptions {
                arguments = ['objectbox.daoCompat':'true']
            }
        }
    }
}
```

```groovy
// Android(Kotlin)
// /app[module]/build.gradle
kapt {
    arguments {
        arg("objectbox.daoCompat":true)
    }
}
```

如果你计划从 greenDAO 迁移到 ObjectBox,那么你可能会保留原来的 greenDAO entity 类（复制这些类到另外的包中）然后按如下修改。

- 首先改变注解。请注意：不是所有的 greenDAO 注解都支持无缝迁移到 ObjectBox,支持的如下：

```java
// greenDAO
import org.greenrobot.greendao.annotation.Entity;
import org.greenrobot.greendao.annotation...

// ObjectBox
import io.objectbox.annotation.Entity;
import io.objectbox.annotation...
```

- ObjectBox 当前不支持 unique indexes,naming indexes,或者在多个属性间 indexes.

```java
// greenDAO
@Entity(indexes = ...)
@Index(name = "idx1", unique = true) private String name;
@Unqiue private String name;

// ObjectBox
@Index private String name;
```

- 自定义类型。修改父类,当然也可同时继承，这样该自定义类型就可同时在 greenDAO 和 ObjectBox 间使用

```java
// greenDAO
import org.greenrobot.greendao.converter.PropertyConverter;

// ObjectBox
import io.objectbox.converter.PropertyConverter;
```

修改 @Convert 注解里的 columnType 改为 dbType

```java
// greenDAO
@Convert(converter = NoteTypeConverter.class, columnType = String.class)

// ObjectBox
@Convert(converter = NoteTypeConverter.class, dbType = String.class)
```

- 关系。ObjectBox 使用 `ToOne` 和 `ToMany`类型替代 greenDAO 的 `@ToOne` 和 `@ToMany` 注解。
- 使用 BoxStore.
  修改完 entity 后，设置 BoxStore 创建 DaoSession.

```java
// 通常在 Application 类中
boxStore = MyObjectBox.builder().androidContext(this).build();
daoCompatSession = new DaoSession(boxStore);
// 在迁移完成后，你可能想移除这些迁移操作。
// 那么通过 greenDAO session 获取 entities,把他们转为 ObjectBox entities,
// 然后使用 DaoCompat session 插入。
List<com.example.app.daos.greendao.Note> notes = daoSession.getNoteDao().loadAll();
List<Note> convertedNotes = convertToObjectBoxNotes(notes);
daoCompatSession.getNoteDao().insertInTx(convertedNotes);
```

默认没有设置 ID (即 id == 0),ObjectBox 会为插入的数据生成一个新的 ID.如果想保留原来的 ID,请修改 `@Id(assignable = true)`

- 使用 DaoCompat DaoSession
  在使用新 compat session 替换原来的 API 后，可以通过在 `Application` 类中的一个方法返回 `DaoSession`

```java
public DaoSession getDaoSession() {
    // greenDAO
    // return daoSession;
    // ObjectBox
    return daoCompatSession;
}
```

表面上 compat DaoSession 是 greenDAO DaoSession 的替代品，其实它内部是使用 BoxStore 代替了 greenDAO 数据库.
如果还使用了 greenDAO 的额外特性，比如 queries,那么还需如下修改:

```java
// greenDAO
import org.greenrobot.greendao.query.Query;
import org.greenrobot.greendao...
// ObjectBox
import org.greenrobot.daocompat.query.Query;
import org.greenrobot.daocompat...
```

- Queries
  DaoCompat 支持以下的 Query 功能:
  -- `remove()` 替代 `DeleteQuery`
  -- `count()` 替代 `CountQuery`
  -- 不支持 `CursorQuery`

- DaoCompat 和 greenDAO 的不同
  -- 不支持 `NotNull`
  -- 不支持 `Joins` 和 `原生 SQL 查询`.
  -- 不支持异步 sessions: `startAsyncSession()`
  -- 不支持加密
  -- 仅支持简单的 `AbstractDaoTest` 和 `AbstractDaoBasicTest`
