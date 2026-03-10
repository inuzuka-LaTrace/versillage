// ─── constants.js ────────────────────────────────────────────
// 状態・ランタイムに依存しない純粋定数
// App.jsx から import して使用する
// ─────────────────────────────────────────────────────────────

// カテゴリー定義（フィルターボタン・ラベル表示）
export const CATEGORIES = {
  all:                        { name: 'すべて' },
  racine:                     { name: 'ラシーヌ' },
  mallarme:                   { name: 'マラルメ' },
  mallarme_critique:          { name: 'マラルメ批評' },
  baudelaire:                 { name: 'ボードレール' },
  baudelaire_critique:        { name: 'ボードレール批評' },
  valery:                     { name: 'ヴァレリー' },
  valery_critique:            { name: 'ヴァレリー批評' },
  verlaine:                   { name: 'ヴェルレーヌ' },
  verlaine_critique:          { name: 'ヴェルレーヌ批評' },
  rimbaud:                    { name: 'ランボー' },
  gautier:                    { name: 'ゴーティエ' },
  leconte_de_lisle:           { name: 'ルコント・ド・リール' },
  banville:                   { name: 'バンヴィル' },
  valmore:                    { name: 'ヴァルモール' },
  rodenbach:                  { name: 'ローデンバック' },
  vanlerberghe:               { name: 'ヴァン・レルベルグ' },
  poe:                        { name: 'ポー' },
  wilde:                      { name: 'ワイルド' },
  swinburne:                  { name: 'スウィンバーン' },
  yeats:                      { name: 'イェイツ' },
  george:                     { name: 'ゲオルゲ' },
  hofmannsthal:               { name: 'ホフマンスタール' },
  trakl:                      { name: 'トラークル' },
  hoelderlin:                 { name: 'ヘルダーリン' },
  dante:                      { name: 'ダンテ' },
  dannunzio:                  { name: 'ダヌンツィオ' },
};

// カテゴリー省略ラベル（バッジ表示用）
export const CAT_SHORT = {
  racine:                  'ラシーヌ',
  mallarme:                'マラルメ',
  mallarme_critique:       'マラルメ批評',
  baudelaire:              'ボードレール',
  baudelaire_critique:     'ボードレール批評',
  valery:                  'ヴァレリー',
  valery_critique:         'ヴァレリー批評',
  verlaine:                'ヴェルレーヌ',
  verlaine_critique:       'ヴェルレーヌ批評',
  rimbaud:                 'ランボー',
  gautier:                 'ゴーティエ',
  banville:                'バンヴィル',
  leconte_de_lisle:        'ルコント・ド・リール',
  valmore:                 'ヴァルモール',
  rodenbach:               'ローデンバック',
  vanlerberghe:            'ヴァン・レルベルグ',
  poe:                     'ポー',
  wilde:                   'ワイルド',
  swinburne:               'スウィンバーン',
  yeats:                   'イェイツ',
  george:                  'ゲオルゲ',
  hofmannsthal:            'ホフマンスタール',
  trakl:                   'トラークル',
  hoelderlin:              'ヘルダーリン',
  dante:                   'ダンテ',
  dannunzio:               'ダヌンツィオ',
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
};

// フラッシュカード：長文除外しきい値（文字数）
export const FC_MAX_CHARS = 300;
