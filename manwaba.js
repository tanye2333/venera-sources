const MANWABA_IMAGE_KEY = "0B6666A0-BB59-1381-B746-a0E4C9AC";

// 图片解密：站点所有 /en_images 图片都是 IV(16B) + AES-256-CBC 包裹，已是图片则原样返回。
function manwabaDecryptImage(bytes) {
  const input = new Uint8Array(bytes);
  const isImage = (d) =>
    (d[0] === 0xff && d[1] === 0xd8) ||
    (d[0] === 0x89 && d[1] === 0x50) ||
    (d[0] === 0x47 && d[1] === 0x49) ||
    (d[0] === 0x52 && d[1] === 0x49) ||
    (d[0] === 0x57 && d[1] === 0x45 && d[2] === 0x42 && d[3] === 0x50) ||
    (d[0] === 0x42 && d[1] === 0x4d);
  if (isImage(input)) return bytes;
  if (input.length < 32 || (input.length - 16) % 16 !== 0) return bytes;
  const iv = new Uint8Array(input.slice(0, 16));
  const ciphertext = new Uint8Array(input.slice(16));
  let padded;
  try {
    const key = Convert.encodeUtf8(MANWABA_IMAGE_KEY);
    padded = Convert.decryptAesCbc(ciphertext.buffer, key, iv.buffer);
  } catch (e) {
    return bytes;
  }
  if (!padded) return bytes;
  let plain = new Uint8Array(padded);
  const padding = plain[plain.length - 1];
  if (padding >= 1 && padding <= 16 && padding <= plain.length) {
    let valid = true;
    for (let i = plain.length - padding; i < plain.length; i++) {
      if (plain[i] !== padding) { valid = false; break; }
    }
    if (valid) plain = plain.slice(0, plain.length - padding);
  }
  if (!isImage(plain)) return bytes;
  return plain.buffer;
}

class ManWaBa extends ComicSource {
  name = "漫蛙吧";
  key = "manwaba";
  version = "1.0.6-local";
  minAppVersion = "1.5.0";
  url = "https://raw.githubusercontent.com/tanye2333/venera-sources/refs/heads/main/manwaba.js";
  base = "https://manwauu.cc";
  api = this.base + "/api";

