---
title: gradle
date: 2019-03-28 13:00:38
tags:
  - kotlin
  - gradle
  - 构建
---

### Gradle 升级日志

5.0 包含了 Kotlin DSL 生产级支持,依赖版本对齐(类似 Maven BOM),任务超时,Java 11 支持

- Kotlin DSL 1.0
- 依赖版本对齐:

  - 同一逻辑组(platform)下的不同模块在依赖树中可以有相同的版本.也可以导入 Maven BOMs 定义 platform.

  ```groovy
  dependencies {
    // 导入 BOM.此文件中版本将覆盖依赖树中的其他版本
    implementation(enforcedPlatform("org.springframework.boot:spring-boot-dependencies:1.5.8.RELEASE"))
    // 使用上面定义的版本
    implementation("com.google.code.gson:gson")
    implementation("dom4j:dom4j")
    // 覆盖上面的版本
    implementation("org.codehaus.groovy:groovy:1.8.6")
  }
  ```

- Gradle build 初始化特性
- 可搜索文档
- 任务超时
- 解析依赖时 HTTP 重试
- 性能特性

  - Gradle 可以作为一个低优先级的进程启动: --priority low 或者 org.gradle.priority=low.可以保证 IDE/Browser 不卡,即使是一个很消耗资源的 gradle 任务.
  - 多任务输出属性不再禁用缓存.当使用 `@OutputFiles` 或 `OutputDirectories` 标记一个`Iterable`类型,Gradle 通常会对该任务禁用缓存且输出如下信息:

  ```bash
  Declares multiple output files for the single output property 'outputFiles' via @OutputFiles,@OutputDirectories or TaskOutputs.files()
  ```

  现在不会再阻止缓存了.对该任务禁用缓存的唯一理由可能是如果输出包含文件树.

- Java 11 运行时支持
- 插件授权特性
- `Provider 追踪产品任务`：Provider API 实例提供了追踪某值和任务或生成该值的任务。
- Gradle Native 特性
- 推广特性

### [Gradle 编译语言指南](https://docs.gradle.org/current/dsl/index.html)

#### gradle 可以使用不同的语言或 DSL 来执行编译任务

#### 基本概念

理解以下概念可以帮助书写 gradle 脚本.
首先，gradle 脚本是一种可配置脚本.当脚本执行时，会生成一个特定类型的配置对象.例如 build script 执行时，会生成一个类型为 Project 的配置对象.这个对象作为脚本的代理对象被使用.下面显示了 gradle 脚本对应的代理对象.

| 脚本类型        | 代理对象 |
| --------------- | -------- |
| build script    | Project  |
| init script     | Gradle   |
| settings script | settings |

在脚本内可以使用这些代理对象的属性和方法.

#### build script 结构

一段编译脚本由 0 个或多个语句和脚本块组成。语句可以包含方法调用，属性赋值，定义局部变量。一个脚本块是一个接受 closure 作为参数的方法调用.这个 closure 可以看作是一个当其执行时配置了一些代理对象的可配置 closure. 最顶层的脚本块如下

| 脚本块           | 描述                                                |
| ---------------- | --------------------------------------------------- |
| allprojects{}    | 配置此项目及其所有子项目                            |
| artifacts{}      | 配置此项目的发布产物                                |
| buildscript{}    | 配置此项目的 build script classpath                 |
| configurations{} | 配置此项目的依赖配置项                              |
| dependencies{}   | 配置此项目的依赖                                    |
| repositories{}   | 配置此项目的仓库                                    |
| sourceSets{}     | 配置此项目的 source set                             |
| subprojects{}    | 配置此项目的子项目                                  |
| publishing{}     | 配置由 publishing plugin 添加的 publishingExtension |

一段编译脚本同时也是一个 groovy 脚本,所以可以包含能出现在 groovy 脚本中的元素,如 方法定义，类定义

#### 核心类型

以下是在 gradle 脚本中常用的核心类型

