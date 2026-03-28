# フランス語-日本語対訳学習Webアプリ開発 - プロジェクト全体文書

## アプリ概要

### 目的
19-20世紀フランス批評理論・文学テキストの原文と日本語訳を並べて学習できるWebアプリケーション

### ターゲットユーザー
- フランス文学・批評理論を学ぶ学生・研究者
- フランス語学習者（中級〜上級）
- 比較文学・思想史に興味がある読者

### 主な機能一覧
1. **対訳表示機能**
   - フランス語原文と日本語訳を段落単位で並列表示
   - 表示/非表示の切り替え（原文・公式訳・自分の訳）
   
2. **ユーザー訳文機能**
   - 各段落に自分の訳を記入・保存
   - localStorage による永続化
   - 段落ごとの編集機能

3. **テキスト管理機能**
   - カテゴリー別フィルタリング
   - テキスト選択UI
   - メタデータ表示（著者、出典、年代、難易度）

4. **カスタマイズ機能**
   - ダークモード/ライトモード切り替え
   - フォントサイズ調整（小・中・大・特大）
   - フォント切り替え（Garamond, Noto Serif, Sans）

5. **学習支援機能**
   - キーワード表示
   - 関連テキストへのナビゲーション
   - 文脈説明
   - 段落数表示

---

## 現在の技術スタック

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **CSS Framework**: Tailwind CSS 3
- **Language**: JavaScript (JSX)

### State管理
- React Hooks (useState, useEffect)
- localStorage (ユーザー訳文の永続化)

### デプロイ
- **Hosting**: Vercel
- **Repository**: GitHub
- **CI/CD**: Vercel自動デプロイ（git push時）

### フォント
- **欧文Serif**: EB Garamond (Google Fonts)
- **和文Serif**: Noto Serif JP (Google Fonts)
- **欧文Sans**: Inter (Google Fonts)
- **和文Sans**: Noto Sans JP (Google Fonts)

### データ形式
- JSON形式のテキストデータ
- 静的import方式

---

## データ構造（最新のJSONスキーマ）

```typescript
interface TextData {
  [textId: string]: {
    id: string;                    // テキストID（例: "baudelaire_romantisme"）
    title: string;                 // タイトル
    author: string;                // 著者名
    source: string;                // 出典
    year: string;                  // 執筆年
    difficulty: string;            // 難易度（初級/中級/上級/最上級）
    category: string;              // カテゴリーID
    modernRelevance: string;       // 現代的重要性（★で表現）
    context: string;               // 文脈説明（50文字以内推奨）
    keywords: string[];            // キーワード配列
    relatedTexts: string[];        // 関連テキストID配列
    paragraphs: Paragraph[];       // 段落配列
  }
}

interface Paragraph {
  id: number;                      // 段落番号
  french: string;                  // フランス語原文
  officialTranslation: string;     // 公式日本語訳
}
```

### 例
```json
{
  "mallarme_crise": {
    "id": "mallarme_crise",
    "title": "Crise de vers",
    "author": "Stéphane Mallarmé",
    "source": "Divagations",
    "year": "1897",
    "difficulty": "上級",
    "category": "mallarme_poetics",
    "modernRelevance": "★★★★★",
    "context": "ユゴー後の詩の危機。自由詩の出現。",
    "keywords": ["crise", "vers", "Hugo", "poésie"],
    "relatedTexts": ["mallarme_musique", "mallarme_mystere"],
    "paragraphs": [
      {
        "id": 1,
        "french": "La littérature ici subit une exquise crise, fondamentale.",
        "officialTranslation": "ここで文学は、ある精妙な、根源的な危機を経験している。"
      }
    ]
  }
}
```

---

## ファイル構成

```
french-critique-app/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .gitignore
└── src/
    ├── main.jsx                  # React エントリーポイント
    ├── index.css                 # Tailwind ディレクティブ
    ├── App.jsx                   # メインアプリコンポーネント
    └── data/
        ├── baudelaire/           # ボードレール（1テキスト1ファイル）
        │   ├── index.js          # glob で全JSONを集約 export
        │   ├── romantisme.json
        │   ├── peintre.json
        │   ├── rire.json
        │   ├── wagner.json
        │   └── heroisme.json
        ├── mallarme/             # マラルメ（1テキスト1ファイル）
        │   ├── index.js
        │   ├── crise.json
        │   ├── mystere.json
        │   └── ...               # 他24編
        └── valery/               # ヴァレリー（1テキスト1ファイル）
            ├── index.js
            ├── vinci.json
            └── crise.json
```

---

