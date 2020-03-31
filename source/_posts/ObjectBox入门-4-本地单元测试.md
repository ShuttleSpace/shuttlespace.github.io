---
title: ObjectBox入门-4-本地单元测试
date: 2019-02-24 21:09:35
tags:
  - ObjectBox
  - 数据库
---
objectbox

<!-- more -->
## 安卓本地单元测试

### 设置测试环境

| 此配置仅针对 ObjectBox 1.4 及之前版本.新版本已经自动添加了 native ObjectBox 依赖库。

```groovy
// /app/build.gradle
depdendencies {
    // 必备 JUnit 4
    testImplementation 'junit:unit:4.12'
    // 手动添加平台独立的 native Objectbox 依赖库.(可选)
    testImplementation "io.objectbox:objectbox-linux:$objectboxVersion"
    testImplementation "io.objectbox:objectbox-macos:$objectboxVersion"
    testImplementation "io.objectbox:objectbox-windows:$objectboxVersion"
}
```

| 本地单元测试仅支持 64 位系统.
| windows 可能需要安装 `Microsoft Visual C++ 2015 Redistributable(x64)`

### 创建本地单元测试类

- 可以使用 BoxStore builder 的`directory(File)` 指定数据库保存在本地设备上。
- 为保证数据不交叉污染，可以使用 `BoxStore.deleteAllFiles(File)` 删除已经存在的数据库

```java
public class NoteTest {
    private static final File TEST_DIR = new File("objectbox-example/test-db");
    private BoxStore store;

    @Before
    public void setUp() throws Exception {
        // 删除之前的数据库
        BoxStore.deleteAllFiles(TEST_DIR);
        store = MyObjectBox.builder()
                // 指定数据库存放路径
                .directory(TEST_DIR)
                // 添加 debug 标记打印日志
                .debugFlags(DebugFlags.LOG_QUERIES | DebugFlags.LOG_QUERY_PARAMETERS)
                .build();
    }

    @After
    public void tearDown() throws Exception {
        if (store != null) {
            store.close();
            store = null
        }
        BoxStore.deleteAllFiles(TEST_DIR);
    }

    @Test
    public void exampleTest() {
        Box<Note> noteBox = store.boxFor(Note.class);
        assertEquals(...);
    }
}
```

### 关系测试

- ObjectBox 1.4.4 及之后
- 为了测试具有 ToOne,ToMany 属性的 entity,必须在本地 JVM 初始化 entity 并且添加一个 transient 的 BoxStore 属性.
