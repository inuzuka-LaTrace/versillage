import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw, ThumbsUp, ThumbsDown, Shuffle,
  GraduationCap, Sun, Moon,
} from 'lucide-react';

// ── データインポート（VANITISMEと共通） ──────────────────────
import racineData        from '../data/racine';
import mallarmeData      from '../data/mallarme';
import baudelaireData    from '../data/baudelaire';
import valeryData        from '../data/valery';
import valmoreData       from '../data/valmore';
import rimbaudData       from '../data/rimbaud';
import verlaineData      from '../data/verlaine';
import lecontelisleData from '../data/lecontelisle';
import banvilleData from '../data/banville';
import rodenbachData from '../data/rodenbach';
import verhaerenData from '../data/verhaeren';
import maeterlinckData from '../data/maeterlinck';
import vanlerbergheData from '../data/vanlerberghe';
import gautierData from '../data/gautier';
import georgeData from '../data/george';
import hofmannsthalData from '../data/hofmannsthal';
import traklData from '../data/trakl';
import hoelderlinData from '../data/hoelderlin';
import rilkeData from '../data/rilke';
import danteData from '../data/dante';
import dannunzioData from '../data/dannunzio';
import pascoliData from '../data/pascoli';
import gozzanoData from '../data/gozzano';
import corazziniData from '../data/corazzini';
import bryusovData from '../data/bryusov';
import sologubData from '../data/sologub';
import blokData from '../data/blok';
import balmontData from '../data/balmont';
import poeData from '../data/poe';
import wildeData from '../data/wilde';
import dowsonData from '../data/dowson';
import swinburneData from '../data/swinburne';
import rossetti_cData from '../data/rossetti_c';
import d_g_rossettiData from '../data/d_g_rossetti';
import yeatsData from '../data/yeats';

import { CAT_SHORT } from '../constants';
import { getOriginalText, getTranslation } from '../utils';
import { useFlashcard, getCardFront, getCardBack, buildCards } from './useFlashcard';

// ── 全テキスト統合 ────────────────────────────────────────────
const ALL_TEXTS = {
  ...mallarmeData,
      ...baudelaireData,
      ...valeryData,
      ...verlaineData,
      ...gautierData,
      ...valmoreData,
      ...lecontelisleData,
      ...banvilleData,
      ...rodenbachData,
      ...verhaerenData,
      ...maeterlinckData,
      ...vanlerbergheData,
      ...racineData,
      ...rimbaudData,
      ...danteData,
      ...dannunzioData,
      ...pascoliData,
      ...gozzanoData,
      ...corazziniData,
      ...bryusovData,
      ...sologubData,
      ...blokData,
      ...balmontData,
      ...poeData,
      ...wildeData,
      ...dowsonData,
      ...swinburneData,
      ...yeatsData,
      ...rossetti_cData,
      ...d_g_rossettiData,
      ...georgeData,
　　　　...hofmannsthalData,
      ...traklData,
      ...hoelderlinData,
      ...rilkeData,
};

// ── カテゴリーカラー（VANITISMEと同系） ─────────────────────
const catColor = (cat) => {
  if (!cat) return 'text-stone-400';
  if (cat.startsWith('racine'))       return 'text-violet-400';
  if (cat.startsWith('baudelaire'))   return 'text-amber-400';
  if (cat.startsWith('mallarme'))     return 'text-sky-400';
  if (cat.startsWith('valery'))       return 'text-rose-400';
  if (cat.startsWith('verlaine'))     return 'text-violet-300';
  if (cat.startsWith('gautier'))      return 'text-cyan-400';
  if (cat.startsWith('valmore'))      return 'text-pink-400';
  if (cat.startsWith('yeats'))        return 'text-slate-400';
  if (cat.startsWith('george'))       return 'text-teal-400';
  if (cat.startsWith('hofmannsthal')) return 'text-yellow-400';
  if (cat.startsWith('trakl'))        return 'text-blue-400';
  if (cat.startsWith('hoelderlin'))   return 'text-indigo-400';
  return 'text-stone-400';
};

