---
title: JGit
date: 2019-03-16 11:47:07
tags:
---

## 前言

JGit 是一个基于 EDL(BSD 协议的变种)授权的轻量级、实现 Git 版本控制系统功能(常规仓库访问,网络协议,版本控制核心算法)的纯 Java 库.
<!-- more -->
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

JGit 在 `org.eclipse.jgit.ant` 包中提供了 Ant 任务功能.
添加依赖

```xml
<taskdef resource="org/eclipse/jgti/ant/ant-tasks.properties">
    <classpath>
        <pathelement location="path/to/org.eclipse.jgit.ant-VERSION.jar"/>
        <pathelement location="path/to/org.eclipse.jgit-VERSION.jar"/>
        <pathelement location="path/to/jsch-0.1.44-1.jar"/>
    </classpath>
</taskdef>
```

提供了 `git-clone、git-init、git-checkout`任务.

#### git-clone

```xml
<git-clone uri="http://egit.eclipse.org/jgit.git"/>
```

- uri(必须)
- dest(可选): 克隆的目标文件地址.默认使用基于 uri 路径最后一个组件作为可识别的名称的文件夹.
- bare(可选): true/false/yes/no 表示是否克隆 bare 仓库. 默认 false
- branch(可选): 默认 HEAD

#### git-init

```xml
<git-init/>
```

- dest(可选): 默认 \$GIT_DIR 或当前文件夹
- bare(可选)

#### git-checkout

```xml
<git-checkout src="path/to/repo" branch="origin/experimental"/>
```

- src(必须)
- branch(必须)
- createbranch(可选): true/false/yes/no 是否会创建新 branch。默认 false.
- force(可选): true/false/yes/no 如果 true/yes,命名的 branch 已存在，已存在 branch 的起点将会被设置到新的起点。如果 false,存在的 branch 不会被改变.默认 false.

#### git-add

TODO

### 代码片段

#### 获取某一提交记录的子记录

```java
PlotWalk revWalk = new PlotWalk(repo());
ObjectId rootId = (branch == null) ? repo().resolve(HEAD) : branch.getObjectId();
RevComment root = revWalk.parseCommit(rootId);
revWalk.markStart(root);
PlotCommitList<PlotLane> plotCommitList = new PlotCommitList<PlotLane>();
plotCOmmitList.source(revWalk);
plotCommitList.fillTo(Integer.MAX_VALUE);
return revWalk;
```

### 高级主题

#### 使用 RevWalk 减少内存使用

revision walk 接口和 RevWalk，RevCommit 类轻量级设计。然而当面对相当大的仓库时它们可能仍然需要很多内存。接下来提供了一些方法在遍历修订图(walking the revision graph)时减少内存。

#### 限制遍历修订图(Restrict the walked revision graph)

仅遍历那些必要的图.即如果查找 refs/heads/master 而不是 refs/remotes/origin/master 的提交记录,确保对 refs/heads/master 调用 markStart(),对 refs/remotes/origin/master 调用 markUninteresting(). RevWalk traversal 讲只解析对你有用的提交记录,而且会避免在历史记录中查询.这讲减少内部 object map 的大小,因此减少整体内存占用.

```java
RevWalk walk = new RevWalk(repository);
ObjectId from = repository.resolve("refs/heads/master");
ObjectId to = repository.resolve("refs/remotes/origin/master");

walk.markStart(walk.parseCommit(from));
walk.markUnInteresting(walk.parseCommit(to));
```

#### 丢弃提交记录内容

`setRetainBody(false)` 可以用来丢弃提交记录内容，如果你不需要作者，提交者，或信息等.不需要该数据的例子如只使用 RevWalk 完成 branch merge 或使用 git rev-list 完成相关功能.

```java
RevWalk walk = new RevWalk(repository);
walk.setRetainBody(false);
```

如果确实需要这些信息，可以考虑拆分你需要的数据然后对 RevCommit 调用 dispose().如果需要长时间使用这些信息,你会发现 JGit 内部使用的内存比你自己处理占用的内存要少，特别是需要全部的信息时。这是因为 JGit 内部使用 byte 数组保存 UTF-8 编码的信息.如果使用 UTF-16 编码的 Java String 占内存将会变大，假设大部分的消息是 US-ASCII 编码的.

```java
RevWalk walk = new RevWalk(repository);
Set<String> authorEmails = new HashSet<String>();
for (RevCommit commit : walk) {
    authorEmails.add(commit.getAuthorIdent().getEmailAddress());
    commit.dispose();
}
```

#### RevWalk 和 RevCommit 的子类

如果需要获取某个提交记录的更多信息，可以考虑使用 RevWalk RevCommit 的子类, RevWalk.createCommit() 构建 RevCommit 子类的实例。然后将更多的信息存入 RevCommit 子类,这样就不需要额外的 HashMap 将 RevCommit 或 ObjectId 转换为 自定义的数据属性.

```java
public class ReviewedRevision extends RevCommit {
    private final Date reviewDate;

    private ReviewedRevision(AnyObjectId id,Date reviewDate) {
        super(id);
        this.reviewDate = reviewDate;
    }

    public List<String> getReviewedBy() {
        return getFooterLines("Reviewed-by");
    }

    public Date getReviewDate() {
        return reviewDate;
    }

    public static class Walk extends RevWalk {
        public Walk(Repository repo) {
            super(repo);
        }

        @Override
        protected RevCommit createCommit(AnyObjectId id) {
            return new ReviewedRevision(id,getReviewDate(id));
        }

        private Date getReviewDate(AnyObjectId id) {

        }
    }
}
```

