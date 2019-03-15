---
title: teamcity自动化更新hexo博客
date: 2019-03-09 23:26:22
tags:
  - teamcity
  - hexo
---

### 前言

在知乎找到了一个更好的方法: [原文](使用 hexo，如果换了电脑怎么更新博客？ - CrazyMilk 的回答 - 知乎
https://www.zhihu.com/question/21193762/answer/79109280)
在这里我整理一下:

- 创建仓库 xxx.github.io.
- 创建两个分支: master/hexo.(可在 github 网页或本地创建)
- `git clone git@github.com:xxx/xxx.github.io.git`
- 如果没有在网页创建分支,可以在此处创建.`git checkout -b master; git checkout -b hexo`
- 接下来执行 `npm install hexo; hexo init; npm i; npm i hexo-deployer-git`,此处在 `hexo` 分支操作
- 修改 \_config.yml 的 deploy 参数,此处在 `master` 分支操作.
- 我使用了`hexo-next-theme`,从 git 上下载后,进入 `themes/next` 执行 `git submodule init`,将 `next` 主题关联,此处在 `hexo` 分支操作
- `git add .; git commit -m "blahblahblah"; git push origin hexo;` 提交网站相关文件.
- `hexo g -d` 生成网站并部署到 `github`.

### 将 CNAME,图片等文件放入 `source` 目录下,可保证推送到 github 不会被删除.

#⚠️ 👇 胡扯,观看请谨慎!!!

`TeamCity` 是 `Jetbrains` 公司出品的持续化集成工具，类似`Jenkins`,界面更加现代化，功能更强大,而且它的 server 和 agent 是分离的，可以指定本机或远程的机器来运行构建策略，其中还有调度队列算法.
`hexo` 是静态博客生成工具.`hexo d -g`命令可以自动生成 `public` 文件夹及 HTML，然后将其推送到 github(在`_config.yml`中已经配置过).
一般用户可能对`theme`自定义(修改`theme`下的`_config.yml`),当换机或备份时，希望将博客源文件(\*.md)及修改的主题配置文件一并备份.而`hexo`默认只备份`public`文件夹,所以本文探索使用 CI`TeamCity`将推送到`Github`的源文件编译生成`public`文件,这样每次写完文章,只要将其推送到`Github`,`TeamCity`会自动生成博客`HTML`.

获取到该 Key.而实际上在 build 执行时 key 以 ing 被删除了,不可能获取到.这并不意味着绝对安全，只是增加了 key 被盗的难度. agent 必须安全.

### teamcity 安装

`TeamCity`提供了 `Docker`安装方式，因此请提前安装好`Docker`.
文件目录如下(请提前创建),teamcity 支持多种数据存储方式，此处使用 mysql 来存储。

```bash
# - teamcity
    - agent
        - conf
        - data
    - server
        - data
        - datadir
        - opt
    - mysql
        - backup
        - data
    dockery-compose.yml
```

接下来是`docker-compose.yml`

```yaml
``yaml
version: "3.3"
services:
  teamcity-server:
    image: jetbrains/teamcity-server
    container_name: teamcity-server
    restart: always
    ports:
      - 8111:8111
    volumes:
      - $PWD/server/datadir:/data/teamcity_server/datadir
      - $PWD/server/opt/logs:/opt/teamcity/logs
      - $PWD/server/data:/data/teamcity_server/others # 其他的一些资源，可以从本机复制到 server 上
    environment:
      #   TEAMCITY_SERVER_MEM_OPTS: -Xmx2g -XX:MaxPermSize=270m -XX:ReservedCodeCacheSize=350m
      MYSQL_USER: team-user
      MYSQL_PASSWORD: team-pwd
      MYSQL_ROOT_PASSWORD: teamcity8080
      MYSQL_DATABASE: teamcitydb
    depends_on:
      - db
    links:
      - db
    networks:
      - team

  db:
    image: mysql
    container_name: teamcity-db
    restart: always
    volumes:
      - $PWD/mysql:/etc/mysql/conf.d
      - $PWD/mysql/backup:/var/lib/mysql # 只有 /var/lib/mysql 对应本地文件为空，才会创建这个数据库,即初次创建时，这个对应的本地文件夹要为空
      - $PWD/mysql/data:/others
    environment:
      MYSQL_USER: team-user
      MYSQL_PASSWORD: team-pwd
      MYSQL_ROOT_PASSWORD: teamcity8080
      MYSQL_DATABASE: teamcitydb
    ports:
      - 3306:3306
    networks:
      - team

  # <><> agent <><>
  teamcity-agent:
    image: jetbrains/teamcity-agent
    container_name: teamcity-agent
    restart: always
    volumes:
      - $PWD/agent/conf:/data/teamcity_agent/conf
      - $PWD/agent/data:/data/teamcity_agent/others
    environment:
      AGENT_NAME: MacbookPro
      SERVER_URL: http://xxx.xxx.x.xxx:8111 # 此处对应的是 TeamCityServer 的IP, localhost/127.0.0.1 都不行，请使用正确的 IP,端口对应上面暴露出来的端口
    links:
      - teamcity-server
  # teamcity_agent 默认的任务环境路径: opt/buildagent/work

networks:
  team:
    driver: bridge
```

然后执行 `docker-compose up -d` 即可。

> 需要先根据本机 OS 安装`docker-compose` > `docker-compose up -d` 生成服务
> `docker-compose down` 解体服务，删除容器,网络
> `docker-compose start/stop` 启动终止服务

- 打开 `http://localhost:8111` 或 `http://[ip]:8111` 即可进入 TeamCity Server web 交互环境.按照提示初始化.登录时默认没有访客创建新用户的权限，所以需要已超级用户权限登录，点击下面的以超级权限登录后提示输入 token,可以进入 TeamCity Server 本地映射文件中查找，或是使用 `docker logs teamcity-server` 即可看到 token。

- 创建项目时，TeamCity 默认使用用户名密码连接 Github,当然可以通过上传本地 ssh key 密钥到 TeamCity Server,通过 TeamCity Server 连接.

- 设置编译步骤,我再次执行了`shell 脚本`

```bash
#! /bin/bash

# 安装 nodejs
VERSION=v10.15.2
DISTRO=linux-x64
function checkNode() {
  ISNODESUCCEED=$(node -v)
  if [ ISNODESUCCEED != $VERSION ]; then
    installNode
  else
    echo "NodeJS已安装"
  fi
}

function insallNode() {
  mkdir -p /usr/local/lib/nodejs
  tar -xJf /data/teamcity_agent/others/node-$VERSION-$DISTRO # -v 会输出解压日志，此处太多，所以关闭

  export PATH=/usr/local/lib/nodejs/node-$VERSION-$DISTRO/bin:$PATH

  source ~/.profile

  checkNode
}

checkNode

# 安装依赖
npm i
# 生成public文件
./node_modules/hexo/bin/hexo g

# 为 github.io 配置 CNAME
if [ ! -f "/CNAME" ]; then
  echo "blog.dang8080.cn" > CNAME
fi

# 配置 git

git config --global credential.helper store # 保存 github 提交者信息，下次不用再输密码
git config --global user.name "Humphrey"
git config --global user.email "dang8080@qq.com"

git add --all
git commit -m "TeamCity CI 提交部署: $(date)"
git push origin master
```

### 问题:

> 所以问题来了,配置完了点击 `run` 查看 Build log 会发现 push 失败。因为通过 https 向 github 提交代码需要交互式输入用户密码。而此处没有提供，将密码硬编码到此 shell 里提交到 github 也不安全。
> 或者即使是通过修改 VCS root 使用 git@github.com ssh checkout 的代码，也无法推送到 github.

#### 问题定位:

> TeamCity SSH agent 使用本机(Linux/MacOS)的 OpenSSH 管理 SSH,对于 Windows,需要手动安装 OpenSSH (CygWin,MinGW,Git for Windows).
> SSH agent 必须添加到 `$PATH` 中.
> 第一次连接到远程地址时，SSH agent 会询问是否保存远程地址的 fingerprint 到地址数据库 `~/.ssh/known_hosts`中.
> 为了避免询问，可以提前配置。如果相信该远程地址，可以禁用远程地址检查

> 对所有的连接都禁用，`~/.ssh/config`

```

Host \*
StrictHostKeyChecking no

```

> 特定连接,`-o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no`

> TeamCity 当前仅支持 PEM 格式的 key.如果使用了其他格式的 key，请将其转换为 PEM.可以在 TeamCity web 界面 `Conversions -> Export OpenSSH key` 中转换.

> OpenSSH 最近版本默认不生成 PEM 格式 key.使用下列方式生成 PEM: `ssh-keygen -t rsa -m PEM`

> 上传到 TeamCity Server 的 SSH key 默认保存在 `<TeamCity Data Directory>/config/projects/<project>/pluginData/ssh_keys`，TeamCity 会追踪此文件夹保证 SSH key 更新。SSH key 适用于本项目及子项目.

> 在 TeamCity agent checkout 执行时，Git 插件会从 TeamCity Server 下载 SSH key 到 agent.该 key 会暂时保存在 TeamCity agent 的文件系统里，在 `fetch/clone` 结束后就被删除.

> key 被删除的原因是：通过 build 执行的 test 可能会留下恶意代码，之后会访问 TeamCity agent 文件系统,

TeamCity 是不支持 git ssh 推动代码到 github 的.（支持 ssh 传送文件）

#### 方案一:

当 `run` 一次之后，执行 `docker exec -it teamcity-agent bash` 进入 `opt/buildagent/work/xxxxx/` 下,手动 `git push origin master`。这样后续就不用再配置了

#### 方案二:(硬核)

`github` 需要保存本机的 SSH pub key,才接受 git ssh 推送.那我们就在 TeamCity 生成 ssh key,然后添加到 github.

##### 实践一

```bash
docekr exec -it teamcity-agent bash
ssh-keygen -t rsa
ssh-add [id_rsa]
# 然后复制 id_rsa.pub 的内容到 github 即可
```

##### 实践二

连 TeamCity agent bash 也不想进，使用 shell 构建
先安装 expect tcl tk

```bash
apt-get update && apt-get install tcl tk expect
# 下面是 shell
#! /usr/bin/expect -f
set context $PWD
# 删除旧key
spawn rm -f "$context/id_rsa" "$context/id_rsa.pub"
expect{}
# 生成新key
spawn ssh-keygen -t rsa
expect{
  "*save the key*" { send "$context/id_rsa\r";exp_continue }
  "*passphrase*" { send "\r";exp_continue }
  "*again*" { send "\r" }
}
spawn ssh-add "$context/id_rsa"
sshcheck=$(ssh -vT git@github.com)
if [[ $sshcheck =~ "successfully authenticated" ]]; then
  echo "ssh 配置成功"
else
  echo "ssh 配置失败"
fi
# 复制 pub
pubkey=$(cat "$context/id_rsa)
curl -H "Content-Type:application/json" -X POST --data '{ "title":"TeamCityAgentAuto","key":"$pubkey"}'
```
