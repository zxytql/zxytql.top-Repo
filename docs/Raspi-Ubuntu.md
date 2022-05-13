---
id: Raspi-Ubuntu
title: 树莓派4B安装Ubuntu18.04 + vnc远程桌面
---



在实验室对写程序的欲望越来越低下的时候，学长给了一个树莓派4B，让我研究一下，因为机器人的上位机就靠它运行。一说新东西我就来劲了，可惜实验室里没有SD卡（旧的断掉了），只好等到回家之后再折腾这玩意。研究了两天，SD卡重写了五六遍，写点东西供自己或者他人可以参考。<br/>
**为了方便，附上本文章使用的所有资源的压缩包。**<br/>
本文所用所有资源：[CSDN下载](https://download.csdn.net/download/m0_52364631/14108734)

----------------------

##### **2021年6月11日更新：**

在刷入固件到树莓派后**可以不用HDMI和键盘连接**到树莓派上，具体操作如下：
1. 打开 `system-boot` 磁盘下根目录的 `network-config` 文件，写入下面的内容：
```cpp
wifis:
  wlan0:
    dhcp4: true
    dhcp6: true
    optional: true
    access-points:
      "wifi-name":
        password: "wifi-password"
```


![在这里插入图片描述](https://img-blog.csdnimg.cn/2021061111272114.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

`

`wifi-name` 对应你要连接的wifi名字，`wifi-password` 对应wifi密码。

2. 修改在相同目录下的 `user-data` 文件，`expire：`后改成`false`。
如果你要修改登录的用户名和密码，直接修改`list`的内容即可。下图中`ubuntu:ubuntu` 意思是账户名是 ubuntu，密码是 ubuntu。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210611112934842.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)



3. 启动树莓派
如果是刷完固件后第一次启动，因为第一次需要进行系统配置，所以第一次不会自动连接。第一次上电过两分钟后重新上电稍等片刻就会自动连接wifi了。

------
### 安装系统
#### 1. 下载Ubuntu 18.04.5 LTS镜像文件
这里也是有讲究的。
平常安装虚拟机、系统大部分用的是GHO或者ISO镜像文件，但是写入SD卡要用的是IMG镜像文件。一开始我没有注意到这一点，下载的是ISO镜像文件，发觉了之后看见有网友说直接把后缀改成.img可以正常使用，我尝试了一遍发现不行，国内镜像站上也没有Ubuntu的img镜像文件，最后还是在Ubuntu wiki上找到了下载地址 -> [Ubuntu wiki](https://wiki.ubuntu.com/ARM/RaspberryPi/)。

访问网站后找到 Download 栏，因为要安装的是Ubuntu 18.04，就点击对应那一栏的超链接下载即可。如果点击没有反应，可以右键该链接选择“在新窗口中打开”，就会自动下载了

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110195947773.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)



国外网站，下载速度难免会慢一点，但是还是可以接受的。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110200154332.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

**下载好之后得到的是一个xz后缀的压缩文件。解压该文件即可得到里面的img镜像文件。**

在镜像文件下载的时候，可以先做其他准备工作。
#### 2. 使用SD卡写入程序 Win32diskimager
我看有一些文章使用的程序是 balenaEtcher ，支持ISO、IMG等镜像文件的写入，但是经过尝试，不知道为什么我写入后的SD卡只有 boot 的几个文件，所以还是使用了 Win32diskimager。对于格式化，我发现在写入镜像文件的时候软件会自动对SD卡进行格式化，所以没有必要专门下载一个SD卡格式化软件。如果不放心，可以使用 SD Card Formatter

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110201248779.png)

打开Win32diskimager，选择上面解压出来的镜像文件，设备选择SD卡的盘符（不知道具体盘符的可以打开“此电脑”查看），我这里是F盘。可以看到程序已经自动选择了。然后点击写入就会进行写入操作了。（单击写入弹出的提示是会格式化所选SD卡，继续即可）

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110202010226.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

写入完毕后如果无法查看SD卡内文件，重新插拔就能查看了

#### 3. 修改SD卡文件
如果将烧录好的SD卡直接插入到树莓派上通电连接显示屏，大概率会出现显示器闪烁一下然后显示无信号的情况。具体原因不明。这时就需要更改引导文件，让树莓派进行画面输出。
在网上看了很多文章，都是修改config.txt文件，但是打开后可以发现文件开头注释写了：
> **Please DO NOT modify this file; if you need to modify the boot config, the"usercfg.txt" file is the place to include user changes. Please refer to the README file for a description of the various configuration files on the boot partition.**

**这句话的大意是：如果你需要修改引导文件中的内容，请在 "usercfg.txt" 文件中进行更改。**
查看SD卡内的文件，确实是有 "usercfg.txt" 这个文件，打开后看见开头注释也说了：
> **Place "config.txt" changes (dtparam, dtoverlay, disable_overscan, etc.) in this file.**
>
> 说明 "config.txt" 中要修改的内容是写到这个文件没错。

在这个文件中，写入以下内容：

```c
hdmi_force_hotplug=1
config_hdmi_boost=4
hdmi_group=2
hdmi_mode=58
# hdmi_drive=2
hdmi_ignore_edid=0xa5000080
disable_overscan=1
```
这么写的意义在哪？我们逐条分析：
hdmi_force_hotplug：强制使用HDMI输出
config_hdmi_boost：HDMI信号增强。
hdmi_group、hdmi_mode：设定分辨率。因为没有1920 * 1080 60Hz，我就选择了1680 * 1050 60Hz

**设定分辨率的内容可以参考文章：[树莓派连接显示器不亮屏的解决方案](https://www.cnblogs.com/wirehome/p/10298395.html)。本小节问题的解决方法也是从这学习的。**

hdmi_drive：强制音频输出到HDMI口。如果不想将音频通过模拟信号输出，删除这一行。反之去掉上面的注释号
hdmi_ignore_edid：强行按hdmi_group和hdmi_mode规定的分辨率输出。不检测显示器自身的分辨率。
disable_overscan：强行禁止保留黑边功能。

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110205101660.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

完成后保存即可。

#### 4. 安装SD卡，连接显示器和键盘
将SD卡插入到树莓派背面的SD卡槽中，连接电源线和HDMI线，此时显示器上会进行一段时间的初始化。初始化完成后，系统会要求输入用户名和密码，默认账户和密码都是ubuntu。第一次登录需要更改密码，更改后就可以使用 Ubuntu 了。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110210215965.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)



> **没有采集卡，只能用最质朴的截图方式了:(**

**关于修改密码的小提示：
Current password 是要你输入当前密码，即默认密码ubuntu<br/>
Enter new password才是要你输入新密码**

至此，树莓派4B安装Ubuntu18.04的教程结束。

### 安装桌面和vnc远程桌面
以下操作都需要root权限，先切换到root身份。在linux中，没有root权限，很多文件都是只读而不可写。

用vim在修改文件的途中，不保存退出的命令是 :q!（有冒号和感叹号）

```c
sudo su
```
在要执行的命令前加上 sudo，可以不切换到root身份。

#### 1.配置无线网络

树莓派4B有以太网接口和wifi模块。以太网没啥好说的，直接插上就行了。但是谁想在小巧玲珑的树莓派上插上一条这么难看的线呢？
配置无线网络需要用到 ip 命令和 netplan 命令，安装的镜像已经默认安装了以上命令。输入：

```c
ip a
```
可以看到网络连接详情和无线网卡的名字，eht0 是有线网卡，wlan0 是无线网卡。
因为我已经设置好了无线网络，所以显示的 wlan0 栏会有具体的IP显示。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110215234124.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

接下来修改wifi的配置文件：

```c
cd /etc/netplan/
ls 
vim xxxxxx.yaml     //不同设备配置文件的文件名不同，将xxx替换成对应文件名
```
小提示：在控制台终端中，按TAB键可以进行自动补全
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110220240308.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)
**敲击键盘 i 键进入编辑模式，修改完毕后，按ESC退出编辑模式，输入:wq 保存退出。（注意有冒号！）**
假设我要连接的 wifi 名(SSID)为：aaaa，密码为12345678 则更改配置文件如下图所示：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110220318962.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)
配置好文件之后，需要执行下面这个命令，查看配置是否有错，如果有错它会自动回滚上次正确配置

```c
sudo netplan try
```

如果没错，会让你按enter确认使用这些配置，然后执行这个命令来使配置生效

```c
sudo netplan apply
```
可能会提醒我们：
![在这里插入图片描述](https://img-blog.csdnimg.cn/2021011022074535.png#pic_center)
那就执行：

```c
systemctl daemon-reload
```
现在我们执行ip a命令，如果你输入的SSID和密码是正确的，就可以像我本小节第一张图中一样会显示ip地址。
#### 2. 开启ssh
Ubuntu18.04是自带openssh的，所以不需要自己安装，只需要进行配置即可。

然后我们先顺手设定一下系统时间：

```c
timedatectl set-timezone Asia/Shanghai
```
> **输入 date 即可查看当前系统时间**

然后配置sshd文件：
```c
sudo vim /etc/ssh/sshd_config
```
将 # Authentication 一栏下的 #PermitRootLogin prohibit-password 更改为 PermitRootLogin yes，如图所示：

![这水印是啥鬼](https://img-blog.csdnimg.cn/20210110212407301.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

重启ssh服务：

```c
/etc/init.d/ssh restart
```
此时我们就可以使用ssh来连接到树莓派了。**使用ssh的方法有很多种，包括但不限于Xshell，Windows PowerShell，cmd + git 等，可以自行搜索教程，这里不再赘述。**

**关于ssh连接的提示：
建议使用ssh username@ip 的形式进行连接，且username不能为root。在不同的连接方式中，直接使用 ssh @ip的方式可能会导致 username 错误，默认username是ubuntu。想要在ssh中使用root身份，可以在连接后切换到root身份。**

#### 3. 安装vnc4server
为了能不连接HDMI就能在树莓派上进行图形化操作，我们需要安装vnc服务。vnc能将完整的窗口界面通过网络,传输到另一台计算机的屏幕上。
首先更新软件源目录：
```c
apt-get update
```
vnc服务有很多种选择，这里我选择的是vnc4server。安装vnc4server：

```c
apt-get install vnc4server
```
**之所以不更换软件源再下载，是因为我尝试过阿里源和清华源，都没有vnc4server的安装包，虽然ubuntu源速度慢，但是它所包含的安装包是最新最全的，而且速度也不见得有那么难堪。**

等到安装完成后，启用vnc服务：

```c
vnc4server
```
第一次启动vnc4server都需要输入密码，这个密码在后面用电脑连接需要用到。假如后面需要更改 VNC 连接密码，只需要输入 vncpassword 即可。开启服务后还会显示端口号，如下图所示：

![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110223005589.png#pic_center)

#### 4. 在Windows用vnc客户端连接树莓派
在Windows端，用的比较多的vnc客户端是 VNC Viewer，下载安装后主界面如下：
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110223356965.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)
vnc服务本质上还是局域网连接，所以需要确保你的电脑和树莓派在同一网络环境下。在VNC Viewer的输入框输：ip:端口号。比如我用ip a命令查到的ip地址是192.168.1.36，开启vnc服务后显示的是 ubuntu:1，那我就输入192.168.1.36:1，点击连接。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210110223841253.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)
这个警告在提醒说数据在传输过程中可能会被第三者窃取。因为直接对端口进行连接而没有经过映射，这个操作是不安全的，一般需要进行端口映射。因为我是在自己的局域网中进行操作，所以直接点击 Continue (继续)即可。

![在这里插入图片描述](https://img-blog.csdnimg.cn/2021011022460958.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)

接着需要输入密码，密码就是上面启动vnc服务时要求输入的密码。输入正确的密码之后就会出现一个灰色窗口，说明我们的vnc服务已经正常运行，只是我们没有安装桌面环境，所以我们需要回到树莓派中安装图形程序。

#### 5. 安装适合你的桌面环境
许多人对于linux的刻板印象就是黑乎乎的DOS操作终端，没有任何可以进行鼠标交互的图形界面。其实很多年前linux开发者们就已经注意开发出针对普通用户的图形界面环境了。时至今日，有很多桌面环境活跃在linux里，大家可以根据自己的需求和喜好进行选择。

[Linux的桌面环境gnome、kde、xfce、lxde 等等使用比较](https://www.cnblogs.com/chenmingjun/p/8506995.html)

本文采用的是gnome3，因为我之前在虚拟机上也是使用的这一个桌面环境，习惯了就不改了。

**完整安装Gnome3**

```c
apt install ubuntu-desktop gnome-panel gnome-settings-daemon metacity nautilus gnome-terminal -y
```
**仅安装核心组件（推荐）**

```c
apt-get install --no-install-recommends ubuntu-desktop gnome-panel gnome-settings-daemon metacity nautilus gnome-terminal -y
```
Gnome3组件比较大，没有换源的话安装时间会比较长（大概15分钟）。而且我自己也没有尝试过换源后安装Gnome3，有兴趣的可以自行尝试，如果我后面尝试了会更新的（今天是2021年1月11日）。

安装完毕后输入reboot重启树莓派，如果此时你连接显示器，可以看到原本黑乎乎的操作终端变成了图形化可交互界面。这说明Gnome3安装成功了。

#### 6. 配置vnc
修改vnc配置文件：

```c
vim ~/.vnc/xstartup
```
修改成以下配置，建议用ssh修改，可以直接复制粘贴。

```c
#!/bin/sh
 
# Uncomment the following two lines for normal desktop:
# unset SESSION_MANAGER
# exec /etc/X11/xinit/xinitrc
 
[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
xsetroot -solid grey 
vncconfig -iconic &
x-terminal-emulator -geometry 80x24+10+10 -ls -title "$VNCDESKTOP Desktop" &
x-window-manager &
        
gnome-panel &
gnome-settings-daemon &
metacity &
nautilus &
```
保存退出后，先退出原本运行中的vnc进程：
```c
vncserver -kill :x //x为端口
```
重新创建新进程：

```c
vncserver :x //x为自然数
```
**如果你觉得vnc的窗口太小了，可以执行下面的创建新进程代码：**

```c
vncserver :x -geometry <WIDTH>x<HEIGHT>
//例： vncserver :1 -geometry 1600x900
```
然后用Vnc Viewer连接，就可以进行操作了。教程结束。
![在这里插入图片描述](https://img-blog.csdnimg.cn/20210111024932480.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzUyMzY0NjMx,size_16,color_FFFFFF,t_70#pic_center)