## データディレクトリ構成（作家別・1テキスト1ファイル・採用済み）

**2026-02-19 採用**: 作家ごとフォルダ + 1テキスト1JSON。各作家の `index.js` が `import.meta.glob('./*.json', { eager: true })` で一括読み込みし `{ [id]: entry }` を export。App.jsx は `./data/baudelaire`, `./data/mallarme`, `./data/valery` のみ import。

以下は参考のため残す。大量のテキストを扱うための**作家ごとにディレクトリを分ける**構成。

### 提案A: 作家ディレクトリ + 分野別JSON（移行コスト低）

```
src/data/
├── baudelaire/
│   ├── index.js          # 下記JSONを import してマージし export
│   ├── aesthetics.json
│   ├── music.json
│   └── modernity.json
├── mallarme/
│   ├── index.js
│   ├── poetics.json
│   ├── book.json
│   ├── theatre.json
│   ├── music.json
│   └── culture.json
└── valery/
    ├── index.js
    └── index.json       # または valery.json
```

- **メリット**: 現在の「1ファイル＝複数テキスト」を維持できる。`App.jsx` の変更は import 先を `./data/baudelaire` 等にするだけ。
- **デメリット**: テキスト数が増えると1つのJSONが肥大化する。

**各作家の `index.js` の例（baudelaire）:**

```javascript
import aesthetics from './aesthetics.json';
import music from './music.json';
import modernity from './modernity.json';
export default { ...aesthetics, ...music, ...modernity };
```

**App.jsx の変更例:**

```javascript
import baudelaireData from './data/baudelaire';
import mallarmeData from './data/mallarme';
import valeryData from './data/valery';
// 以降、useEffect 内のマージは現状と同じ
```

---

### 提案B: 作家ディレクトリ + 1テキスト1ファイル（大量収蔵・推奨）

```
src/data/
├── baudelaire/
│   ├── index.js         # 下記全JSONを glob または列挙で読み込み export
│   ├── romantisme.json  # 単一テキスト { id, title, author, ... }
│   ├── peintre.json
│   ├── rire.json
│   ├── wagner.json
│   └── heroisme.json
├── mallarme/
│   ├── index.js
│   ├── crise.json
│   ├── mystere.json
│   ├── livre.json
│   └── ...              # 1編1ファイル
└── valery/
    ├── index.js
    ├── crise.json
    └── ...
```

- **メリット**:
  - 1ファイルが1テキストなので、追加・修正・レビューが容易。
  - 必要に応じて **Vite の `import.meta.glob`** で遅延読み込み（作家単位など）に拡張しやすい。
  - テキスト数が増えてもディレクトリが整理されたまま。
- **デメリット**: 各JSONの形を「単一オブジェクト」に揃える必要がある（現在は `{ textId: entry }` の複数キー）。読み込み側で `id` からキーを復元するか、`index.js` で `{ [entry.id]: entry }` に変換する必要がある。

**単一テキストJSONの形（提案B用）:**

```json
{
  "id": "baudelaire_romantisme",
  "title": "Qu'est-ce que le romantisme ?",
  "author": "Charles Baudelaire",
  "source": "Salon de 1846",
  "year": "1846",
  "difficulty": "中級",
  "category": "baudelaire_aesthetics",
  "modernRelevance": "★★★★★",
  "context": "ロマン主義の定義。近代性の概念の萌芽。",
  "keywords": ["romantisme", "beauté", "modernité", "sentiment"],
  "relatedTexts": ["baudelaire_peintre", "baudelaire_heroisme"],
  "paragraphs": [ { "id": 1, "french": "...", "officialTranslation": "..." } ]
}
```

**作家 `index.js` の例（Vite の glob 利用・提案B）:**

```javascript
const modules = import.meta.glob('./*.json', { eager: true });
const texts = {};
for (const path of Object.keys(modules)) {
  const entry = modules[path].default;
  if (entry && entry.id) texts[entry.id] = entry;
}
export default texts;
```

---

### 運用ルール（共通）

| 項目 | ルール |
|------|--------|
| ディレクトリ名 | 作家の姓（小文字・英語）。例: `baudelaire`, `mallarme`, `valery` |
| ファイル名 | テキストIDのサフィックス、または分野名。例: `romantisme.json`, `aesthetics.json` |
| 新著者の追加 | `src/data/{著者}/` を新設し、`App.jsx` または共通の `data/index.js` でその作家を1行追加 |
| カテゴリー追加 | 既存の `categories` オブジェクト（App.jsx）に1エントリ追加 |

---

### 移行の進め方

