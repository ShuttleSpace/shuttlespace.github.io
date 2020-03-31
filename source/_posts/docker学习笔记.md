---
title: docker,docker-compose学习笔记
date: 2019-03-01 18:06:57
tags:
  - docker
  - 学习笔记
---

## Overview

Compose 是一个为了定义和运行多容器 Docker 应用的工具。
[官方动手示例](https://github.com/docker/labs)
<!-- more -->
### 特性

- 一个主机多个隔离环境
- 当容器创建时保留所有的 volume
- 只有容器被更改时才触发创建
- 定义变量和在不同环境中使用

### 使用场景

- 自动测试环境
- 单独主机部署

### docker-compose 安装

```shell
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
sudo docker-compose --version
```

pip 安装

```shell
pip install docker-compose
```

卸载

```shell
sudo rm /usr/local/bin/docker-compose
pip uninstall docker-compose
```

### docker-compose 命令

- `-f` 指定 一个或多个 compose 文件的名称和路径
  > 1、使用多个 Compose 文件时，Compose 会把这几个文件合并为一个配置。按顺序合并，后边的覆盖前边的配置。
  > 2、`docker-compose -f docker-compose.yml -f docker-compose.admin.yml run backup_db`
  > 3、使用 `-(dash)` 作为 `-f` 的值，将会从输入中读取配置文件名。使用 `stdin` 时，配置里涉及到的路径都是相对于当前工作上下文路径。
  > 4、如果不是用 `-f`,Compose 遍历当前上下文路径和它的父路径查询 `docker-compose.yml` 和 `docker-compose.override.yml` 文件。请至少提供一个 `docker-compose.yml` 文件。如果所有的文件都在同一个文件夹下，Compose 将合并它们。
  > 5、`docker-compose.override.yml` 的配置高于 `docker-compose.yml`,且为后者提供额外的配置属性。
- 为单独的 Compose 文件指定路径
  > 1、使用 `-f`, 或从命令行输入，或在 shell / 某个环境配置文件中设置 COMPOSE_FILE 环境变量,指定不在当前文件夹的 Compose 文件路径.
  > 2、`docker-compose -f ~/sandbox/rails/docker-compose.yml pull db` 从 `~/sandbox/rails/docker-compose.yml` 文件中获取 db 服务中定义的 postgres db 镜像。
- `-p` 指定项目名
  > 1、如果不指定 `-p`,Compose 默认使用当前文件夹的名称。
- 配置环境变量

### docker-compose CLI 环境变量

默认内置了几个环境变量可以配置 docker-compose.
以 `DOCKER_` 开头的变量和配置 docker 命令行客户端的变量类似。如果使用 `docker-machine`的话，`eval "$(docker-machine env my-docker-vm)"`将为变量设置正确的值。

- `COMPOSE_PROJECT_NAME`
  > 1、设置项目名.该值在启动时会作为容器服务的前缀.比如项目名 myapp,包含两个服务 db 和 web,那么 Compose 启动的容器名为 myapp_db_1 和 myapp_web_1.
  > 2、默认时项目文件夹的根目录名。
- `COMPOSE_FILE`
  > 1、指定 Compose 文件路径。如果未指定，Compose 将在当前文件夹查询 docker-compose.yml 文件，如果不存在将继续遍历父目录直到找到。
  > 2、支持使用文件路径分隔符(Linux & MacOS [:] Windows [;]).比如 `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml`,路径分隔符可以通过 `COMPOSE_PATH_SEPARATOR` 自定义
- `COMPOSE_API_VERSION`
  > 1、Docker API 仅支持来自指定版本客户端的请求。使用 docker-compose 时出现 `client and server don't have same version` 错误，那么可以通过设置该变量解决。
  > 2、设置该变量主要针对临时的运行客户端和服务端版本不一致的情况。
- `DOCKER_HOST`
  > 1、为 docker daemon 设置 URL.和 docker 客户端一样，默认为 `unix:///var/run/docker.sock`
- `DOCKER_TLS_VERIFY`
  > 1、设置空字符以外的任何值时，开启 TLS.
- `DOCKER_CERT_PATH`
  > 1、配置 `ca.pem,cert.pem,key.pem` 的路径。默认 `~/.docker`
- `COMPOSE_HTTP_TIMEOUT`
  > 1、超时时间(秒).默认 60s
- `COMPOSE_TLS_VERSION`
  > 1、TLS 版本.默认 TLSv1. 可供选项 TLSv1, TLSv1_1, TLSv1_2
- `COMPOSE_CONVERT_WINDOWS_PATH`
  > 1、是否开启把 Windos-style 的路径转为 Unix-style 的卷定义。在 Windos 上使用 Docker Machine 和 Docker Toolbox 时总是要设置该变量。默认 0。 true/1 代表开启，false/0 代表关闭.
- `COMPOSE_PATH_SEPARATOR`
  > 1、如果设置，COMPOSE_FILE 值将使用此处的定义作为分隔符。
- `COMPOSE_FORCE_WINDOWS_HOST`
  > 1、如果设置，即使 Compose 运行在 Unix-based 系统上，卷定义也将使用简略语法解析为假设运行在 Windows 上的路径。true/a,false/0
- `COMPOSE_IGNORE_ORPHANS`
  > 1、如果设置，Compose 不会试着对项目的单独容器检测。true/1,false/0
- `COMPOSE_PARALLEL_LIMIT`
  > 1、并行执行的限制。默认 64，绝不能低于 2.
- `COMPOSE_INTERACTIVE_NO_CLI`
  > 1、如果设置，Compose 不会尝试使用 Docker CLI 和 run exec 操作交互。true/1,false/0

### Compose file

#### version 3

##### build

配置选项在编译期生效。
build 可以指定一个路径

```yaml
version: "3"
services:
  webapp:
    build: ./dir
```

或者是一个在指定 context 下的路径对象，同时可包含 Dockerfile 和 args

```yaml
version: "3"
services:
  webapp:
    build:
      context: ./dir
      dockerfile: Dockerfile-alternate
      args:
        buildno: 1
```

如果同时也指定了 image,Compose 使用 webapp 和 image 中指定的可选的 tag 命名最终生成的镜像名

```yaml
build: ./dir
image: webapp:tag
```

> swarm mode 不支持。docker stack 命令只接受预编译的镜像.

###### CONTEXT

可以是包含 Dockerfile 文件的路径，或 git 仓库的 url.
如果是相对路径，那么被解析为相对于当前 Compose 文件的路径。此文件夹同时也是发送到 Docker daemon 的编译上下文。

###### DOCKERFILE

可选
此处必须指定编译路径

###### ARGS

只有在编译过程中可访问的环境变量。
首先，在 Dokcerfile 中指定参数:

```yaml
ARG buildno
ARG gitcommithash

RUN echo "Build number: $buildno"
RUN echo "Bashed on commit: $gitcommithash"
```

然后在 build 下给该参数复制（可以是键值对列表）：

```yaml
build:
  context: .
  args:
    buildno: 1
    gitcommithash: cdc3b19

build:
  context: .
  args:
    - buildno=1
    - gitcommithash=cdc3b19
```

你也可以不指定值，它的值就是编译时 Compose 当前运行环境的值.

> YAML 布尔值(true,false,yes,no,on,off)应该使用引号应用，这样解析器才能把它们解析为 string

###### CACHE_FROM

> v3.2+

指定 engine 可以缓存的镜像列表

```yaml
build:
  context: .
  cache_from:
    - alpine:latest
    - corp/webapp:3.14
```

###### LABELS

> v3.3+

向生成的镜像添加元数据。可以是数组或目录
推荐使用反向 DNS 标记以避免和其他软件冲突

```yaml
build:
  context: .
  labels:
    com.example.description: "Accounting webapp"
    com.example.department: "Finance"
    com.example.label-with-empty-value: ""

build:
  context: .
  labels:
    - "com.example.description=Accounting webapp"
    - "com.example.department=Finance"
    - "com.example.label-with-empty-value"
```

###### SHM_SIZE

> v3.5+

设置编译生成容器 `dev/shm'` 分区大小。int 值单位为 byte. string 可以携带单位

```yaml
build:
  context: .
  shm_size: '2gb'

build:
  context: .
  shm_size: 10000000
```

###### TARGET

> v3.4+

编译 Dockerfile 中定义的指定版本

```yaml
build:
  context: .
  target: prod
```

##### cap_add,cap_drop

添加或删除容器的容量。`man 7 capabilities` 查看可用列表

```yaml
cap_add:
  - ALL
cap_drop:
  - NET_ADMIN
  - SYS_ADMIN
```

> swarm mode 无效

##### cgroup_parent

为容器指定可选的 cgroup parent

```yaml
cgroup_parent: m-executor-abcd
```

> swarm mode 无效

##### command

覆盖默认的命令

```yaml
command: bundle exec thin -p 3000
```

也可以是列表

```yaml
command: ["bundle", "exec", "thin", "-p", "3000"]
```

##### configs

### Tips

- 共享文件夹，卷，绑定挂载
  > 如果你的项目不在 `Users`目录(`cd ~`),那么你需要共享驱动器或 Dockerfile 所在位置和当前正在使用的卷。如果出现运行时错误表示文件未找到，那么就是一个挂载卷的请求被拒绝，或服务启动失败，试着共享文件或驱动。挂载卷要求共享项目不在 `C:\Users (Windows)`,或 `/Users (Mac)` 的驱动，并且如果是运行在 `Dokcer Desktop for Windows` 的 Linux 容器上的所有应用都需要共享。
- 如果改变了一个服务的 Dockerfile 或者编译文件夹里的内容，运行 `docker-compose build`重新编译

### 官方示例

#### Compose & WordPress

- 为项目创建空文件夹。该文件夹作为应用的上下文，且只保存构建镜像所需的资源。
- 创建 docker-compose.yml

```yaml
version: "3.3"

services:
  db:
    image: mysql:5.7
    volumes:
      - db_data:/var/lib/mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: somewordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
  wordpress:
    depends_on:
      - db
    image: wordpress:latest
    ports:
      - "8000:80"
    restart: always
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
    volumes:
      db_data: {}
# db_data 卷会保存任何 WordPress 对数据库的改变。
# WordPress 通常开放 80 和 443 端口.
```

- `docker-compose up -d`.
  > 如果使用 Docker Machine, 那么运行 `docker-machine ip MACHINE_VM` 获取运行地址。如果是 destop 版，http://localhost 即可.
- `docker-compose down` 移除容器，默认的网络，保留 WordPress 和数据库。`docker-compose down --volumes` 全部移除。
