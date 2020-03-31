---
title: Podman
date: 2019-08-13 22:28:10
tags:
  - container
---
Podman 是什么? Podman 是一个非守护线程的容器引擎,支持在 Linux 系统上开发、管理和运行 OCI 容器.容器同时支持 root 身份和非 root 身份.只需要使用 `alias docker=podman` 就可以立即从 docker 切换到 podman.
<!-- more -->
## 安装
- Arch Linux & Manjaro Linux
`sudo pacman -S podman`
- Fedora,CentOS
`sudo yum -y install podman`
- Fedora-CoreOS,Fedora SilverBlue
内置无需安装
- Gentoo
`sudo emerge app-emulation/libpod`
- MacOS
`brew cask install podman`
- openSUSE
`sudo zypper install podman`
- openSUSE Kubic
内置无需安装
- RHEL7
```
sudo subcription-manager repos --enable=rhel-7-server-extras-rpms
sudo yum -y install podman
```
- RHEL8 Beta
```
sudo yum module enable -y contianer-tools:1.0
sudo yum module install-y container-tools:1.0
```
- Ubuntu
```
sudo apt-get update -qq
sudo apt-get install -qq -y software-properties-common uidmap
sudo add-apt-repository -y ppa:projectatomic/ppa
sudo apt-get update -qq
sudo apt-get -qq -y install podman
```
## 开始
Podman 由 libpod 库提供的一个工具.可以用来创建维护容器.下面的指南将带你如何设置 Podman 并实现一些基本命令.
### 运行示例容器
```podman run -dt -p 8080:8080/tcp -e HTTPD_VAR_RUN=/var/run/httpd -e HTTPD_MAIN_CONF_D_PATH=/etc/httpd/conf.d \
                  -e HTTPD_MAIN_CONF_PATH=/etc/httpd/conf \
                  -e HTTPD_CONTAINER_SCRIPTS_PATH=/usr/share/container-scripts/httpd/ \
                  registry.fedoraproject.org/f27/httpd /usr/bin/run-httpd
```
上面的容器将开启一个基本的 http server.由于此容器是以 detached 模式运行,由 podman run 命令 -d flag 表示,所以 Podman 在启动运行后仅输出容器 ID.然后就可以访问该 http server了.
### 列出正在运行的容器
`podman ps`
`podman ps -a` 列出所有的容器