| 类型                     | 描述                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project                  | 此接口是你在你的编译脚本中最常使用的 API。通过 Project,你可以使用 gradle 的所有特性                                                                                      |
| Task                     | 一个 task 代表一个编译过程中的一个单一原子任务，如编译 class,生成 javadoc                                                                                                |
| Gradle                   | 表示 gradle 的调用                                                                                                                                                       |
| Settings                 | 声明实例化和配置要参与构建的 Project 实例的层次结构所需的配置                                                                                                            |
| Script                   | 此接口由所有的 gradle 脚本实现并添加一些 gradle 特定的方法。当你编译脚本类时将会实现此接口，你可以在脚本中使用此接口声明的方法和属性                                     |
| JavaToolChain            | 一组用于编译 Java 源文件的工具                                                                                                                                           |
| SourceSet                | 表示 Java 源文件和资源文件的逻辑组                                                                                                                                       |
| SourceSetOutput          | 所有输出目录的集合(编译的类，处理过的资源等),SourceSetOutput 继承自 FileCollection                                                                                       |
| SourceDirectorySet       | 表示一组由一系列源文件目录组成的源文件。以及相关的 include 和 exclude pattern                                                                                            |
| IncrementalTaskInputs    | 提供通过增量任务访问任意需要被处理文件的途径                                                                                                                             |
| Configuration            | 表示一组产物及其依赖。从 ConfigurationContainer 中可以获取更多关于对 configuration 声明依赖或者管理 configuration 的信息                                                 |
| ResolutingStrategy       | 定义依赖解析的策略.例如强制固定依赖版本号，替代，冲突解决方案或快照                                                                                                      |
| ArtifactResolutingQuery  | 发起可以解析特定组件的指定软件产物的查询的生成器                                                                                                                         |
| ComponentSelection       | 表示一个模块的组件选择器和某个组件选中规则中评估的候选版本的元组                                                                                                         |
| ComponentSelectionRules  | 表示组件选中规则的容器.规则可以作为一个 configuration 的解析规则一部分被使用，而且独立的组件可以明确接受或拒绝该规则。既不接受也不拒绝的组件将被指定到默认的版本匹配规则 |
| ExtensionAware           | 在运行时可以和其他对象一起被扩展的对象                                                                                                                                   |
| ExtraPropertiesExtension | Gradle 域对象的附加 ad-hoc 属性                                                                                                                                          |
| PluginDependenciesSpec   | 在脚本中使用的声明插件的 DSL                                                                                                                                             |
| PluginDependencySpec     | 插件依赖的可变规范                                                                                                                                                       |
| PluginManagementSpec     | 配置插件如何被解析                                                                                                                                                       |
| ResourceHandler          | 提供访问特定资源的工具方法的途径,例如创建各种资源的工厂方法                                                                                                              |
| TextResourceFactory      | 创建由字符串、文件、存档实体等资源提供的 TextResources                                                                                                                   |

#### type-safe model accessors

执行时机：plugins{} 块后，script 脚本之前.

```kts
// build.gradle.kts
plugins {
  `java-library`
}

dependencies {
  api("junit:junit;4.12")
  implementation("junit:junit:4.12")
  testImplementation("junit:junit:4.12")
}

configurations {
  implementation {
    resolutinStrategy.failOnVersionConflict()
  }
}

sourceSets {
  main {
    java.srcDir("src/core/java")
  }
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks {
  test {
    testLogging.showExceptions = true
  }
}
```

#### 了解 type-safe accessors 不可用时要执行的操作

下面的脚本明确使用了 apply() 方法应用插件.编译脚本无法使用 type-safe accessors,因为 apply() 方法是在这个编译脚本内调用的。你可以采用其他技巧，如下

```kts
// build.gradle.kts
apply(plugin = "java-library")

dependencies {
  "api"("junit:junit:4.12")
  "implementation"("junit:junit:"4.12")
  "testImplementation"("junit:junit:4.12")
}

configurations {
  "implementation" {
    resolutinStrategy.failOnVersionConflict()
  }
}

configure<SourceSetContainer> {
  named("main") {
    java.srcDir("src/core/java")
  }
}

configure<JavaPluginConvention> {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks {
  named<Test>("test") {
    testLogging.showException = true
  }
}
```

下列情况下，type-safe accessor 不可用

- 使用 apply(plugin = id) 应用插件
- 项目 build script
- 通过 apply(from = "script-plugin.gradle.kts") 应用的脚本插件
- 跨项目配置的插件

#### 产物配置

```kts
// build.gradle.jts
apply(plugin = "java-library")'

dependencies {
  "api"("junit:junit:4.12")
  "implementation"("junit:junit:4.12")
  "testImplementation"("junit:junit:4.12")
}

configurations {
  "implementation" {
    resolutinStrategy.failOnVersionConflict()
  }
}

```

```kts
// settings.gradle.kts
pluginManagement {
  repositories {
    google()
    gradlePluginPortal()
  }

  resolutionStrategy {
    eachPlugin {
      if (requested.id.namespace == 'com.android') {
        useModule('com.android.tools.build:gradle:${requested.version}')
      }
    }
  }
}
```

