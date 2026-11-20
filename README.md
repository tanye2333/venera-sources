# Venera 个人漫画源

适用 Venera 1.6.3。手机打开「漫画源 → 漫画源列表」，粘贴下面的地址，点「刷新」。

```text
https://raw.githubusercontent.com/tanye2333/venera-sources/refs/heads/main/index.json
```

## 首次切换

列表中的勾表示同标识的源已经安装。对于已安装的源，回到「漫画源」，点该源的编辑图标，在类开头找到更新地址字段 `url`，换成这个索引中同名条目的 `url`，返回保存，再点该源旁的更新图标。每个旧源只需操作一次。新源从列表直接添加。

包子漫画的简体线路在源设置里选 `twmanga.com`，图片资源站选「默认」。漫蛙吧沿用 `manwaba` 标识，包含正文图像处理和长章节分页修复。

## 维护

根目录的每个 .js 对应一个漫画源。修改脚本并提高它的 version，保留原 key，再同步 index.json 中同一项的 version。在本地可运行以下命令生成索引，再把脚本和索引一起提交。

```sh
node update-index.mjs tanye2333/venera-sources main
```

在手机的「漫画源」页点「检查更新」。仓库负责分发脚本；漫画站点改版时仍需修订对应脚本。

## 脚本来源

基础脚本来自 [venera-app/venera-configs](https://github.com/venera-app/venera-configs/tree/a04e05591f7832f7166d6660546613c114d6738a)。保留源标识，更新地址统一指向此仓库。

包子漫画基于 [YHQY-Dev 的修订](https://github.com/YHQY-Dev/venera-sources/blob/b84b58ad0935df124b38a12f2d6e369d0715ff32/baozi.js) 调整线路。漫蛙吧整合了 [社区图片修复](https://github.com/venera-app/venera-configs/issues/354)，并补全正文分页。其余 16 项的更新来源如下。

- [拷贝漫画 1.4.6](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/copy_manga.js)
- [拷贝漫画(多账号) 1.4.2](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/copy_manga_multi_accounts.js)
- [CCC追漫台 1.0.2](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/ccc.js)
- [カドコミ 1.0.3](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/comic_walker.js)
- [comick 1.2.1](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/comick.js)
- [Komga 1.0.1](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/komga.js)
- [优酷漫画 1.0.1](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/ykmh.js)
- [漫画1234 1.1.0](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/mh1234.js)
- [热辣漫画 1.0.2](https://github.com/ikznbfin/venera-configs/blob/891fbc11d0023bb4732d110378756555fedd81b0/hot_manga.js)
- [禁漫天堂 1.4.1](https://github.com/hunmeng/venera-configs/blob/2d56277a464043c4ef58e3a9c031308c3df58aa0/jm.js)
- [紳士漫畫 1.0.8](https://github.com/hunmeng/venera-configs/blob/974089f542cf0836aa04279c3810afc087b22aba/wnacg.js)
- [Komiic 1.0.4](https://github.com/haukuen/venera-configs/blob/718e47e25b451853cc5c80ca7fe4ddde5876ac1a/komiic.js)
- [Kavita 1.1.0](https://github.com/haukuen/venera-configs/blob/718e47e25b451853cc5c80ca7fe4ddde5876ac1a/kavita.js)
- [Lanraragi 1.2.0](https://github.com/venera-app/venera-configs/blob/a04e05591f7832f7166d6660546613c114d6738a/lanraragi.js)
- [ehentai 1.2.0](https://github.com/venera-app/venera-configs/blob/a04e05591f7832f7166d6660546613c114d6738a/ehentai.js)
- [nhentai 1.3.0](https://github.com/opaiopaio/venera-configs/blob/99b5ba8f15ff9fed8c3f40689eb623ff937243fb/nhentai.js)
