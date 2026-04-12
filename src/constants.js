// ─── constants.js ────────────────────────────────────────────
// 状態・ランタイムに依存しない純粋定数
// App.jsx から import して使用する
// ─────────────────────────────────────────────────────────────

// カテゴリー定義（フィルターボタン・ラベル表示）
export const CATEGORIES = {
  all:                        { name: 'すべて' },
  racine:                     { name: 'ラシーヌ' },
  mallarme:                   { name: 'マラルメ' },
  mallarme_prose:             { name: 'マラルメ散文' },
  baudelaire:                 { name: 'ボードレール' },
  baudelaire_prose:           { name: 'ボードレール散文' },
  valery:                     { name: 'ヴァレリー' },
  valery_prose:               { name: 'ヴァレリー散文' },
  verlaine:                   { name: 'ヴェルレーヌ' },
  verlaine_prose:             { name: 'ヴェルレーヌ散文' },
  rimbaud:                    { name: 'ランボー' },
  gautier:                    { name: 'ゴーティエ' },
  leconte_de_lisle:           { name: 'ルコント・ド・リール' },
  banville:                   { name: 'バンヴィル' },
  regnier:                    { name: 'レニエ' },
  valmore:                    { name: 'ヴァルモール' },
  weil:                       { name: 'ヴェイユ' },
  rodenbach:                  { name: 'ローデンバック' },
  verhaeren:                  { name: 'ヴェルハーレン' },
  maeterlinck:                { name: 'メーテルリンク' },
  vanlerberghe:               { name: 'ヴァン・レルベルグ' },
  george:                     { name: 'ゲオルゲ' },
  hofmannsthal:               { name: 'ホフマンスタール' },
  trakl:                      { name: 'トラークル' },
  hoelderlin:                 { name: 'ヘルダーリン' },
  rilke:                      { name: 'リルケ' },
  dante:                      { name: 'ダンテ' },
  dannunzio:                  { name: 'ダヌンツィオ' },
  pascoli:                    { name: 'パスコリ' },
  gozzano:                    { name: 'ゴッツァーノ' },
  corazzini:                  { name: 'コラッツィーニ' },
  bryusov:                    { name: 'ブリューソフ' },
  sologub:                    { name: 'ソログープ' },
  blok:                       { name: 'ブローク' },
  balmont:                    { name: 'バリモント' },
  tsvetaeva:                  { name: 'ツヴェターエワ' },
  poe:                        { name: 'ポー' },
  rossetti_c:                 { name: 'ロセッティ' },
  d_g_rossetti:               { name: 'D.G.ロセッティ' },
  wilde:                      { name: 'ワイルド' },
  dowson:                     { name: 'ダウスン' },
  swinburne:                  { name: 'スウィンバーン' },
  yeats:                      { name: 'イェイツ' },
};

// カテゴリー省略ラベル（バッジ表示用）
export const CAT_SHORT = {
  racine:                  'ラシーヌ',
  mallarme:                'マラルメ',
  mallarme_prose:       　　'マラルメ散文',
  baudelaire:              'ボードレール',
  baudelaire_prose:   　　  'ボードレール散文',
  valery:                  'ヴァレリー',
  valery_prose:     　　    'ヴァレリー散文',
  verlaine:                'ヴェルレーヌ',
  verlaine_prose:    　　   'ヴェルレーヌ散文',
  rimbaud:                 'ランボー',
  gautier:                 'ゴーティエ',
  banville:                'バンヴィル',
  leconte_de_lisle:        'ルコント・ド・リール',
  regnier:                 'レニエ',
  valmore:                 'ヴァルモール',
  weil:                    'ヴェイユ',
  rodenbach:               'ローデンバック',
  verhaeren:               'ヴェルハーレン',
  maeterlinck:             'メーテルリンク',
  vanlerberghe:            'ヴァン・レルベルグ',
  george:                  'ゲオルゲ',
  hofmannsthal:            'ホフマンスタール',
  trakl:                   'トラークル',
  hoelderlin:              'ヘルダーリン',
  rilke:                   'リルケ',
  dante:                   'ダンテ',
  dannunzio:               'ダヌンツィオ',
  pascoli:                 'パスコリ',
  gozzano:                 'ゴッツァーノ',
  corazzini:               'コラッツィーニ',
  bryusov:                 'ブリューソフ',
  sologub:                 'ソログープ',
  blok:                    'ブローク',
  balmont:                 'バリモント',
  tsvetaeva:               'ツヴェターエワ',
  poe:                     'ポー',
  rossetti_c:              'ロセッティ',
  d_g_rossetti:             'D.G.ロセッティ',
  wilde:                   'ワイルド',
  dowson:                  'ダウスン',
  swinburne:               'スウィンバーン',
  yeats:                   'イェイツ',
};

