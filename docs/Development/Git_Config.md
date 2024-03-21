---
id: Git_Config
title: Git代理设置
---

使用 git clone 下载 Github 等网站的仓库时，可能会遇到类似 `"Recv failure: Connection was reset"` 或 `"Failed to connect to http://github.com port 443 after 21114 ms: Couldn't connect to server"`的报错。即使打开了全局代理，也会报错。

### 配置 SSH 代理
当你对github使用git操作时很慢，甚至报timeout错误，你需要配置一下SSH的代理走科学通道。
- Windows
```shell title="~/.ssh/config"
# Windows 全局
ProxyCommand "C:\Program Files\Git\mingw64\bin\connect.exe" -H 127.0.0.1:7890 %h %p

# 针对某个网站 eg. github
Host github.com
  ProxyCommand "C:\Program Files\Git\mingw64\bin\connect.exe" -H 127.0.0.1:7890 %h %p
```
这里 git 的安装路径和后面的代理端口根据自己修改。我使用的是Clash，默认7890端口，走HTTP协议。-S 是 socks 代理，默认是 socks5，如果要使用 HTTP 代理，就写 -H。

- Linux / MacOS
```shell title="~/.ssh/config"
# Linux / MacOS 全局
ProxyCommand nc -X connect -x 127.0.0.1:7890 %h %p

# 针对某个网站 eg. github
Host github.com
    User git
    ProxyCommand nc -X connect -x 127.0.0.1:7890 %h %p
```

如果此方法对你无效，请尝试下面的方法。

### 为 Git 单独配置代理
同上，下面的代理地址与端口需要根据你使用的工具修改。

```shell
# 全局设置
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

#只为当前仓库设置 
git config http.proxy http://127.0.0.1:7890
git config https.proxy http://127.0.0.1:7890
```

配置完成后，可以使用以下命令查看并修改 Git 的配置：
```shell
# 全局配置文件
git config --global --edit

# 当前仓库的配置文件
git config --edit
```

此时 Git 的默认编辑器会打开 ~/.gitconfig 文件，其中包括了代理的配置：
```shell
[http]
	proxy = http://127.0.0.1:7890
[https]
	proxy = http://127.0.0.1:7890
```
如果仍然报错，可以检查代理端口是否配置正确，并尝试用以下命令设置关闭 SSL 证书验证：
```shell
git config --global http.sslVerify false
```

<br/>
<p align="right"><i> <font size="3"><font color = "brown">Last update on</font>: 2024/03/21 </font></i></p>