1. **まず提案Aで作家ディレクトリ化**: 既存JSONを分野別に分割し、`src/data/{作家}/` に配置。各作家の `index.js` でマージして export。`App.jsx` の import 先のみ変更。
2. **必要になったら提案Bへ**: 分野別JSONを「1テキスト1ファイル」に分割し、`index.js` を glob ベースに差し替え。既存のテキストID・カテゴリーはそのまま利用可能。

---

## 決まっている仕様・ルール

### キー命名規則
- **テキストID**: `{著者姓小文字}_{テキスト識別子}`
  - 例: `mallarme_crise`, `baudelaire_romantisme`
- **カテゴリーID**: `{著者姓}_{分野}`
  - 例: `mallarme_poetics`, `baudelaire_aesthetics`

### カテゴリー体系
```javascript
const categories = {
  baudelaire_aesthetics: 'ボードレール美学',
  baudelaire_music: 'ボードレール音楽論',
  baudelaire_modernity: 'ボードレール近代性',
  mallarme_poetics: 'マラルメ詩学',
  mallarme_book: 'マラルメ書物論',
  mallarme_representation: 'マラルメ表象論',
  mallarme_theatre: 'マラルメ演劇・表象論',
  mallarme_music: 'マラルメ音楽論',
  mallarme_culture: 'マラルメ文化論',
  valery: 'ヴァレリー'
};
```

### UI設計方針
1. **段落単位の表示**: 各段落をカードUIで表示
2. **色分けルール**:
   - 原文ラベル: 青系（indigo）
   - 公式訳ラベル: 緑系（green）
   - 自分の訳ラベル: 紫系（purple）
3. **レスポンシブデザイン**: モバイル対応（グリッド自動調整）
4. **ダークモード対応**: すべてのUI要素にダークモード色を定義

### テキスト長の目安
- **短編**: 3〜6段落
- **中編**: 6〜10段落
- **長編**: 10〜15段落
- **完全版**: テキスト全体（適宜分割）

### 段落数の原則
- 抜粋版: 6段落
- 完全版: 元のテキストをそのまま
---

## 未解決・保留事項

### 機能面
- [ ] 検索機能（テキスト全文検索）
- [ ] ブックマーク機能
- [ ] 進捗トラッキング
- [ ] ユーザー訳のエクスポート機能
- [ ] 複数ユーザー間での訳文共有

### コンテンツ面
- [ ] ボードレール「Salon de 1859」の収録（長大なため主要章のみ検討中）
- [ ] ヴァレリーの拡充（現在2編のみ）
- [ ] 新しい著者の追加（サント=ブーヴ、ゴンクール兄弟等）
- [ ] 20世紀批評理論への拡張（バルト、フーコー等）

### 技術面
- [ ] TypeScript化
- [ ] テストの導入
- [ ] PWA対応（オフライン閲覧）
- [ ] 音声読み上げ機能
- [ ] パフォーマンス最適化（大量テキスト時の遅延読み込み）

---

## これまでの主な決定事項・実装済み部分

### プロジェクト立ち上げ（2026-02-15）
- ✅ Reactベースアプリの基本設計決定
- ✅ 対訳形式の採用
- ✅ 段落単位での表示方式
- ✅ ボードレール・マラルメ・ヴァレリーの3著者で開始

### JSON化とデータ管理（2026-02-15〜16）
- ✅ データをJSONファイルに分離
- ✅ 静的importによる読み込み方式採用
- ✅ JSONスキーマの確立
- ✅ メタデータ項目の定義（keywords, relatedTexts等）

### デプロイ環境構築（2026-02-18）
- ✅ Vercel + GitHub デプロイ環境構築
- ✅ Vite プロジェクト構成
- ✅ Tailwind CSS セットアップ
- ✅ package.json 依存関係整理
- ✅ PostCSS設定の修正（CommonJS/ES Moduleの問題解決）

### UI/UX改善
- ✅ ダークモード実装
- ✅ フォントサイズ調整機能（小・中・大・特大）
- ✅ フォント切り替え機能（Garamond, Noto Serif, Sans）
- ✅ カテゴリーフィルタリング
- ✅ チェックボックスによる表示切り替え
- ✅ ラベル配色の視認性向上（白背景時の対応）
- ✅ 段落カードのホバーエフェクト

### フォント統合
- ✅ EB Garamond + Noto Serif JP の組み合わせ追加
- ✅ Google Fonts 統合
- ✅ index.html への preconnect 設定

### コンテンツ拡充

