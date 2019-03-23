---
title: git 笔记
date: 2019-03-17 09:05:15
tags:
  - git
---

- config

```bash
# 修改配置
git config --local # 对某个仓库有效
git config --global # 对当前用户所有仓库有效
git config --system # 对系统所有登录用户有效
# 查看配置
git config --list --local
git config --list --global
git config --list --system
# 打开编辑器修改config
git config -e # 仅对当前仓库有效
# 变更文件名
git mv readme readme.md # 避免  mv x y -> git add -> git rm
git log [分支]
        --oneline # 一行显示
        -n4 # 指定最新的几次提交
        --all # 所有分支的提交
        --graph # 图形化显示
# 打开内置帮助网页.
git help --web [log]
# gui
gitk --all
git branch -av
# 在 ./git/refs/heads/xxx 中查看信息
git cat-file -t master # 返回 git object model 类型: blog, tree, commit, tag
            -p # 显示所有内容
# 删除分支
git branch -D [fixup]
# 变基
git rebase -i
# 暂存区和最近一次提交的区别
git diff --cached
# 将暂存区的内容丢弃
git reset HEAD -- <file>
# 将暂存区的内容恢复到本地
git checkout -- <file>
# 设置别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.last 'log -1 HEAD'
git config --global alias.unstage 'reset HEAD --'; git unstage fileA === git reset HEAD -- fileA
git config --global alias.visual '!gitk'

# 查看各个分支所指的对象  --decorate
git log --oneline --decorate
git log --oneline --decorate --graph --all
# 跟踪远程分支
git checkout --track origin/serverfix
git checkout -b sf origin/serverfix; sf 分支追踪 origin/serverfix 分支.
# 添加修改正在追踪的上游分支; -u / --set-upstream-to
git branch -u origin/serverfix
# 当设置好跟踪分支后，可通过 @{upstream} 或 @{u} 快捷方式来引用.所有如果 master 跟踪 origin/master。那么 git merge @{u} 可以取代 git merage origin/master.
# 查看所有跟踪分支
git branch -vv
# 删除服务端的分支
git push origin --delete serverfix
#
git init --bare --shared ; # shared 会自动修改该仓库目录的组权限为可写.

# 为服务端配置 SSH 访问
sudo adduser git
su git
cd
mkdir .ssh && chmod 700 .ssh
touch .ssh/authorized_keys && chmod 600 .ssh/authorized_keys
cat /tmp/id_rsa.john.pub >> ~/.ssh/authorized_keys
cat /tmp/id_rsa.josie.pub >> ~/.ssh/authorized_keys
# 限制 git 用户只能访问项目，无法登录远程主机.
cat /etc/shells
which git-shell
sudo vim /etc/shells； # 将 git-shell 添加
sudo chsh git /usr/bin/git-shell; # 限制 git 用户只能利用 SSH 连接对 Git 仓库进行推送和拉去操作，而不能登录机器并取得普通 shell.

# 以守护进程的方式设置 git 协议,不需要配置 SSH 公钥.
git daemon --reuseaddr --base-path=/opt/git/ /opt/git/;
# --reuseaddr 允许服务器在无需等待旧连接超时的情况下重启
# --base-path 允许用户在未完全指定路径的条件下克隆项目,结尾的路径将告诉 git 守护进程从何处寻找仓库来导出.如果有防火墙运行，请开放 9418 端口.
# 空白错误(换行\tab\。。。)
git diff --check
# 部分暂存
git add --patch
#
git merge --squash featureB
# --squash 接受被合并分支上的所有工作，并将其压缩至一个变更及，使仓库成为真正合并发生的状态，而不是生成一个合并提交.
# 打包 archive
git archive master --prefix='project/' | gzip > `git describe master`.tar.gz
git archive master --prefix='project/' --format=zip > `git describe master`.zips
```
