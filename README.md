### 网站维护指南：

> 初次配置时需要配置SSH-key和NodeJS

1. 添加新文档
   1. 修改`sidebars.js`中的`mySidebar`
   2. 在docs/文件夹中放入写好的`.md`文件，将图片放入`assets/`中分文档放置，并修改`.md`文件中链接的图片地址
   3. 在`zxy-website`根目录下试编译，运行`npm run build`
   4. 无报错，本地部署`npm run serve`查看效果
   5. 上传到github进行自动部署
      1. `git status`
      2. `git add .`
      3. `git commit -m "xxxx"`
      4. `git push -u origin master`

2. 删除文档

   应该就是反向操作吧...