#### ボードレール（5編・30段落）
- ✅ Qu'est-ce que le romantisme?
- ✅ Le Peintre de la vie moderne
- ✅ De l'essence du rire
- ✅ Richard Wagner et Tannhäuser à Paris
- ✅ De l'héroïsme de la vie moderne

#### マラルメ 詩学・書物論等（16編・96段落）
- ✅ Crise de vers
- ✅ Le Mystère dans les Lettres
- ✅ La Musique et les Lettres
- ✅ Le Livre, instrument spirituel
- ✅ Quant au livre
- ✅ Mimique
- ✅ Expositions
- ✅ Plainte d'automne
- ✅ Lettre à Cazalis（1866年の重要書簡）
- その他7編

#### マラルメ 演劇・表象論（4編・36段落）- 完全版
- ✅ Ballets（全12段落）
- ✅ Les Fonds dans le ballet（全10段落）
- ✅ Hamlet（全8段落）
- ✅ Crayonné au théâtre（全6段落）

#### マラルメ 音楽論（2編・17段落）- 完全版
- ✅ Richard Wagner, rêverie d'un poëte français（全8段落）
- ✅ Plaisir sacré（全9段落）

#### ヴァレリー（2編・12段落）
- ✅ 2編収録済み

### ツール開発
- ✅ Wikisource → JSON 変換ツール（HTML版・簡易）
- ✅ AI搭載版変換ツール（自動メタデータ判定・自動翻訳）
  - Claude API統合
  - 段落自動分割
  - キーワード自動抽出
  - 文脈説明自動生成

### バグ修正
- ✅ 段落表示の二重レンダリング問題解決
- ✅ チェックボックス動作の修正
- ✅ ダークモード時のテキスト視認性問題解決
- ✅ JSON構文エラーの修正（カンマ位置等）
- ✅ mallarme-music.json 読み込みエラー解決

### 開発ワークフロー確立
- ✅ GitHub Web UIによる編集
- ✅ github.dev の活用（iPhoneからの編集）
- ✅ Vercel自動デプロイの確認
- ✅ 段階的なテキスト追加フロー（第1回・第2回等に分割）

---

## 現在の収録状況（2026-02-18時点）

| カテゴリー | ファイル | テキスト数 | 段落数 |
|-----------|---------|-----------|--------|
| ボードレール美学 | baudelaire.json | 3編 | 18段落 |
| ボードレール音楽 | baudelaire.json | 1編 | 6段落 |
| ボードレール近代性 | baudelaire.json | 1編 | 6段落 |
| マラルメ詩学・他 | mallarme.json | 16編 | 96段落 |
| マラルメ演劇論 | mallarme-theatre.json | 4編 | 36段落 |
| マラルメ音楽論 | mallarme-music.json | 2編 | 17段落 |
| ヴァレリー | valery.json | 2編 | 12段落 |
| **合計** | **5ファイル** | **29編** | **191段落** |

---

## デプロイURL
- Production: (Vercelによる自動生成URL)
- Repository: GitHub（ユーザー指定のリポジトリ）

---

## 今後の展開方向

### 短期（〜1ヶ月）
1. ボードレール「Salon de 1859」主要章の収録
2. ヴァレリーの拡充（5編程度追加）
3. 検索機能の実装

### 中期（〜3ヶ月）
1. 新著者の追加（サント=ブーヴ等）
2. PWA化（オフライン対応）
3. ユーザー訳のエクスポート機能

### 長期（〜6ヶ月）
1. 20世紀批評理論への拡張
2. 多言語対応（英語訳の追加等）
3. 学習進捗トラッキング機能

---

## 開発メモ

### よく使うコマンド
```bash
# ローカル開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# デプロイ（Vercel自動）
git add .
git commit -m "commit message"
git push
```

### トラブルシューティング
- **PostCSS設定エラー**: `.cjs` 拡張子を使用
- **import エラー**: ファイルパスとファイル存在を確認
- **JSON構文エラー**: 最後のオブジェクトにカンマなし、他はカンマ必須
- **段落重複表示**: 古いコードの削除漏れを確認

### iPhone からの編集
1. GitHub公式アプリ（簡易編集）
2. github.dev（本格編集・推奨）
   - URLの `github.com` を `github.dev` に変更

---

## 参考資料
- [Vite公式ドキュメント](https://vitejs.dev/)
- [React公式ドキュメント](https://react.dev/)
- [Tailwind CSS公式](https://tailwindcss.com/)
- [Vercel公式ドキュメント](https://vercel.com/docs)
- [EB Garamond - Google Fonts](https://fonts.google.com/specimen/EB+Garamond)

---

最終更新: 2026-02-18
