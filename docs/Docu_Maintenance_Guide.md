---
id: DEV_Web_Maintenance_Guide
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

<p align="right"><i> <font size="3"><font color = "brown">Last update on</font>: 2024/01/21 </font></i></p>