import React from "react";
import Giscus from "@giscus/react";
import {useColorMode} from "@docusaurus/theme-common"; // 导入当前主题 API

export default function GiscusComponent() {
  const {colorMode} = useColorMode(); // 获取当前主题
  return (
    // 前面放一个带 margin 的 div，美观
    <div style={{marginTop: "30px"}}>
      <Giscus
        repo="zxytql/zxytql.top-Repo"
        repoId="R_kgDOG9DiSA"
        category="Announcements"
        categoryId="DIC_kwDOG9DiSM4CcJ-V"
        mapping="pathname"
        term="Welcome to @giscus/react component!"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={colorMode} // 根据当前主题设置
        lang="en"
        loading="lazy"
        crossorigin="anonymous"
        async
      />
    </div>
  );
}