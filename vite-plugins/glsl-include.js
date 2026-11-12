import { readFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';

/**
 * .glslを文字列としてimportできるようにし、`#include ../Utils/map.glsl` を展開するViteプラグイン
 * (vite-plugin-glslの置き換え。Viteのバージョンアップに縛られないよう基本APIだけを使う)
 *
 * - `#include <colorspace_fragment>` のようなThree.jsの組み込みチャンクは展開しない(Three.jsが実行時に展開する)
 * - パスのクォート・末尾の`;`は有無どちらでもよい。拡張子を省略したら.glsl、`/`始まりはプロジェクトルート基準
 * - 1つのシェーダーの中で同じファイルは1回だけ展開する(循環しているincludeもここで止まる)
 * - `?raw` などクエリ付きのimportはViteの標準処理に任せる
 */
const SHADER_RE = /\.(glsl|vert|frag)$/;
const INCLUDE_RE = /^[ \t]*#include[ \t]+(?!<)([^\s;]+)[ \t]*;?[ \t]*$/gm;
// GLSLには文字列リテラルが無いので、正規表現でそのまま消してよい
const COMMENT_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

export default function glslInclude() {
    let root = process.cwd();

    return {
        name: 'glsl-include',
        enforce: 'pre',

        configResolved(config) {
            root = config.root;
        },

        load(id) {
            const [file, query] = id.split('?');
            if (!SHADER_RE.test(file)) return null;
            const params = new URLSearchParams(query);
            if (params.has('raw') || params.has('url') || params.has('inline')) return null;

            const included = new Set();
            const code = expandGlsl(file, root, included);
            for (const chunk of included) this.addWatchFile(chunk);

            return { code: `export default ${JSON.stringify(code)};`, map: { mappings: '' } };
        },
    };
}

/**
 * シェーダーファイルを読み込み、#includeを再帰的に展開した文字列を返す
 * @param {string} file 絶対パス
 * @param {string} root `/`始まりのincludeの基準ディレクトリ
 * @param {Set<string>} included 展開済みファイル(重複・循環の防止用)
 */
export function expandGlsl(file, root, included = new Set()) {
    included.add(resolve(file));

    const source = readFileSync(file, 'utf8')
        .replace(/\r\n?/g, '\n')
        .replace(COMMENT_RE, '');

    return source.replace(INCLUDE_RE, (_, spec) => {
        const path = spec.replace(/^['"]|['"]$/g, '');
        let chunk = path.startsWith('/') ? resolve(root, `.${path}`) : resolve(dirname(file), path);
        if (!extname(chunk)) chunk += '.glsl';

        if (included.has(chunk)) return '';
        return expandGlsl(chunk, root, included);
    }).trim().replace(/\n{3,}/g, '\n\n');
}
