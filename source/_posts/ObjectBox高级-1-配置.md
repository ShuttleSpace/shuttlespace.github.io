---
title: ObjectBox高级-1-配置
date: 2019-02-26 09:35:48
tags:
  - ObjectBox
  - 数据库
---

### 手动添加依赖库

如果 ObjectBox 插件没有自动添加依赖库和注解处理器，那么手动添加。

```groovy
dependencies {
    // all below should be added automatically by the plugin
    compile "io.objectbox:objectbox-android:$objectboxVersion"
    annotationProcessor "io.objectbox:objectbox-processor:$objectboxVersion"
}
```

```groovy
dependencies {
    // all below should be added automatically by the plugin
    compile "io.objectbox:objectbox-android:$objectboxVersion"
    kapt "io.objectbox:objectbox-processor:$objectboxVersion"
    // some useful Kotlin extension functions
    compile "io.objectbox:objectbox-kotlin:$objectboxVersion"
}
```

### 改变 model 文件位置

默认 model 文件位于 module-name/objectbox-models/default.json.

```groovy
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = [ "objectbox.modelPath" : "$projectDir/schemas/objectbox.json".toString() ]
            }
        }
    }
}
```

```groovy
kapt {
    arguments {
        arg("objectbox.modelPath", "$projectDir/schemas/objectbox.json")
    }
}
```

### 改变 MyObjectBox 的包名

默认 MyObjectBox 类包名和 entity 类或其父类的包名相同.

```groovy
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = [ "objectbox.myObjectBoxPackage" : "com.example.custom" ]
            }
        }
    }
}
```

```groovy
kapt {
    arguments {
        arg("objectbox.myObjectBoxPackage", "com.example.custom")
    }
}
```

### 开启 debug 模式

```groovy
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = [ 'objectbox.debug' : 'true' ]
            }
        }
    }
}
```

```groovy
kapt {
    arguments {
        arg("objectbox.debug", true)
    }
}
```

### greenDAO 兼容

查看[greenDAO 兼容配置](https://blog.dang8080.cn/2019/02/24/ObjectBox%E5%85%A5%E9%97%A8-1-%E7%AE%80%E4%BB%8B/#配置)
