// @ts-nocheck
// Note: type annotations allow type checking and IDEs autocompletion
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const lightCodeTheme = require('prism-react-renderer').themes.github;
const darkCodeTheme = require('prism-react-renderer').themes.dracula;

// const themes = require('prism-react-renderer').themes;
// const lightCodeTheme = themes.github;
// const darkCodeTheme = themes.dracula;
const announcementBarContent = '<a href = "/KA_Steering_Wheel">🌟<b>新文章《舵轮运动学分析》已上线 </a></b>🌟'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'zxy\'s base',
  tagline: 'ZXY SUPER COOL!',
  url: 'https://zxytql.top',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/stars.png',
  organizationName: 'zxytql', // Usually your GitHub org/user name.
  projectName: 'zxytql.top-Repo', // Usually your repo name.
  trailingSlash: false,
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath:'/',
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          // Please change this to your repo.
          //editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: 'feature_release',
        content:
          announcementBarContent,
        backgroundColor: "#fafbfc", // Defaults to `#fff`.
        textColor: "#091E42", // Defaults to `#000`.
        isCloseable: true,
      },
      navbar: {
        title: 'ZXY SUPER COOL!',
        logo: {
          alt: 'My Site Logo',
          src: 'img/robot2.png',
        },
        items: [
          // {
          //   type: 'doc',
          //   docId: 'intro',
          //   position: 'left',
          //   label: '文档',
          // },
//          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/zxytql',
            label: 'GitHub',
            position: 'right',
          },
        ],
        hideOnScroll: true,
      },
      footer: {
        style: 'light',
        // links: [
        //   {
        //     title: 'Docs',
        //   },
        //   {
        //     title: 'Community',
        //     items: [
        //       {
        //         label: 'Stack Overflow',
        //         href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        //       },
        //       {
        //         label: 'Discord',
        //         href: 'https://discordapp.com/invite/docusaurus',
        //       },
        //       {
        //         label: 'Twitter',
        //         href: 'https://twitter.com/docusaurus',
        //       },
        //     ],
        //   },
        //   {
        //     title: 'More',
        //     items: [
        //       {
        //         label: 'GitHub',
        //         href: 'https://github.com/facebook/docusaurus',
        //       },
        //     ],
        //   },
        // ],
        copyright: `Copyright © ${new Date().getFullYear()} Xingyu Zhou. ⭐Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