```kts
// build.gradle.kts
val check by tasks.existing
val myTask1 by tasks.registering

val compileJava by tasks.existing(JavaCompile::class)
val myCopy1 by tasks.registering(Copy::class)

va; assemble by tasks.existing {
  dependsOn(myTask1)
}

val myTask2 by tasks.registering {
  description = "some meaningful words"
}

val test by tasks.existing(Test::class) {
  testLogging.showStackTrace = true
}

val myCopy2 by tasks.registering(Copy::class) {
  from("source")
  into("destination")
}
```

### 升级 `Gradle Wrapper`

如果已经有基于`gradlew wrapper`的项目,可以通过运行`wrapper`任务来指定需要的`gradle`版本.

```bash
./gradlew wrapper --gradle-version=5.3 --distribution-type=bin
```

当然没必要使用`gradle wrapper`来安装`gradle`.调用`gradlew`或`gradlew.bat`将会下载并缓存指定版本的 Gradle.

```bash
./gradlew taska
```

### CLI 自动补全

```bash
brew install gradle-completion
echo $fpath | grep "/usr/local/share/zsh/site-functions"
```

### 设计 gradle 插件

对 gradle 新手来说，实现 gradle 插件可能是一个坑:组织管理插件逻辑，测试、调试插件代码等.可以在[此](https://gradle.org/guides)获取到更多的信息.

###

通过指定 subproject 的路径，可以将本地任何路径下的代码导入工程中，供本地开发调试。

```groovy
include ':lib'
project(':lib').projectDir = new File('xxx/xxx/lib')
```

### com.android.application 插件

- `applicationVariants`

```groovy
//  AppExtension 继承自 BaseExtension 唯一扩展的成员变量，它的参数类型是 DefaultDomainObjectSet,这是不同 buildType 及 Flavor 的集合,applicationVariants 最长的是它的 all 方法，如修改 apk 名字
def buildTime() {
  return new Date().format("yyyy-MM-dd",TimeZone.getTimeZone("UTC"))
}

android {
  applicationVariants.all { variant ->
    variant.outputs.each { output ->
      def outputFile = output.outputFile
      if (outputFile != null && outputFile.name.endsWith('.apk')) {
        def fileName = "${variant.buildType.name}-${variant.versionName}-${buildTime()}.apk"
        output.outputFile = new File(output.outputFile.parent,fileName)
      }
    }
  }
}

```

- `defaultConfig`

```groovy
defaultConfig {
    applicationId '**.**.**'
    applicationIdSuffix '.two' //applicationId的后缀，可以用在想同时安装运行两个Flavor包的时候，比如同时安装debug包和Release包做一些对比。
    minSdkVersion 14
    minSdkVersion 14
    targetSdkVersion 28
    versionCode 1
    versionName '1.0'
    versionNameSuffix '.0' // versionName后缀
    consumerProguardFiles 'proguard-rules.pro' //用于Library中，可以将混淆文件输出到aar中，供Application混淆时使用。
    dimension 'api'
    //给渠道一个分组加维度的概念，比如你现在有三个渠道包，分成免费和收费两种类型，
    //可以添加一个dimension, 打渠道包的时候会自动打出6个包，而不需要添加6个渠道，
    // 详细的说明可见 https://developer.android.com/studio/build/build-variants.html#flavor-dimensions。
    externalNativeBuild { //ndk的配置，AS2.2之后推荐切换到cmake的方式进行编译。
        cnamke {
            cppFlags '-frtti --fexceptions'
            arguments '-DANDROID_ARM_NEON=TRUE'
            buildStagingDirectory './outputs/cmake'
            path 'CMakeLists.txt'
            version '3.7.1'
        }
        ndkBuild {
          path 'Android.mk'
          buildStagingDirectory './outputs/ndk-build'
        }
    }

    javaCompileOptions {
      annotationProcessorOptions { // 注解的配置
        includeCompileClasspath true // 使用注解功能
        arguments = [ eventBusIndex : 'org.greenrobot.eventbusperf.MyEventBusIndex' ] // AbstractProcessor 中可以读取到该参数
        classNames
      }
    }

    manifestPlaceholders = [key: 'value'] // manifest 占位符，定义参数给 manifest 调用，如不同的渠道id
    multiDexEnabled true // 启用 multiDex
    multiDexKeepFile file('multiDexKeep.txt') // 手动拆包，将具体的类放在主 dex
    mutliDexKeepProguard file('multiDexKeep.pro') // 支持 proguard 语法，进行一些模糊匹配.

    ndk {
      abiFilterss 'x86','x86_64','armeabi' // 只保留特定的 abi 输出到 apk
    }

    proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro' // 混淆文件的列表，如默认的 android 混淆文件及本地的 proguard 文件，切记不要遗漏 android 混淆文件，否则导致一些默认安卓组件无法找到

    signingConfig {
      storeFile file('debug.keystore') // 签名文件路径
      storePassword 'android' // 签名文件密码
      keyAlias 'androiddebugkey' // 别名
      keyPassword 'android'
    }

    buildConfigField('boolean','IS_RELEASE','false') // 在代码中可以通过 BuildConfig.IS_RELEASE 调用。默认 false
    resValue('string','appname','demo') // 在 res/value 中添加 <string name="appname" translatable="false">demo</string>
    resConfigs 'cn','hdpi' // 指定特定资源，可以结合 productFlavors 实现不同渠道的最小的 apk 包.
}
```

- `productFlavors`: 渠道包的列表，可覆盖 defaultConfig 的参数配置,形成自己的风味
- `flavorDimensionList`: 添加纬度的定义
- `resourcePrefix`: 在模块化开发中给每个模块指定一个特定的资源前缀，避免多模块使用相同的文件名后合并冲突，在 build.gradle 指定此配置后，AS 会检查不合法的资源命名并报错
- `buildTypes`: 默认有 debug 和 release。

```groovy
debug {
  applicationIdSuffix '.debug'
  versionNameSuffix '.1'
  debugable true // 生成的 apk 是否可调试，debug -> true,release -> false
  jniDebuggable true // 是否可以调试 NDK 代码，使用 lldb 进行 c/c++ 代码调试
  crunchPngs true // 是否开启 png 优化，会对 png 图片做一次最优压缩，影响编译速度, debug -> false,release -> true
  embedMicroApp true // Android Wear 支持
  minifyEnabled true // 是否开启混淆
  renderscriptDebuggable false // 是否开启渲染脚本
  renderscriptOptimLevel 5 // 渲染脚本等级 默认 5
  zipAlignEnabled true // 是否 zip 对齐优化，默认 true
}
```

- `ndkDirectory`: 也可在 local.properties 中配置 ndk.dir=/Users/shuttle/Library/Android/sdk
- `sdkDirectory`: ..
- `aaptOptions`: 资源打包工具

```groovy
aaptOptions {
  additionalParameters '--rename-manifest-package','cct.cn.gradle.lsn13','-S','src/main/res2','--auto-add-overlay' // appt 执行时的额外参数
  cruncherEnabled true // 对 png 进行优化检查
  ignoreAssets '*.jpg' // 对 res 目录下的资源文件进行排除，把 res 文件下的所有 .jpg 文件打包到 apk 中
  noCompress '.jpg' // 对所有 jpg 文件不压缩
}
```

- `adbExecutable`: adb 路径
- `adbOptions`

```groovy
adbOptions {
  installOptions '-r','-d' // 调用 adb install 命令时默认传递的参数
  timeOutInMs 1000 // 执行 adb 命令的超时时间
}
```

- `compileOptions`

```groovy
compileOptions {
  encoding 'UTF-8' // java 源文件的编码格式，默认 utf8
  incrmental true // java编译是否使用 gradle 增量编译
  sourceCompatibility JavaVersion.VERSION_1_7 // java 源文件编译的 jdk 版本
  targetCompatibility JavaVersion.VERSION_1_7 // 编译出的 class 版本
}
```

- `dataBinding`

```groovy
dataBinding {
  enabled = true
  version = "1.0"
  addDefaultAdapters = true
}
```

- `defaultPublishConfig`: 指定发布的渠道及 BuildType 类型。在 Library 中使用,默认 Release.
- `signingConfigs`: 签名配置列表，供不同渠道和 buildType 使用.
- `lintOptions`

```groovy
lintOptions {
  quiet true // true -> 不报告分析的进度
  abortOnError false // true -> 发现错误时终止 gradle
  ignoreWarnings true // true -> 只报告错误
  absolutePaths true // true -> 当有错误时显示文件的全路径或绝对路径
  checkAllWarnings true // true -> 检查所有问题，包括默认不检查问题
  warningsAsErrors true // true -> 将所有警告视为错误
  disable 'TypeographyFractions','TypographyQUotes' // 不检查给定问题 id
  enable 'RtlHardCoded','RtlCompat','RtlEnabled' // 检查给定问题 id
  check 'NewApi','InlinedApi' // 仅 检查给定问题 id
  noLines true // 如果为 true,则在错误报告的输出中不包含源代码行
  showAll true // true -> 对一个错误的问题显示它所在的所有地方，而不会截短列表等等。
  lintConfig file('default-lint.xml') // 重置 lint 配置(使用默认的严重性等设置)
  textReport true // true -> 生成一个问题的纯文本报告(default -> false)
  textOuput 'stdout' // 默认写入输出结果的位置，可能是一个文件或 stdout
  xmlReport false // true -> 生成 xml 报告，jenkins 可以使用
  xmlOutput file("lint-report.xml") // 写入报告的文件，默认 line-results.xml
  htmlReport true // html 报告
  htmlOutput file('lint-report.html') // 写入报告的路径，可选(默认为构建目录下的 lint-results.html)
  checkReleaseBuilds true // true -> 将使所有 release 构建都以 issus 的严重性级别为 fatal (serverity=false)的设置来运行 lint,且如果发现了致命(fatal)的问题,将会中止构建(由上面提到的 abortOnError 控制)
  fatal 'NewApi','InlineApi' // 设置给定问题的严重级别(serverity)为 fatal（即将会在 release 构建期间检查,即使 lint 要检查的问题没有包含在代码中）
  error 'Wakelock','TextViewEdits' // 设置给定问题的严重级别为 error
  warning 'ResourceAsColor' // 设置给定问题的严重级别为 warning
  ignore 'TypographyQUotes' // 设置给定问题的严重级别(serverity)为 ignore (和不检查该问题一样)
}
```

- `dexOptions`: 热修复差分包

```groovy
dexOptions {
  additionalParameters '--minimal-main-dex','--set-max-idx-number=10000' // dx 命令附加参数
  javaMaxHeapSize '2048m' // 执行 dx 时 Java 虚拟机可用的最大内存大小
  jumboMode true // 开启大模式，所有的 class 打到一个 dex 中,可以忽略 65535 方法数的限制, 大于14版本可用
  keepRuntimeAnnotatedClasses true // 在 dex 中是否保留 Runtime 注解,默认 true
  maxProcessCount 4 // dex 中的进程数,默认 4
  threadCount 4 // 默认线程数
  preDexLibraries true // 对 library 预编译，提高编译效率，但 clean 时较慢，默认 true
}
```

- `packagingOptions`

```groovy
packagingOptions {
  pickFirsts = ['META-INF/LICENSE'] // 当有重复文件时，打包会报错。此配置会使用第一个匹配的文件打包进入 apk
  merge 'META-INF/LICENSE' // 重复文件会合并打包
  exclue 'META-INF/LICENSE' // 打包时排除匹配文件
}
```

- `sourceSets`

```groovy
sourceSets {
  main {
    res.srcDirs 'src/main/res'
    jniLibs.srcDirs = ['libs']
    aidl.srcDirs 'src/main/aidl'
    assets.srcDirs 'src/main/assets'
    java.srcDirs 'src/main/java'
    jni.srcDirs 'src/main/jni'
    renderscript.srcDirs 'src/main/renderscript'
    resources.srcDirs 'src/main/resources'
    manifest.srcFile 'src/main/AndroidManifest.xml'
  }
  // 除了 main,也可给不同的渠道指定不同的配置
  free {

  }
}

```

- `splits`: google play 按 CPU/屏幕像素密度打包

```groovy
splits {
  abi {
    enable true // 开启 abi 分包
    universalApk true // 是否创建一个包含所有有效动态库的 apk
    reset() // 清空 defaultConfig 配置
    include 'x86','armeabi' // 和 defaultConfig 做和集
    eclude 'mips'
  }

  density {
    enable true // 开启 density 分包
    reset() // 清空默认
    include  'xhdpi','xxhdpi' // 和集
    exclude 'mdpi'
  }

  language {
    enable true
    include 'en','cn'
  }
}
```

- `variantFilter`: 过滤通过 flavor 和 buildType 构建的 apk

```groovy
variantFilter { variant ->
  def buildTypeName = variant.buildType.name
  def flavorName = variant.flavors.name

  if (flavorName.contains("360") && buildTypeName.contains("debug")) {
    // 不生成匹配的 apk
    setIgnore(true)
  }
}
```

- `com.android.library`

```groovy
android.libraryVariants.all { variant ->
  def mergedFlavor = variant.getMergedFlavor()
  mergedFlavor.manifestPlaceholers = [hostName:'www.example.com']
}
```
