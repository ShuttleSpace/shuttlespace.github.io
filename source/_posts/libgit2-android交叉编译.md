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