const catBg = (cat) => {
  if (!cat) return 'bg-stone-800 text-stone-300';
  if (cat.startsWith('racine'))       return 'bg-violet-900/50 text-violet-300';
  if (cat.startsWith('baudelaire'))   return 'bg-amber-900/50 text-amber-300';
  if (cat.startsWith('mallarme'))     return 'bg-sky-900/50 text-sky-300';
  if (cat.startsWith('valery'))       return 'bg-rose-900/50 text-rose-300';
  if (cat.startsWith('verlaine'))     return 'bg-violet-900/40 text-violet-300';
  if (cat.startsWith('gautier'))      return 'bg-cyan-900/50 text-cyan-300';
  if (cat.startsWith('valmore'))      return 'bg-pink-900/50 text-pink-300';
  if (cat.startsWith('yeats'))        return 'bg-slate-800 text-slate-300';
  if (cat.startsWith('george'))       return 'bg-teal-900/50 text-teal-300';
  if (cat.startsWith('hofmannsthal')) return 'bg-yellow-900/50 text-yellow-300';
  if (cat.startsWith('trakl'))        return 'bg-blue-900/50 text-blue-300';
  if (cat.startsWith('hoelderlin'))   return 'bg-indigo-900/50 text-indigo-300';
  return 'bg-zinc-800 text-zinc-300';
};

// ── フォントサイズヘルパー ────────────────────────────────────
const textSizeClass = (text) => {
  const len = text?.length ?? 0;
  if (len <= 80)  return 'text-2xl leading-relaxed';
  if (len <= 180) return 'text-xl leading-relaxed';
  if (len <= 300) return 'text-base leading-loose';
  return 'text-sm leading-loose';
};

// テキスト内の特定の単語を「空所」に置き換える
const renderClozeText = (text, isFlipped, darkMode) => {
  if (!text) return null;

  // 例: 6文字以上の単語を抽出（言語に合わせて調整）
  // 詩のデータ構造に合わせ、正規表現で単語を分割
  const tokens = text.split(/(\s+)/); 

  return tokens.map((token, i) => {
    // 記号を除いた長さが5文字以上、かつ一定確率で隠す（あるいは全て隠す）
    const isTarget = token.trim().length >= 5; 

    if (isTarget) {
      return (
        <span
          key={i}
          className={`mx-1 px-2 rounded transition-all duration-300 ${
            isFlipped 
              ? (darkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-100 text-amber-800')
              : (darkMode ? 'bg-zinc-800 text-transparent select-none' : 'bg-stone-200 text-transparent select-none')
          } border-b ${darkMode ? 'border-zinc-600' : 'border-stone-300'}`}
        >
          {token}
        </span>
      );
    }
    return <span key={i}>{token}</span>;
  });
};

