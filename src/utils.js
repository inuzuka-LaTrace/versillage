// ─── utils.js ────────────────────────────────────────────────
// React・状態に依存しない純粋ユーティリティ関数
// App.jsx から import して使用する
// ─────────────────────────────────────────────────────────────

import { PREFERRED_VOICES } from './constants';

// ── テキスト取得 ──────────────────────────────────────────────

/** provisionalTranslation / officialTranslation 両フィールド対応 */
export const getTranslation = (para) =>
  para.provisionalTranslation ?? para.officialTranslation ?? '';

/** french / originalText 両フィールド対応 */
export const getOriginalText = (para) =>
  para.french ?? para.originalText ?? '';

// ── 音声合成 ─────────────────────────────────────────────────

/** JSON の originalLang フィールドから言語コードを取得 */
export const getSpeechLang = (textObj) =>
  textObj?.originalLang ?? 'fr-FR';

/** 言語に対応する最適な SpeechSynthesisVoice を返す */
export const getBestVoice = (lang) => {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefix = lang.split('-')[0];
  const preferred = PREFERRED_VOICES[prefix] || [];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return voices.find(v => v.lang.startsWith(lang.split('-')[0])) ?? null;
};

// ── 検索・スニペット ──────────────────────────────────────────

/**
 * テキストオブジェクトからクエリにマッチした箇所の前後 contextLen 文字を抜粋する
 * @returns {{ snippet: string, label: string, matchStart: number, matchLen: number } | null}
 */
export const extractSnippet = (text, q, contextLen = 30) => {
  const fields = [
    { text: text.title  || '', label: 'タイトル' },
    { text: text.author || '', label: '著者' },
    ...(text.paragraphs || []).flatMap(p => [
      { text: getOriginalText(p), label: '原文' },
      { text: getTranslation(p),  label: '訳'   },
    ]),
  ];
  for (const { text: t, label } of fields) {
    const idx = t.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) continue;
    const start = Math.max(0, idx - contextLen);
    const end   = Math.min(t.length, idx + q.length + contextLen);
    const snippet = (start > 0 ? '…' : '') + t.slice(start, end) + (end < t.length ? '…' : '');
    return {
      snippet,
      label,
      matchStart: idx - start + (start > 0 ? 1 : 0),
      matchLen: q.length,
    };
  }
  return null;
};

// ── フラッシュカード ──────────────────────────────────────────

/** SRS データのキー生成 */
export const fcParaKey = (textId, paraId) => `${textId}:${paraId}`;

/**
 * カード本文の文字数からフォントサイズ Tailwind クラスを返す
 * 6行超（≈180字）から縮小、さらに長い場合は xs まで落とす
 */
export const fcFontSizeClass = (text) => {
  const len = text?.length ?? 0;
  if (len <= 120) return 'text-base';
  if (len <= 250) return 'text-sm';
  return 'text-xs';
};

/**
 * authorColor の dot 色クラス（左ボーダー・カラードット用）
 * darkMode に依存せず bg-* クラスのみ返す
 */
export const authorDotColor = (cat) => {
  if (cat?.startsWith('racine'))           return 'bg-violet-400';
  if (cat?.startsWith('baudelaire'))       return 'bg-amber-400';
  if (cat?.startsWith('mallarme'))         return 'bg-sky-400';
  if (cat?.startsWith('valery'))           return 'bg-rose-400';
  if (cat?.startsWith('valmore'))          return 'bg-pink-400';
  if (cat?.startsWith('leconte_de_lisle')) return 'bg-stone-400';
  if (cat?.startsWith('rodenbach'))        return 'bg-sky-400';
  if (cat?.startsWith('vanlerberghe'))     return 'bg-emerald-400';
  if (cat?.startsWith('rimbaud'))          return 'bg-amber-400';
  if (cat?.startsWith('verlaine'))         return 'bg-violet-400';
  if (cat?.startsWith('gautier'))          return 'bg-cyan-400';
  if (cat?.startsWith('poe'))              return 'bg-red-400';
  if (cat?.startsWith('wilde'))            return 'bg-teal-400';
  if (cat?.startsWith('swinburne'))        return 'bg-indigo-400';
  if (cat?.startsWith('yeats'))            return 'bg-slate-400';
  if (cat?.startsWith('george'))           return 'bg-teal-400';
  if (cat?.startsWith('hofmannsthal'))     return 'bg-yellow-400';
  if (cat?.startsWith('trakl'))            return 'bg-blue-400';
  if (cat?.startsWith('hoelderlin'))       return 'bg-indigo-400';
  return 'bg-stone-400';
};

// ── URLルーティング ───────────────────────────────────────────

/** ハッシュ形式: #/text/<textId> または #/text/<textId>/para/<paraId> */
export const getRouteFromHash = () => {
  const m = window.location.hash.match(/^#\/text\/([^/]+)(?:\/para\/(.+))?$/);
  if (!m) return { textId: null, paraId: null };
  return { textId: m[1], paraId: m[2] ? (isNaN(m[2]) ? m[2] : Number(m[2])) : null };
};

export const pushTextHash = (textId) => {
  window.location.hash = `/text/${textId}`;
};
