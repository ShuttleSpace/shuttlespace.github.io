---
title: libgit2 android交叉编译
date: 2020-04-25 18:10:13
tags:
---
libgit2 是一个跨平台、可在自己应用中链接的 git 实现库.
<!--more-->
`libgit2`是一个便携、纯C实现 git 核心功能的依赖库.当前已经实现了多种语言绑定,如 `Rugged(Ruby)`、`LibGit2Sharp(.NET)`、`pygit2(Python)`、`NodeGit(Node)`等.

git GUI 客户端如 `GitKraken` 和 `gmaster`,git 托管平台如 `GitHub`,`GitLab`和`Azure DevOps`都是基于此实现的.每一次`merge pull request` 都是通过 libgit2 来实现的.

最近 libgit2 刚刚放出 1.0 版本,那么先来个 android 交叉编译吧.


#### 环境

    macos 
    NDKr21

#### 步骤
1、下载源码

    `git clone git@github.com:libgit2/libgit2.git`

2、配置 openSSL(可跳过)

    因为 libgit2 支持 openSSL,所以先编译 openSSL.
    下载源码,configure/make 即可

3、配置工具链

- 在 NDKr21 中,已经将各个架构、各个API的工具预编译好了,不用再如 README 所说(通过 make-standalone-toolchain.sh 脚本来准备了).

- 在项目根目录(随意) 添加 CMakeLists.android.txt(名称随意).

```cmake
SET(CMAKE_SYSTEM_NAME Linux)
SET(CMAKE_SYSTEM_VERSION Android)
SET(NDK_HOME /Users/aka/Library/Android/sdk/ndk/21.0.6113669/)
SET(OPENSSL_DYHOME /Users/aka/Downloads/source/openssl)

SET(CMAKE_C_COMPILER ${NDK_HOME}toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android21-clang)
SET(CMAKE_CXX_COMPILER ${NDK_HOME}toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android21-clang++)
SET(CMAKE_FIND_ROOT_PATH ${NDK_HOME}toolchains/llvm/prebuilt/darwin-x86_64/sysroot)
SET(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
SET(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
SET(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
SET(OPENSSL_ROOT_DIR ${OPENSSL_DYHOME})
SET(OPENSSL_INCLUDE_DIR ${OPENSSL_DYHOME}/include)
SET(OPENSSL_CRYPTO_LIBRARY ${OPENSSL_DYHOME}/libcrypto.so)
SET(OPENSSL_SSL_LIBRARY ${OPENSSL_DYHOME}/libssl.so)
add_definitions("--sysroot=${CMAKE_FIND_ROOT_PATH}")
```
- `mkdir build && cd build`
- `cmake -DCMAKE_TOOLCHAIN_FILE=../CMakeLists.android.txt`
- `cmake --build .`

4、大功告成!

### 约定俗成

#### 公开 API
调用函数时遵循以下几点在很大程度上可以少走弯路.
- 属性访问通常会直接返回值(如 `int` 或 `const char *`),但如果函数调用失败,那么将返回一个`int`值,且返回值在参数列表的第一位,跟在此函数正在操作的对象之后,可能也会需要其他的参数
- 如果一个函数返回值是个对象,那么此函数是个 `getter` 函数,这个对象的生命周期和它的父对象绑定.如果函数返回值的第一个参数是指针类型的,那么它的生命周期由调用者控制,必要的时候应该被释放.返回的 `String` 通过 `git_buf` 代替,以便可以复用和安全释放.
- 大多数 `libgit2` 和 I/O 相关的操作失败可能是因为从文件系统获取数据导致的各种个样的错误和复杂的原因.
- `Git` 系统中的路径之间是以 / (0x2F) 分隔的.如果一个函数接受某个磁盘上的路径,那么在 Windows 上就可以使用 \ (0x5C) 作为分隔.
- 不要混用内存申请.在 `libgit2` 中如果需要申请内存,通常情况下没有合适的释放函数推荐.请使用针对各自对象类型的释放函数.

#### 兼容性

`libgit2` 可以通过各种不同的编译器运行在不同的平台上.

`libgit2` 的公开 API 是 `ANISI C(c89)` 兼容的.

`libgit2` 内部使用 C99 的便携子集-以便最大兼容各种平台(如 MSVC),避免特定 C99 的扩展等.局部变量都是在块的顶部声明,同时避免使用 // 注释.

为了提高扩展性,我们在代码内避免使用 `#ifdef` 语句.通常情况下,这是不可避免的,因为它会导致难以维护,所以我们尽量避免使用这些语句.

#### 和上下文匹配

如果要从此文档中只提炼一条规则出来,那就是<i style="background:white;color:black">新添加的代码应该和上下文匹配,使得看不出来新旧代码的区别</i>.对我们来说,代码的一致性比括号的位置或使用空格还是 tab 的争论更重要.

我们接受代码重构,但是拒绝仅仅格式化的提交.

#### 命名