// ════════════════════════════════════════════════════════════
// メインコンポーネント
// ════════════════════════════════════════════════════════════
export default function FlashcardApp() {
  const [darkMode, setDarkMode] = useState(true);

  const fc = useFlashcard(ALL_TEXTS);

  // ── キーボードショートカット ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (fc.finished || fc.cards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!fc.flipped) fc.setFlipped(true);
      }
      if (e.code === 'ArrowRight' && fc.flipped) fc.judge('good');
      if (e.code === 'ArrowLeft'  && fc.flipped) fc.judge('again');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fc.flipped, fc.finished, fc.cards.length, fc.judge, fc.setFlipped]);

  // ── カテゴリー一覧（存在するものだけ） ───────────────────
  const categories = [...new Set(Object.values(ALL_TEXTS).map(t => t.category))].sort();

  // ── テーマ変数 ────────────────────────────────────────────
  const bg          = darkMode ? 'bg-zinc-950' : 'bg-stone-50';
  const cardBg      = darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200';
  const textMain    = darkMode ? 'text-zinc-100' : 'text-stone-900';
  const textSub     = darkMode ? 'text-zinc-400' : 'text-stone-500';
  const border      = darkMode ? 'border-zinc-800' : 'border-stone-200';
  const inputCls    = darkMode
    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-amber-500'
    : 'bg-stone-100 border-stone-300 text-stone-900 placeholder-stone-400 focus:border-amber-500';
  const btnSecondary = darkMode
    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
    : 'bg-stone-100 border-stone-300 text-stone-600 hover:bg-stone-200';
  const btnPrimary = darkMode
    ? 'bg-amber-700 hover:bg-amber-600 text-amber-100'
    : 'bg-stone-800 hover:bg-stone-700 text-white';

  // ── ソース選択タブ ─────────────────────────────────────────
  const SourceTab = ({ value, label }) => (
    <button
      onClick={() => { fc.setSource(value); fc.setSourceId(''); }}
      className={`flex-1 py-2.5 text-sm font-medium transition-colors font-sans rounded-lg ${
        fc.source === value ? btnPrimary : btnSecondary + ' border'
      }`}
    >
      {label}
    </button>
  );

  // ── モード選択タブ ─────────────────────────────────────────
  const ModeTab = ({ value, label }) => (
    <button
      onClick={() => fc.setMode(value)}
      className={`flex-1 py-2 text-xs font-medium transition-colors font-sans ${
        fc.mode === value
          ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-800 text-white'
          : darkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-stone-500 hover:bg-stone-100'
      }`}
    >
      {label}
    </button>
  );

  // ════════════════════════════════════════════════════════════
  // ① 設定画面
  // ════════════════════════════════════════════════════════════
  const SetupView = () => {
    const bookmarkCount = Object.values(fc.bookmarks).reduce((s, v) => s + v.length, 0);
    const canStart = fc.source === 'bookmarks' ? bookmarkCount > 0 : !!fc.sourceId;

    return (
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">

        {/* タイトル */}
        <div className="text-center space-y-1 pb-2">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap size={20} className={textSub} strokeWidth={1.5} />
            <h1 className={`text-2xl font-serif ${textMain}`}>フラッシュカード</h1>
          </div>
          <p className={`text-xs font-sans ${textSub}`}>VANITISME — 近代西洋詩篇・批評 対訳学習</p>
        </div>

        {/* ソース選択 */}
        <div className={`rounded-2xl border p-5 space-y-4 ${cardBg}`}>
          <label className={`text-xs font-semibold uppercase tracking-widest font-sans ${textSub} block`}>
            カードソース
          </label>
          <div className="flex gap-2">
            <SourceTab value="bookmarks" label={`ブックマーク${bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}`} />
            <SourceTab value="text"      label="テキスト指定" />
            <SourceTab value="category"  label="カテゴリ" />
          </div>

          {/* テキスト指定 */}
          {fc.source === 'text' && (
            <select
              value={fc.sourceId}
              onChange={e => fc.setSourceId(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${inputCls}`}
            >
              <option value="">-- テキストを選択 --</option>
              {Object.values(ALL_TEXTS).map(t => (
                <option key={t.id} value={t.id}>
                  {t.author} — {t.title} ({t.paragraphs?.length || 0}段落)
                </option>
              ))}
            </select>
          )}

          {/* カテゴリ指定 */}
          {fc.source === 'category' && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => fc.setSourceId(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-sans transition-colors border ${
                    fc.sourceId === cat
                      ? darkMode ? 'bg-amber-700 text-amber-100 border-amber-600' : 'bg-stone-800 text-white border-stone-700'
                      : darkMode ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                  }`}
                >
                  {CAT_SHORT[cat] || cat}
                </button>
              ))}
            </div>
          )}

          {/* ブックマークなし警告 */}
          {fc.source === 'bookmarks' && bookmarkCount === 0 && (
            <p className={`text-xs font-sans ${textSub} flex items-center gap-1.5`}>
              ブックマークがありません。VANITISMEで段落に🔖をつけてください。
            </p>
          )}
        </div>

        {/* 学習モード */}
        <div className={`rounded-2xl border p-5 space-y-3 ${cardBg}`}>
          <label className={`text-xs font-semibold uppercase tracking-widest font-sans ${textSub} block`}>
            モード選択
          </label>
          <div className={`flex rounded-xl overflow-hidden border ${border}`}>
            <ModeTab value="orig2trans" label="原文 → 訳" />
            <div className={`w-px ${darkMode ? 'bg-zinc-700' : 'bg-stone-200'}`} />
            <ModeTab value="trans2orig" label="訳 → 原文" />
            <div className={`w-px ${darkMode ? 'bg-zinc-700' : 'bg-stone-200'}`} />
            <ModeTab value="head2full"  label="冒頭 → 全文" />
            {/* ── ここに書き足します ── */}
            <div className={`w-px ${darkMode ? 'bg-zinc-700' : 'bg-stone-200'}`} />
            <ModeTab value="cloze"      label="空所補充" />
          </div>
        </div>

        {/* SRS 情報 */}
        {fc.totalGoodEver > 0 && (
          <div className={`rounded-2xl border p-4 flex items-center justify-between ${cardBg}`}>
            <div>
              <p className={`text-xs font-sans ${textSub}`}>累計習得</p>
              <p className={`text-2xl font-serif ${textMain}`}>{fc.totalGoodEver}<span className={`text-sm ml-1 ${textSub}`}>段落</span></p>
            </div>
            <button
              onClick={fc.resetSrs}
              className={`flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg border transition-colors ${btnSecondary}`}
            >
              <RotateCcw size={11} strokeWidth={2} />SRSリセット
            </button>
          </div>
        )}

        {/* 開始ボタン */}
        <button
          onClick={fc.startSession}
          disabled={!canStart}
          className={`w-full py-4 rounded-2xl text-base font-semibold font-sans transition-all ${
            canStart
              ? btnPrimary + ' shadow-lg'
              : 'opacity-30 cursor-not-allowed ' + (darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-stone-200 text-stone-400')
          }`}
        >
          <GraduationCap size={16} strokeWidth={1.8} className="inline mr-2" />
          セッションを開始
        </button>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // ② カード学習画面
  // ════════════════════════════════════════════════════════════
  const StudyView = () => {
    const card = fc.currentCard;
    if (!card) return null;

    const frontText = getCardFront(card, fc.mode);
    const userTrans = fc.getUserTrans(card.textId, card.paraId);
    const backText  = getCardBack(card, fc.mode, { [card.paraId]: userTrans ? { text: userTrans } : null }, fc.backMode);
    const hasUser   = !!userTrans;

    const frontLabel = fc.mode === 'orig2trans' ? '原文' : fc.mode === 'trans2orig' ? '訳' : '冒頭';
    const backLabel  = fc.mode === 'orig2trans' ? '訳'   : fc.mode === 'trans2orig' ? '原文' : '原文（全体）';

    const progress = (fc.index / fc.cards.length) * 100;

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5" style={{ minHeight: 'calc(100dvh - 56px)' }}>

        {/* 進捗バー + 情報 */}
        <div className="space-y-3">
          <div className={`w-full h-1 rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-stone-200'}`}>
            <div
              className="h-1 rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono tabular-nums ${textSub}`}>
                {fc.index + 1} / {fc.cards.length}
              </span>
              <span className={`text-xs font-sans px-2 py-0.5 rounded-full ${catBg(card.category)}`}>
                {CAT_SHORT[card.category] || card.category}
              </span>
              <span className={`text-xs font-sans ${textSub} hidden sm:inline`}>{card.textAuthor}</span>
            </div>
            {/* セッション中モード切替 */}
            <div className={`flex rounded-lg overflow-hidden border text-xs font-sans ${border}`}>
              {[['orig2trans','原→訳'],['trans2orig','訳→原'],['head2full','冒頭→全']].map(([val, label], i) => (
                <button
                  key={val}
                  onClick={() => { fc.setMode(val); fc.setFlipped(false); }}
                  className={`px-2.5 py-1 transition-colors ${i > 0 ? `border-l ${border}` : ''} ${
                    fc.mode === val
                      ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-800 text-white'
                      : darkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* テキスト名 */}
        <p className={`text-xs font-serif ${textSub} truncate`}>
          {card.textTitle}
          <span className={`ml-2 font-mono opacity-50`}>§{card.paraId}</span>
        </p>

        {/* ─── カード本体（3D flip） ─────────────────────── */}
        <div className="flex-1 flex flex-col justify-center" style={{ perspective: '1200px' }}>
          <div
            onClick={() => !fc.flipped && fc.setFlipped(true)}
            className={!fc.flipped ? 'cursor-pointer' : ''}
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s cubic-bezier(0.4,0.2,0.2,1)',
              transform: fc.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              position: 'relative',
              minHeight: '280px',
            }}
          >
            {/* 表面 */}
            <div
  className={`absolute inset-0 rounded-2xl border p-8 flex flex-col ${
    darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-stone-200'
  }`}
  style={{ backfaceVisibility: 'hidden' }}
>
  <span className={`text-xs font-sans uppercase tracking-widest ${textSub} shrink-0`}>
    {frontLabel}
  </span>
  <div className="flex-1 flex items-center justify-center overflow-y-auto py-4">
    <p className={`font-serif whitespace-pre-line text-center ${textMain} ${textSizeClass(frontText)}`}>
      {/* ── 修正ポイント: 空所補充モードの条件分岐 ── */}
      {fc.mode === 'cloze' 
        ? frontText.split(/(\s+)/).map((token, i) => {
            // 5文字以上の単語を隠蔽対象とする（記号を除いた判定）
            const isTarget = token.trim().length >= 5; 
            if (isTarget) {
              return (
                <span
                  key={i}
                  className={`mx-0.5 px-1 rounded transition-all duration-500 ${
                    fc.flipped 
                      ? (darkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-100 text-amber-800')
                      : (darkMode ? 'bg-zinc-800 text-transparent select-none' : 'bg-stone-200 text-transparent select-none')
                  } border-b ${darkMode ? 'border-zinc-600' : 'border-stone-300'}`}
                >
                  {token}
                </span>
              );
            }
            return <span key={i}>{token}</span>;
          })
        : frontText /* 通常モード */
      }
    </p>
  </div>
  <p className={`text-xs font-sans text-center ${textSub} opacity-40 shrink-0`}>
    タップ / Space で裏を見る
  </p>
</div>

            {/* 裏面 */}
            <div
              className={`absolute inset-0 rounded-2xl border p-8 flex flex-col ${
                darkMode
                  ? 'bg-zinc-900/90 border-amber-700/40'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {/* 裏ヘッダー */}
              <div className="flex items-center justify-between shrink-0">
                <span className={`text-xs font-sans uppercase tracking-widest ${darkMode ? 'text-amber-400' : 'text-amber-700'} opacity-80`}>
                  {backLabel}
                </span>
                {/* 仮訳 / 自訳 切替（head2full 以外） */}
                {fc.mode !== 'head2full' && fc.mode !== 'trans2orig' && (
                  <div className={`flex rounded-lg overflow-hidden border text-xs font-sans ${border}`}>
                    <button
                      onClick={e => { e.stopPropagation(); fc.setBackMode('provisional'); }}
                      className={`px-2.5 py-1 transition-colors ${
                        fc.backMode === 'provisional'
                          ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-700 text-white'
                          : darkMode ? 'text-zinc-400 hover:bg-zinc-700' : 'text-stone-500 hover:bg-stone-100'
                      }`}
                    >仮訳</button>
                    <button
                      onClick={e => { e.stopPropagation(); fc.setBackMode('user'); }}
                      disabled={!hasUser}
                      className={`px-2.5 py-1 transition-colors border-l ${border} ${
                        !hasUser
                          ? 'opacity-30 cursor-not-allowed ' + textSub
                          : fc.backMode === 'user'
                            ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-700 text-white'
                            : darkMode ? 'text-zinc-400 hover:bg-zinc-700' : 'text-stone-500 hover:bg-stone-100'
                      }`}
                    >自訳</button>
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center overflow-y-auto py-4">
                <p className={`font-serif whitespace-pre-line text-center ${textMain} ${textSizeClass(backText)}`}>
                  {backText}
                </p>
              </div>

              <p className={`text-xs font-sans text-center ${textSub} opacity-30 shrink-0`}>
                ← もう一度　　覚えた →
              </p>
            </div>
          </div>
        </div>

        {/* ─── 判定ボタン or スキップ ───────────────────── */}
        <div className="space-y-3 shrink-0">
          {fc.flipped ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fc.judge('again')}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold font-sans transition-all border ${btnSecondary}`}
              >
                <ThumbsDown size={16} strokeWidth={1.8} />
                <span>もう一度</span>
                <kbd className={`text-xs opacity-30 font-mono ml-1`}>←</kbd>
              </button>
              <button
                onClick={() => fc.judge('good')}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold font-sans transition-all ${btnPrimary}`}
              >
                <ThumbsUp size={16} strokeWidth={1.8} />
                <span>覚えた</span>
                <kbd className={`text-xs opacity-40 font-mono ml-1`}>→</kbd>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={fc.skip}
                className={`text-xs font-sans ${textSub} opacity-40 hover:opacity-70 transition-opacity`}
              >
                スキップ →
              </button>
              <button
                onClick={fc.shuffle}
                className={`flex items-center gap-1 text-xs font-sans ${textSub} opacity-40 hover:opacity-70 transition-opacity`}
              >
                <Shuffle size={11} strokeWidth={2} />シャッフル
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════
  // ③ 終了サマリー
  // ════════════════════════════════════════════════════════════
  const SummaryView = () => (
    <div className="max-w-sm mx-auto px-4 py-16 text-center space-y-8">
      <div className="space-y-2">
        <div className="text-5xl">🎓</div>
        <h2 className={`text-2xl font-serif ${textMain}`}>セッション完了</h2>
      </div>

      <div className={`rounded-2xl border p-6 grid grid-cols-3 gap-4 ${cardBg}`}>
        <div className="text-center">
          <p className={`text-3xl font-serif ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{fc.goodCount}</p>
          <p className={`text-xs font-sans mt-1 ${textSub}`}>覚えた</p>
        </div>
        <div className="text-center">
          <p className={`text-3xl font-serif ${textMain}`}>{fc.againCount}</p>
          <p className={`text-xs font-sans mt-1 ${textSub}`}>もう一度</p>
        </div>
        <div className="text-center">
          <p className={`text-3xl font-serif ${textMain}`}>{fc.goodCount + fc.againCount}</p>
          <p className={`text-xs font-sans mt-1 ${textSub}`}>合計</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={fc.restart}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold font-sans transition-all ${btnPrimary}`}
        >
          <RotateCcw size={13} strokeWidth={2} className="inline mr-2" />
          もう一周
        </button>
        <button
          onClick={fc.resetSession}
          className={`w-full py-3.5 rounded-2xl text-sm font-sans border transition-colors ${btnSecondary}`}
        >
          設定に戻る
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // ルートレンダリング
  // ════════════════════════════════════════════════════════════
  const isStudying = fc.cards.length > 0 && !fc.finished;
  const isDone     = fc.finished;

  return (
    <div
      className={`min-h-screen min-h-dvh ${darkMode ? 'bg-zinc-950' : 'bg-stone-50'}`}
      style={{ fontFamily: '"EB Garamond", "Noto Serif JP", serif' }}
    >
      {/* ── ヘッダー ───────────────────────────────────────── */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur-md ${
        darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-stone-50/90 border-stone-200'
      }`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={15} strokeWidth={1.5} className={textSub} />
            <span className={`text-sm font-Cinzel ${darkMode ? 'text-[#8a7a5a]' : 'text-stone-800'}`}>
              SCHOLA VANITISME
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 設定に戻るボタン（学習中のみ） */}
            {isStudying && (
              <button
                onClick={fc.resetSession}
                className={`text-xs font-sans px-3 py-1.5 rounded-lg border transition-colors ${btnSecondary}`}
              >
                終了
              </button>
            )}
            {/* ダークモード切替 */}
            <button
              onClick={() => setDarkMode(v => !v)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              {darkMode ? <Sun size={14} strokeWidth={1.6} /> : <Moon size={14} strokeWidth={1.6} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── メインコンテンツ ───────────────────────────────── */}
      {isDone      ? <SummaryView /> :
       isStudying  ? <StudyView />   :
                     <SetupView />   }
    </div>
  );
}