  async fetchJson(url, { params } = {}) {
    if (params) {
      const query = Object.keys(params).map(key => encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
      url += "?" + query.join("&");
    }
    const res = await Network.get(url);
    if (res.status !== 200) throw "HTTP " + res.status;
    const json = JSON.parse(res.body);
    if (json.code !== 200 || !json.data) throw json.msg || "站点没有返回漫画数据";
    return json;
  }
  // explore page list
  explore = [
    {
      title: this.name,
      type: "singlePageWithMultiPart",
      load: async (page) => {
        const params = { page: 1, pageSize: 6, type: "", flag: false };
        const data = await this.fetchJson(`${this.api}/home`, { params }).then((res) => res.data);
        const groupList = {
          热门: data.comicList,
          最新完整版: data.gufengList,
          最新更新: data.xuanhuanList,
          热门收藏: data.xiaoyuanList,
        };
        const parseComic = (comic) =>
          new Comic({
            id: comic.id.toString(),
            title: comic.title,
            subTitle: comic.author,
            cover: comic.pic,
            tags: (comic.tags || "").split(",").filter((t) => t),
          });
        const result = {};
        for (const key in groupList) {
          result[key] = (groupList[key] || []).map(parseComic);
        }
        return result;
      },
    },
  ];

  // categories
  category = {
    title: this.name,
    parts: [
      {
        name: "类型",
        type: "fixed",
        categories: [
          "全部", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "其他",
          "搞笑", "少男", "战斗", "重生", "逆袭", "爆笑", "少年", "后宫", "系统", "BL",
          "韩漫", "完整版", "19r", "台版",
        ],
        itemType: "category",
        categoryParams: [
          "", "热血", "玄幻", "恋爱", "冒险", "古风", "都市", "穿越", "奇幻", "其他",
          "搞笑", "少男", "战斗", "重生", "逆袭", "爆笑", "少年", "后宫", "系统", "BL",
          "韩漫", "完整版", "19r", "台版",
        ],
      },
    ],
    enableRankingPage: false,
  };

  /// 分类列表是服务端渲染的 HTML（/api/cate 返回 405），因此从页面解析。
  categoryComics = {
    load: async (category, param, options, page) => {
      const pathMap = {
        "": "/cate",
        热血: "/cate/hotblooded",
        玄幻: "/cate/xuanhuan",
        恋爱: "/cate/romance",
        冒险: "/cate/adventure",
        古风: "/cate/historical",
        都市: "/cate/urban",
        穿越: "/cate/transmigration",
        奇幻: "/cate/fantasy",
        搞笑: "/cate/comedy",
        少男: "/cate/shounen",
        战斗: "/cate/action",
        重生: "/cate/rebirth",
        逆袭: "/cate/counterattack",
        爆笑: "/cate/hilarious",
        少年: "/cate/youth",
        系统: "/cate/system",
        BL: "/cate/bl",
        韩漫: "/cate/manhwa",
        完整版: "/cate/fullversion",
        "19r": "/cate/19plus",
        台版: "/cate/taiwanver",
      };
      const path = pathMap[param] || "/cate";
      const status = options && options[0] !== undefined ? options[0] : "2";
      const day = options && options[1] !== undefined ? options[1] : "0";
      // 引擎不提供 URLSearchParams，手工拼查询串。
      const qs = [`page=${encodeURIComponent(page)}`];
      if (status !== "2") qs.push(`status=${encodeURIComponent(status)}`);
      if (day !== "0") qs.push(`day=${encodeURIComponent(day)}`);
      const url = `${this.base}${path}?${qs.join("&")}`;

      const res = await Network.sendRequest("GET", url, {});
      if (res.status !== 200) throw `Invalid status code: ${res.status}`;
      const doc = new HtmlDocument(res.body);
      const comics = doc.querySelectorAll("#dataList section .item").map((el) => {
        const link = el.querySelector("a");
        const href = (link && link.attributes && link.attributes.href) || "";
        const id = (href.match(/\/comic\/(\d+)/) || [])[1] || href.split("/").pop();
        const coverEl = el.querySelector(".thumb_img");
        const cover = coverEl && coverEl.attributes ? coverEl.attributes["data-src"] || coverEl.attributes["src"] : "";
        const titleEl = el.querySelector(".title");
        const descEl = el.querySelector(".desc");
        const tagsEl = el.querySelector(".badge");
        const tags = tagsEl
          ? tagsEl.querySelectorAll("span").map((s) => s.text).filter((t) => t && t !== "暂无")
          : [];
        return new Comic({
          id: String(id),
          title: titleEl ? titleEl.text.trim() : "",
          cover: cover || "",
          tags,
          description: descEl ? descEl.text.trim() : "",
        });
      });
      let maxPage = 1000;
      const m = res.body.match(/totalPages:\s*(\d+)/);
      if (m) maxPage = parseInt(m[1]);
      doc.dispose();
      return { comics, maxPage };
    },
    optionList: [
      { options: ["2-全部", "0-连载中", "1-已完结"] },
      { options: ["0-全部", "1-周一", "2-周二", "3-周三", "4-周四", "5-周五", "6-周六", "7-周日"] },
      { options: ["0-更新", "1-新作", "2-畅销", "3-热门", "4-收藏"] },
    ],
  };

  /// search related
  search = {
    load: async (keyword, options, page) => {
      const pageSize = 20;
      const params = { keyword, page, page_size: pageSize };
      const data = await this.fetchJson(`${this.api}/search`, { params }).then((res) => res.data);
      const total = data.total || 0;
      const comics = (data.list || []).map(
        (item) =>
          new Comic({
            id: item.id.toString(),
            title: item.title,
            subTitle: item.author,
            cover: item.cover,
            tags: (item.tags || "").split(",").filter((t) => t),
            description: item.description,
            status: item.status == 0 ? "连载中" : "已完结",
          })
      );
      return { comics, maxPage: Math.max(1, Math.ceil(total / pageSize)) };
    },
  };

  /// single comic related
  comic = {
    loadInfo: async (id) => {
      const data = await this.fetchJson(`${this.base}/api/comic/${id}`).then((res) => res.data);

      // 章节列表：服务端把 page_size 硬限制为 20（传 50/100 都只回 20 条），
      // 所以必须逐页翻，页数由 pagination.total 推出来。
      const chapterApi = `${this.base}/api/comic/chapter`;
      const pageSize = 20;
      const first = await this.fetchJson(chapterApi, {
        params: { comicId: data.id, page: 1, page_size: pageSize },
      });
      const total = (first.pagination && first.pagination.total) || 0;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));

      const chapters = new Map();
      const addChapters = (list) => {
        (list || []).forEach((item) => {
          chapters.set(item.id.toString(), item.title.toString());
        });
      };
      addChapters(first.data);
      for (let page = 2; page <= pageCount; page++) {
        const res = await this.fetchJson(chapterApi, {
          params: { comicId: data.id, page: page, page_size: pageSize },
        });
        addChapters(res.data);
        if (!res.data || res.data.length === 0) break;
      }

      return new ComicDetails({
        title: data.title.toString(),
        subTitle: data.author.toString(),
        cover: data.cover,
        tags: {
          类型: (data.tags || "").split(",").filter((t) => t),
          状态: data.status == 0 ? "连载中" : "已完结",
        },
        chapters,
        description: data.intro,
        updateTime: data.editTime ? new Date(data.editTime * 1000).toLocaleDateString() : undefined,
      });
    },

