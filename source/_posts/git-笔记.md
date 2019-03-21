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
```