所有导出的类型和函数都是以 `git_` 开头,所有的 `#define` 宏都是以 `GIT_` 开头.`libgit2` 的 API 通常都是分散在和其头文件对应的函数模块中.模块中的所有函数都应该像这样命名 `git_modulename_functionname()（如 git_repository_open()）`

仅有一个输出参数的函数的入参应命名为 `out`.多输出函数的入参应命名为 `foo_out`、`bar_out` 等.

`git_oid` 类型的参数应该命名为 `id` 或 `foo_id`.返回 `git_oid` 类型的函数参数应命名为 `git_foo_id`.

如果传入闭包函数,那么同时应提供一个名为 `void*` 的额外输入参数负载以便在闭包被调用时传入.

#### 类型定义

无论何时都应使用 `typedef`.如果某个结构体仅是函数指针的集合,那么指针类型是不必单独定义的,但是松散的函数指针类型(此处应值非全函数指针的结构体)应该定义类型.

#### 导出

所有导出的函数都应如下声明:
`GIT_EXTERN(result_type) git_modulename_functionanme(arg_list);`

#### 内部消息

命名模块的函数应遵从两个下划线,如`git_odb__read_packed`,是半私有的函数.通常应该在 `libgit2` 内部使用,未来可能会被废弃或者声明发生变化.

#### 函数参数

第一个是输出参数.

无论何时,出入的指针参数必须是 `const`,某些结构体内部通过可变结构来阻止这一特性(如 `git_repository 和 git_index`).

回调总是使用 `void*` 负载作为它的最后一个参数,回调指针总是和负载匹配,通常情况下都在参数列表的最后:
`int git_foo(git_repository *repo,git_foo_cb callback,void *payload);`

#### 内存所属

谁申请的内存谁负责释放;但某些返回指向某个 buffer 的指针则归其他对象所有.

#### 返回代码

大多数公开 API 都应返回 `int` 类型的错误码.和大多数 C 函数库类似,0 表示成功,负数表示失败.

某些绑定会把错误码转为精确的异常类型.所以返回一个语义明确的错误码hin重要.查看`include/git2/errors.h`了解更多错误码.

在你自己的实现中,使用 `git_error_set()` 给调用者提供更多的额外信息.

如果 `libgit2` 函数内部调用另一个函数报错,但是错误没有向上抛,使用 `git_error_clear()` 来阻止调用者之后获取到该错误信息.

#### 结构体

大多数公开的类型都应该是不透明的,如:`typedef struct git_odb git_odb;`

在库函数声明时就返回一个新实例,而不是在应用里.这样有助于不改动客户端代码增加(压缩)大小.

为了保证 ABI 兼容性,在所有全局可见的结构体中引入 `int version` 属性,同时在初始化结构体时赋予最新的值.只要结构体发生变化,则增加 `latest` 值,并且此值仅在结构体末尾声明.

#### 可选结构体

如果某个函数参数列表过多,那么可以把他们封装为一个可选的结构体.确保他们的全局可见的,包含 version 属性,提供初始化常量或构造方法. 使用起来就hin简单了.
```
git_foo_option opts = GIT_FOO_OPTIONS_INIT;
opts.baz = BAZ_OPTION_ONE;
git_foo(&opts);
```
#### 枚举

定义所有的枚举类型.如果每个选项都是独立的,那么使用枚举类型作为传入参数.如果是位移操作后的标记,使用 `unsigned int 或 uint32_t` 或其他合适的类型.

#### 代码布局

尽量保持一行最多80个字符.这个要求不是很严格,很明显超过 80 字符就很不好看了.按照惯例对代码对齐,公开函数声明可以使用不同的风格.
```
/** All on one line is okay if it fits */
GIT_EXTERN(int) git_foo_simple(git_oid *id);

/** Otherwise one argument per line is a good next step */
GIT_EXTERN(int) git_foo_id(
	git_oid **out,
	int a,
	int b);
```
使用 tab 缩紧,8 位最佳.

避免多余空格,新行使用 Unix 风格(如仓库没有 CRLF-如果是在 windows 机器码字,那么设置 `core.autocrlf` 为 true)

#### 文档

所有的注释都应以 Doxygen 的 `javadoc` 风格作为公开 API 函数的格式化风格.尽量对每个参数注释,如果参数列表改变,那么随手更新.

#### 公开头模版

如果创建新的公开头文件使用如下作为头模版:
```
#ifndef INCLUDE_git_${filename}_h__
#define INCLUDE_git_${filename}_h__

#include "git/common.h"

/**
 * @file git/${filename}.h
 * @brief Git some description
 * @defgroup git_${filename} some description routines
 * @ingroup Git
 * @{
 */
GIT_BEGIN_DECL

/* ... definitions ... */

/** @} */
GIT_END_DECL
#endif
```
#### 内联函数

所有的内联函数都应如下声明

`GIT_INLINE(result_type) git_modulename_functionname(arg_list);
`

为了保证 ANSI C 兼容,`GIT_INLINE 或 inline` 都不应该出现在公开 API 头文件.

#### 测试

`libgit2` 使用 `clar` 测试框架.

Balahbalah...J