    loadEp: async (comicId, epId) => {
      if (epId === undefined || epId === null || epId === "" || epId === "null" || epId === "undefined") {
        throw "章节 id 无效（当前漫画没有可用章节）";
      }
      const imgApi = `${this.base}/api/comic/image/${epId}`;
      const images = [];
      const seen = new Set();
      for (let page = 1; ; page++) {
        const response = await this.fetchJson(imgApi, { params: { page, page_size: 100 } });
        const data = response.data;
        if (!Array.isArray(data?.images) || !data.images.length) throw "该章节没有返回正文图片";
        const previousCount = images.length;
        for (const item of data.images) {
          if (typeof item.url !== "string" || !/^https?:\/\//i.test(item.url)) throw "章节图片地址无效";
          if (!seen.has(item.url)) { seen.add(item.url); images.push(item.url); }
        }
        const total = Number(data.pagination?.total);
        const lastPage = Number(data.pagination?.total_pages);
        if (total > 0 && images.length >= total) break;
        if (images.length === previousCount || (lastPage && page >= lastPage)) {
          if (total > images.length) throw "章节图片分页不完整，请重试";
          break;
        }
        if (!lastPage && !total && data.images.length < 100) break;
      }
      return { images };
    },

    // 章节大图：IV(16B) + AES-256-CBC，解密走 manwabaDecryptImage()。
    onImageLoad: (url, comicId, epId) => ({
      headers: {
        Referer: comicId && epId ? `${this.base}/comic/${comicId}/${epId}` : `${this.base}/`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      onResponse: (bytes) => manwabaDecryptImage(bytes),
    }),

    // 封面/缩略图走这里（Venera 的缩略图不经过 onImageLoad），所以解密要再做一份。
    onThumbnailLoad: (url) => ({
      headers: {
        Referer: `${this.base}/`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      onResponse: (bytes) => manwabaDecryptImage(bytes),
    }),
  };

}