#### 遍历修订后清理

RevWalk 无法缩小内部的 object map.如果刚完成了遍历仓库的所有历史，这将会将所有东西加载到 object map，并且无法被释放.如果再不需要这些数据，好的习惯是丢弃这个 RevWalk，然后为下次遍历重新申请新的 RevWalk。这样 GC 就会回收垃圾。另外，重用一个存在 的 object map 比完全重新创建一个新的更快.所以你需要平衡内存回收和用户渴望更快的操作之间的关系.

```java
RevWalk walk = new RevWalk(repository);
for (RevCommit commit : walk) {}
walk.repository();
```

### 功能列表

- 通用仓库操作
  - [打开存在的 git 仓库]()
  - [创建新的 git 仓库]()
- git 命令支持
  - [初始化新的仓库]()
  - [添加新文件到索引中]()
  - [向存在的仓库提交文件]()
  - [提交所有更改]()
  - [列出提交记录,如 Log]()
  - [列出仓库的所有标签]()
  - [列出仓库的所有分支]()
  - [列出仓库的所有提交记录]()
  - [列出仓库所有未提交的更改]()
  - [创建/删除分支]()
  - [创建/删除标签]()
  - [回退被修改的追踪文件到最近提交记录中的初始状态]()
  - [返回两个分支的 diff]()
  - [显示两个 revs 中同一个文件的改变 diff]()
  - [显示两个提交记录中所有文件的改变 diff]()
  - [显示两个提交记录中同一个文件的改变 diff,当文件被重命名后]()
  - [显示状态]()
  - [把分支中的内容存储到一个压缩文件中]()
  - [使用自定义的打包格式将分支中的内容写入到一个压缩文件中]()
  - [Blame,例如查找那个提交记录改变了某个文件的特定行]()
  - [添加/列出提交记录附带的笔记]()
  - [列出所有可用的笔记]()
  - [清理所有未追踪的文件]()
  - [创建/列出/提交/丢弃 stashes]()
  - [运行垃圾回收]()
  - [Blame,如查找谁最后修改了某文件的特定行]()
  - [合并某一分支的修改]()
  - [列出两个提交记录修改的所有文件]()
- 供远程仓库使用的命令
  - [复制远程仓库到本地的新文件夹中]()
  - [在一个仓库中迭代远程引用]()
  - [不克隆列出远程仓库的所有 heads/tags]()
  - [fetch from remote repository]()
  - [fetch from remote repository 且使用 `prune` 移除过期的远程 branches/tags]()
  - [使用 SSH 协议/用户名密码验证克隆远程仓库]()
  - [对一个 upstream 分支执行 Rebase]()
  - [使用 InMemoryRepository 在内存中克隆一个仓库，并且在内存中完成操作]()
- 底层 API
  - [从一个命名 ref (refs/heads/master) 中获取 SHA-1]()
  - [从一个名称或 SHA-1 获取提交记录对象]()
  - [获取提交信息]()
  - [从提交记录对象，名称，SHA-1 获取 tree 对象]()
  - [读取 file/blob 的内容]()
  - [从名称，SHA-1 获取 tag 对象]()
  - [解析复杂的引用(如 HEAD^^)为 SHA-1]()
  - [迭代一个分支的所有提交记录]()
  - [迭代某个范围内的提交记录]()
  - [从特定的提交记录中读取特定文件的内容]()
  - [列出当前仓库的远程配置]()
  - [从 Git 中打印出用户的信息]()
  - [读取文件属性，如可执行状态，是文件还是文件夹，大小等]()
  - [使用 BranchTrackingStatus 类获取当前分支相对于远程分支超前/落后的提交记录]()
  - [检查其他分支的某个提交是否被合并到了给出的分支]()
  - [列出作为某个特定提交记录或标签的文件夹中的所有文件]()
  - [循环迭代某个提交的文件]()
  - [非循环迭代某个提交的文件]()
  - [查找所有可以通过 tags,branches,remotes,HEADs...等可访问的提交记录]()
- 缺失的代码片段
  - [迭代仓库的所有提交](https://gerrit.googlesource.com/plugins/branch-network/+log/refs/heads/master/src/main/java/com/googlesource/gerrit/plugins/branchnetwork/data/JGitFacade.java)
  - [单元测试](https://github.com/eclipse/jgit/tree/master/org.eclipse.jgit.test/tst/org/eclipse/jgit/api)
  - [子模块](http://www.codeaffine.com/2014/04/16/how-to-manage-git-submodules-with-jgit/)(http://stackoverflow.com/questions/13426798/jgit-read-gitmodules)
  - [diffing](http://stackoverflow.com/questions/12987364/how-to-diff-with-two-files-by-jgit-without-creating-repo)
  - [修改之前的提交](http://stackoverflow.com/questions/4772142/jgit-unstaging-files-removing-files-from-the-index-and-ammending-a-commit)
  - [从索引中移除一个文件](http://stackoverflow.com/questions/4803462/jgit-java-git-library-unstaging-files)
  - [Amazon S3 上的 git 仓库](http://www.fancybeans.com/blog/2012/08/24/how-to-use-s3-as-a-private-git-repository/)
  - [cherrypick](http://stackoverflow.com/questions/18300898/how-to-cherry-pick-a-commit-that-has-more-than-one-parent)
  - [更多授权](http://www.lordofthejars.com/2016/09/authenticating-with-jgit.html)
