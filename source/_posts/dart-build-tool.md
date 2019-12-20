---
title: dart-build tool
date: 2019-12-20 10:37:32
tags:
---
### 使用 `build_runner` 作为开发服务
1、在 `pubspec.yaml`中添加`build_runner`和`build_web_compilers`

```yaml
environment:
  sdk: '>=2.0.0 <3.0.0'
dev_dependencies:
  build_runner: ^1.0.0
  build_web_compilers: ^0.4.0
```
2、下载依赖
```shell
pub get
```
3、启动服务
```shell
pub run build_runner serve
```
服务启动后,每次保存操作都会触发重新构建.

### 创建输出文件夹

使用`--output <directory name>`选项构建,将内部引用 URL 匹配的文件路径和`directory name`合并作为输出目录,将文件写入.
此选项可以在`build,watch,serve`命令中使用.如果没有使用 `serve`命令时,此目录同时被另一个不同的 server 使用.
如果只想输出包的一部分,比如`web`目录,可以使用`--output web:<directory name>`.

### 使用其他 `build_runner` 命令

- `build`: 执行单独构建然后退出.如果你的构建会把产物输出到源码文件中会很有用.使用`--output <dirname>` 可以将所有的源和生成的产物输出到合并目录中.
- `watch`: 类似 `build`,但是在文件改变时返回.使用`--output <dirname>`将数据的改变保存到合并的目录中.可以保持输出持续更新和其他基于文件的开发服务器配合使用.
- `test`: 创建输出目录然后运行`pub run test`.此命令需要 `dev dependency`中有`build_test`依赖.

### 切换到 dart2js

默认情况下 `build_web_compilers`使用`dartdevc`.如果需要切换到 dart2js,在 `pub run build_runner build/serve`后传递`--release`选项.在`build.yaml`文件中配置.
```yaml
targets:
  $default:
    builders:
      build_web_compilers|entrypoint:
        optioins:
          dart2js_args:
            - --minify
            - --fast_startup
```

## `build.yaml` 格式

`build.yaml` 文件按照 `BuildConfig`对象配置.

### BuildConfig


| key | value   | default                                                 |
| ------ | ------ | --------  |
| `targets`     | `Map<String,BuildTarget>` | a single target with the same name as the package      |