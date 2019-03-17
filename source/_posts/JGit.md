---
title: JGit
date: 2019-03-16 11:47:07
tags:
---

## 前言

JGit 是一个基于 EDL(BSD 协议的变种)授权的轻量级、实现 Git 版本控制系统功能(常规仓库访问,网络协议,版本控制核心算法)的纯 Java 库.

## 入门

### 获取

在[仓库搜索引擎](https://mvnrepository.com/)中搜索 jgit 即可获取各种添加依赖的方式.我现在基本使用的是 gradle 依赖

```groovy
implementation("org.eclipse.jgit:org.eclipse.jgit:5.3.0.201903130848-r")
implementation("org.eclipse.jgit:org.eclipse.jgit.http.server:5.3.0.201903130848-r")
```

JGit 也具有 CLI(功能比 git CLI 少),可以试一下 JGit 的功能.

#### 手动编译 JGit CLI

假设已经 clone EGit 仓库. `git clone https://git.eclipse.org/r/jgit/jgit.git` [具体查看](https://wiki.eclipse.org/EGit/Contributor_Guide#JGit)

```bash
~/src/jgit$ mvn clean install
# 进入 jgit 可执行文件所在文件夹
org.eclipse.jgit.pgm/target/jgit
# 查看 version 命令
prompt$ ./jgit version
jgit version xxxxx
# 如果经常使用 jgit 命令,可以添加执行链接(通常在 /usr/local/bin)
sudo ln -s /path/to/jgit /usr/local/bin/jgit
```

#### 在 JGit CLI 运行命令

```bash
prompt$ ./git
# 会列出最常用的命令
jgit --git-dir GIT_DIR --help (-h) --show-stack-trace command [ARG ...]

The most commonly used commands are:
 branch   List, create, or delete branches
 clone    Clone a repository into a new directory
 commit   Record changes to the repository
 daemon   Export repositories over git://
 diff     Show diffs
 fetch    Update remote refs from another repository
 init     Create an empty git repository
 log      View commit history
 push     Update remote repository from local refs
 rm       Stop tracking a file
 tag      Create a tag
 version  Display the version of jgit

 # 常用的 debug test 命令
 prompt$ ./jgit debug-show-commands
```

##### 查看仓库

在查看最常用的命令之前，你可能想知道该仓库包含了多少分支，当前分支是那个.使用 branch -v 可以获取所有分支的简略信息，版本号，版本号提交信息的第一行.

```bash
prompt$ ./jgit branch -v
#  master       4d4adfb Git Project import: don't hide but gray out existing projects
# * traceHistory 6b9fe04 [historyView] Add trace instrumentation

# 和 git-log 一样 log 命令显示提交信息
jgit log --author Math --grep tycho master
# 显示 master 分钟中，作者名包含 Math,提交信息包含 tycho 的搜有提交信息.
# commit xxxx
# Author: Math xxxx
# Date: xxx
# Update build to use tycho x.xx.x
# ...
# 大多数的搜索都会精确过滤提交日志，如提交者姓名等
```

##### 历史图形化

`jgit glog`

### 核心概念

#### API

#### 仓库

Repository 管理所有的项目和引用，管理代码

```kotlin
    val repository = FileRepositoryBuilder()
        .setGitDir(File("/my/git/directory"))
        .readEnvironment() // 扫描 GIT_* 环境变量
        .findGitDir() // 扫描文件系统
        .build()
```

#### Git 对象

在 Git object model 所有的对象都是由 SHA-1 id 表示.在 JGit 中是由 `AnyObjectId` 和 `ObjectId`类表示.
在 Git object model 中定义了四种对象类型:

- blob: 用于存储文件对象
- tree: 可以看作一个文件夹，指向其他的 tree 或 blob
- commit: 指向一个 tree 的提交信息
- tag: 突出提交信息,通常用来标记特殊的 release 版本.

为了从一个仓库中识别一个对象，只要传入一个正确的 revision 字符串即可

```kotlin
    val head = repository.resolve("HEAD")
```

#### Ref

ref 是一个包含单个对象标识符的变量.对象标识符可以是任何 Git 合法对象(blob,tree,commit,tag)
例如,获取 head 的引用.

```kotlin
    val HEAD = repository.findRef("refs/heads/master")
```

#### RevWalk

RevWalk 遍历 commit graph，并按顺序生成匹配的 commit

```kotlin
    val revWalk = RevWalk(repository)
```

#### RevCommit

RevCommit 表示 Git object model 中的一个 commit

```kotlin
    val commit = walk.parseCommit(objectIdOfCommit);
```

#### RevTag

RevCommit 表示 Git object model 中的一个 Tag

```kotlin
    val tag = walk.parseCommit(objectIdOfTag);
```

#### RevTree

RevCommit 表示 Git object model 中的一个 tree

```kotlin
    val tree = walk.parseCommit(objectIdOfTree);
```

### 参考

虽然 JGit 包含了许多和 Git 仓库交互的低级代码，同时还有一些参考`org.eclipse.jgit.apit`包中 Git porcelain 命令的高级 API.

#### 添加命令(git-add)

add 命令可以向索引中添加文件，同时可以通过 setter 方法配置

- addFilepattern()

```kotlin
val git = Git(repository)
git.add()
    .addFilepattern("/dir")
    .call()
```

#### 提交命令(git-commit)

- setAuthor()
- setCommitter()
- setAll()

```kotlin
git.commit()
    .setAuthor("author","email")
    .setMessage("message")
    .call()
```

#### tag 命令(git-tag)

- setName()
- setMessage()
- setTagger()
- setObjectId()
- setForceUpdate()
- setSigned(): 暂不支持，会抛异常

```kotlin
git.tag()
    .setName("tag")
    .call()
```

#### log 命令(git-log)

- add(AnyObjectId start)
- addRange(AnyObjectId since,AnyObjectId until)

```kotlin
git.log()
    .add(head)
    .call()
```

#### merge 命令(git-merge)

TODO

#### Ant 任务