export const SPEAKER_COLORS = [
              { light: 'bg-violet-100 text-violet-800 border-violet-300',  dark: 'bg-violet-900/40 text-violet-200 border-violet-700' },
              { light: 'bg-sky-100 text-sky-800 border-sky-300',           dark: 'bg-sky-900/40 text-sky-200 border-sky-700' },
              { light: 'bg-rose-100 text-rose-800 border-rose-300',        dark: 'bg-rose-900/40 text-rose-200 border-rose-700' },
              { light: 'bg-teal-100 text-teal-800 border-teal-300',        dark: 'bg-teal-900/40 text-teal-200 border-teal-700' },
              { light: 'bg-amber-100 text-amber-800 border-amber-300',     dark: 'bg-amber-900/40 text-amber-200 border-amber-700' },
              { light: 'bg-indigo-100 text-indigo-800 border-indigo-300',  dark: 'bg-indigo-900/40 text-indigo-200 border-indigo-700' },
              { light: 'bg-emerald-100 text-emerald-800 border-emerald-300', dark: 'bg-emerald-900/40 text-emerald-200 border-emerald-700' },
              { light: 'bg-orange-100 text-orange-800 border-orange-300',  dark: 'bg-orange-900/40 text-orange-200 border-orange-700' },
];

export const SPEAKER_FIXED_COLORS = {
  'Dante-narratore': { light: 'bg-stone-100 text-stone-600 border-stone-300', dark: 'bg-zinc-800 text-zinc-300 border-zinc-600' },
  'Dante':           { light: 'bg-sky-100 text-sky-800 border-sky-300',       dark: 'bg-sky-900/40 text-sky-200 border-sky-700' },
  'Virgilio':        { light: 'bg-violet-100 text-violet-800 border-violet-300', dark: 'bg-violet-900/40 text-violet-200 border-violet-700' },
};

// 注釈タイプ定義（ラベル・カラークラス）
// darkMode に依存しないよう light/dark を両方持つ
export const ANNOTATION_TYPE_DEF = {
  glossary:     { label: '語釈', colorLight: 'bg-amber-100 text-amber-800 border-amber-300',    colorDark: 'bg-amber-900/40 text-amber-300 border-amber-700',    dot: 'bg-amber-400' },
  allusion:     { label: '典拠', colorLight: 'bg-rose-100 text-rose-800 border-rose-300',       colorDark: 'bg-rose-900/40 text-rose-300 border-rose-700',       dot: 'bg-rose-400' },
  commentary:   { label: '注釈', colorLight: 'bg-sky-100 text-sky-800 border-sky-300',          colorDark: 'bg-sky-900/40 text-sky-300 border-sky-700',          dot: 'bg-sky-400' },
  intertextual: { label: '参照', colorLight: 'bg-violet-100 text-violet-800 border-violet-300', colorDark: 'bg-violet-900/40 text-violet-300 border-violet-700', dot: 'bg-violet-400' },
  prosody:      { label: '韻律', colorLight: 'bg-teal-100 text-teal-800 border-teal-300',       colorDark: 'bg-teal-900/40 text-teal-300 border-teal-700',       dot: 'bg-teal-400' },
};

// 読み上げ速度設定
export const SPEECH_RATES = {
  fast:   { rate: 1.25, label: '高速' },
  normal: { rate: 0.9,  label: '通常' },
  slow:   { rate: 0.65, label: '低速' },
};

// 言語ごとの優先音声名リスト
export const PREFERRED_VOICES = {
  'fr': ['Thomas', 'Google français', 'Microsoft Julie', 'Amelie'],
  'de': ['Anna', 'Google Deutsch', 'Microsoft Hedda'],
  'en': ['Daniel', 'Google UK English Female', 'Samantha', 'Google US English'],
  'it': ['Alice', 'Google italiano', 'Microsoft Elsa', 'Luca'], 
  'ru': ['Google русский', 'Microsoft Irina', 'Milena'],
};

// フラッシュカード：長文除外しきい値（文字数）
export const FC_MAX_CHARS = 300;
