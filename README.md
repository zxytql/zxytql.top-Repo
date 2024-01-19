## 网站维护指南：

> 初次配置时需要配置SSH-key和NodeJS

---

> ### 如果是新拉取的代码
>
> 1. 在`zxytql.top-Repo/ ` 文件夹的根目录下执行终端
> 2. 运行`npm install`，执行安装命令。若要检查安装是否成功，可以运行`npx docusaurus --version` ，你应该能看到正确的版本输出
> 3. 现在运行`npm run start`，默认情况下，浏览器会自动打开 http://localhost:3000 的新窗口。代表环境配置完成，可以按照维护指南进行文档的修改操作了

1. **添加新文档**

   1. 修改`sidebars.js`中的`mySidebar`
   2. 在docs文件夹中放入写好的`.md`文件，将图片放入`assets`中分文档放置，并修改`.md`文件中链接的图片地址
   3. 在`zxy-website`根目录下试编译，运行`npm run build`
   4. 无报错，本地部署`npm run serve`查看效果
   5. 上传到 Github 进行自动部署
      1. `git status`
      2. `git add .`
      3. `git commit -m "xxxx"`
      4. `git push -u origin master`

2. **删除文档**

   仅需删除sidebar.js中的文档标签即可


## 文档命名规范
- 大类名字 + 小类名字 + 具体名称
- 二者之间用下划线`_`分割，首字母大写，下划线命名
- 定义如下缩写：
  - 嵌入式开发：ESD
  - 机器人算法：RA
  - 运动学算法：KA
  - 树莓派：Raspi


