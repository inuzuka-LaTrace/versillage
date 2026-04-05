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
    
    // ─── 修正ポイント ───
    // 入力要素（textarea等）にフォーカスがある場合は、Spaceや矢印キーのショートカットを無効化する
    if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
      // Ctrl+Enter だけは通したいので、それ以外は return
      if (!(e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
        return; 
      }
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (!fc.flipped) fc.setFlipped(true);
    }
    // ...以降の判定ロジック
  };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fc.flipped, fc.finished, fc.cards.length, fc.judge, fc.setFlipped, fc.mode]); // fc.modeを依存配列に追加
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
            <div className={`w-px ${darkMode ? 'bg-zinc-700' : 'bg-stone-200'}`} />
            <ModeTab value="dictation"  label="ディクテーション" /> {/* ← 追加 */}
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

    const [localInput, setLocalInput] = useState(fc.userInput || '');
    // カードが切り替わった時にローカルの状態をリセットする
    useEffect(() => {
    setLocalInput(fc.userInput || '');
    }, [fc.index, fc.flipped]);

    const textMain = darkMode ? 'text-stone-200' : 'text-stone-900';
  const textSub  = darkMode ? 'text-stone-500' : 'text-stone-400';

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4 space-y-6">
      
      {/* ── 問題表示エリア ── */}
      <div className={`flex-1 flex flex-col items-center justify-center p-8 rounded-3xl border transition-all ${
        darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-stone-200'
      }`}>
        
        {/* ヒント文（訳、または冒頭） */}
        <p className={`font-serif text-center italic mb-8 opacity-60 ${textMain} ${textSizeClass(frontText)}`}>
          {frontText}
        </p>

        {/* 入力 or 結果表示 */}
        {!fc.flipped ? (
          <textarea
            key={`input-${fc.index}`}
            autoFocus
            className={`w-full h-64 p-6 rounded-2xl border font-serif text-center leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all resize-none text-xl ${
              darkMode ? 'bg-zinc-800/40 border-zinc-700 text-zinc-200' : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}
            placeholder="Write the original text here..."
            value={localInput}
            onChange={(e) => {
              setLocalInput(e.target.value);
              fc.setUserInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') fc.setFlipped(true);
            }}
          />
        ) : (
          <div className="w-full space-y-8 animate-in fade-in duration-700">
            {/* 正解の原文 */}
            <div className="text-center space-y-2">
              <p className={`${textSub} text-[10px] uppercase tracking-[0.2em]`}>Original</p>
              <p className={`font-serif whitespace-pre-line ${textMain} ${textSizeClass(backText)}`}>
                {backText}
              </p>
            </div>

            {/* 自分の入力との比較 */}
            <div className={`p-6 rounded-2xl border font-serif ${
              darkMode ? 'bg-zinc-800/20 border-zinc-700' : 'bg-stone-50 border-stone-100'
            }`}>
              <p className={`${textSub} text-[10px] uppercase tracking-[0.2em] mb-3`}>Your Transcription</p>
              <p className={`${textMain} ${textSizeClass(localInput)} opacity-80`}>
                {localInput || '(No input)'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 操作・ナビゲーション ── */}
      <div className="shrink-0 pb-4">
        {!fc.flipped ? (
          <p className={`text-center text-xs font-sans ${textSub} opacity-50`}>
            Ctrl + Enter to evaluate
          </p>
        ) : (
          <div className="flex justify-center gap-8 animate-in slide-in-from-bottom-2">
             {/* ここに Good / Again ボタンを配置 */}
             <button onClick={() => fc.judge('again')} className="...">Again</button>
             <button onClick={() => fc.judge('good')}  className="...">Good</button>
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
