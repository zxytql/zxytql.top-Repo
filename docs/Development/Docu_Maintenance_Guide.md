---
id: Web_Maintenance_Guide
title: Docusaurus v3.0 维护指南
---

> 写在前面：如果你觉得当前使用的Docusaurus版本没什么不好的，那么请你谨慎更新。每次大版本更新都会升级很多的依赖，比如NodeJS，MDX，React等等。很有可能你在旧版本可以使用的Markdown语法，在新版本编译时会抱一堆的错误。如果你想更新，请你做好自己Debug的准备。

记录一些我在使用Docusaurus写文档时遇到的一些编译问题，其中大多数都与MDX和React的版本更新相关。如果对你有帮助，不妨给[本网站仓库](https://github.com/zxytql/zxytql.top-Repo)点一个Star，你的支持是我更新的最大动力～



### Could not parse expression with acorn

> 我在文档中编写LateX公式时遇到了此错误

首先，在仓库根目录下安装`remark-math` and `rehype-katex` 插件。

```shell
npm install --save remark-math@6 rehype-katex@7
```

修改以下高亮部分内容：
```js title="docusaurus.config.js"
// highlight-start
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
// highlight-end

export default {
  title: 'Docusaurus',
  tagline: 'Build optimized websites quickly, focus on your content',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: 'docs',
          // highlight-start
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          // highlight-end
        },
      },
    ],
  ],
  // highlight-start
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],
  // highlight-end
};
```

### Error: MDX compilation failed
> 这个问题出现有很多种情况，大部份都与html的语法相关。
```js 
Cause: Unexpected closing tag `</center>`, expected corresponding closing tag for `<font>` (14:10-14:33)
Details:
{
  "column": 85,
  "message": "Unexpected closing tag `</center>`, expected corresponding closing tag for `<font>` (14:10-14:33)",
  "line": 14,
  "name": "14:85-14:94",
  "place": {
    "start": {
      "line": 14,
      "column": 85,
      "offset": 337,
      "_index": 0,
      "_bufferIndex": 84
    },
    "end": {
      "line": 14,
      "column": 94,
      "offset": 346,
      "_index": 0,
      "_bufferIndex": 93
    }
  },
  "reason": "Unexpected closing tag `</center>`, expected corresponding closing tag for `<font>` (14:10-14:33)",
  "ruleId": "end-tag-mismatch",
  "source": "mdast-util-mdx-jsx"
}
```
问题代码为：
```html
<center> <font font-size="14px"><font color = "#c0c0c0">图1. 3WIS robot model </font></center> 
```
我是在Typora上写的MD文件，预览一切正常，但是编译时会抱错。分析错误代码可以发现是有一个`<font>`没有匹配上。
修改为：
```html
<center> <font font-size="14px"><font color = "#c0c0c0">图1. 3WIS robot model </font></font></center> 
```
编译通过。



### 编译后图片不显示

> 我在文档中使用`<img>`访问了静态资源
```html
<img align="center" width="50%" src="./assets/Steering_Wheel_Kinematics/1.png" />
```
但是Docusarus并不会解析静态的图片。
> https://docusaurus.io/zh-CN/docs/static-assets#in-markdown
>
> Docusaurus 只会解析用 Markdown 语法的链接。 If your asset references are using the JSX tag `<a>` / `<img>`, nothing will be done.


---
<p align="right"><i> <font size="3"><font color = "brown">Last update on</font>: 2024/01/21 </font></i></p>