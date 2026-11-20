import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('./', import.meta.url));
const [repo = process.env.GITHUB_REPOSITORY, branch = process.env.GITHUB_REF_NAME || 'main'] = process.argv.slice(2);
if (!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(repo || '') || !branch) {
  throw new Error('用法：node tools/build.mjs GitHub用户名/仓库名 分支名');
}
const base = 'https://raw.githubusercontent.com/' + repo + '/refs/heads/' + branch.split('/').map(encodeURIComponent).join('/') + '/';
const sourceDir = root;
const output = root;
const files = (await fs.readdir(sourceDir)).filter(s => s.endsWith('.js')).sort();
if (!files.length) throw new Error('sources 文件夹中没有漫画源');
const compiled = [];
const keys = new Set();
for (const fileName of files) {
  if (!/^[a-zA-Z0-9_-]+\.js$/.test(fileName)) throw new Error('文件名须使用字母、数字、下划线或连字符：' + fileName);
  const source = await fs.readFile(path.join(sourceDir, fileName), 'utf8');
  new Script(source, { filename: fileName });
  const start = source.search(/^class \w+ extends ComicSource\b/m);
  if (start < 0) throw new Error(fileName + ' 缺少漫画源类');
  const body = source.slice(start);
  function field(key) {
    const match = body.match(new RegExp('^[ \\t]*' + key + '\\s*=\\s*(["\x27])([^"\x27]*)\\1','m'));
    if (!match) throw new Error(fileName + ' 缺少字段 ' + key);
    return match[2];
  }
  const name = field('name'), key = field('key'), version = field('version');
  if (!name || !/^\w+$/.test(key) || keys.has(key)) throw new Error(fileName + ' 的名称或唯一标识无效或重复');
  if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+)?$/.test(version)) throw new Error(fileName + ' 的版本号不兼容 Venera 1.6.3');
  keys.add(key);
  field('url');
  const url = base + fileName;
  const code = source.slice(0,start) + body.replace(/^([ \t]*url\s*=\s*)(["'])([^"']*)\2/m, (_,prefix)=> prefix+JSON.stringify(url));
  compiled.push({ fileName, code, entry: { name, key, version, fileName, url } });
}
const manifest = compiled.map(x => x.entry);
const preferred = ['baozi', 'manwaba'];
const rank = k => preferred.includes(k) ? preferred.indexOf(k) : preferred.length;
manifest.sort((a,b) => rank(a.key)-rank(b.key));
await fs.mkdir(output, { recursive: true });
for (const { fileName, code } of compiled) await fs.writeFile(path.join(output,fileName),code);
await fs.writeFile(path.join(output,'index.json'),JSON.stringify(manifest,null,2)+'\n');
for (const fileName of await fs.readdir(output)) {
  if (fileName.endsWith('.js') && !files.includes(fileName)) await fs.unlink(path.join(output,fileName));
}
console.log(manifest.length + ' 个漫画源 · ' + base + 'index.json');
