---
title: ObjectBox入门-11-Data Browser
date: 2019-02-26 00:31:52
tags:
  - ObjectBox
  - 数据库
---

Data Browser 具有如下功能:

- 查看数据库的 entities 和 schema
- 下载 JSON 格式的 entities

## 配置

```groovy
dependencies {
    debugImplementation "io.objectbox:objectbox-android-objectbrowser:$objectboxVersion"
    releaseImplementation "io.objectbox:objectbox-android:$objectboxVersion"
}

// apply the plugin after the dependencies block
apply plugin: 'io.objectbox'
```

不这样设置可能出现 `Duplicate files copied in APK lib/armeabi-v7a/libobjectbox.so` 这样的错误.因为 ObjectBox 插件又添加了一次 objectbox-android 库

在 AndroidManifest.xml 添加如下权限(2.2.0 后需要)

```java
<!-- Required to provide the web interface -->
<uses-permission android:name="android.permission.INTERNET" />
<!-- Required to run keep-alive service when targeting API 28 or higher -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
```

建议在 Application 类中添加

```java
boxStore = MyObjectBox.builder().androidContext(this).build();
if (BuildConfig.DEBUG) {
    boolean started = new AndroidObjectBrowser(boxStore).start(this);
    Log.i("ObjectBrowser", "Started: " + started);
}
```
