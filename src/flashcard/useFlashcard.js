// ─── useFlashcard.js ────────────────────────────────────────
// フラッシュカードのロジックをすべて集約するカスタムフック
// App.jsx から import して使用する
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { getOriginalText, getTranslation, fcParaKey } from '../utils';

const [userInput, setUserInput] = useState('');
const checkAnswer = (input, gold) => {
  const normalize = (str) => str.replace(/\s+/g, ' ').trim().toLowerCase();
  return normalize(input) === normalize(gold);
};

// ── SRS localStorage ──────────────────────────────────────────
const SRS_KEY = 'flashcard-status';
const BOOKMARKS_KEY = 'bookmarks';

const loadSrs = () => {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || '{}'); } catch { return {}; }
};

const saveSrsToStorage = (data) => {
  try { localStorage.setItem(SRS_KEY, JSON.stringify(data)); } catch {}
};

const loadBookmarks = () => {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}'); } catch { return {}; }
};

// ── カードビルダー ────────────────────────────────────────────
export const buildCards = (source, sourceId, texts, bookmarks, srsData) => {
  const allTextsArr = Object.values(texts);
  let pairs = [];

  if (source === 'bookmarks') {
    Object.entries(bookmarks).forEach(([textId, paraIds]) => {
      const t = texts[textId]; if (!t) return;
      paraIds.forEach(paraId => {
        const p = t.paragraphs?.find(p => p.id === paraId); if (!p) return;
        pairs.push({ textId, paraId, textTitle: t.title, textAuthor: t.author, para: p, category: t.category });
      });
    });
  } else if (source === 'text') {
    const t = texts[sourceId]; if (!t) return [];
    (t.paragraphs || []).forEach(p => {
      pairs.push({ textId: sourceId, paraId: p.id, textTitle: t.title, textAuthor: t.author, para: p, category: t.category });
    });
  } else if (source === 'category') {
    allTextsArr.filter(t => t.category === sourceId).forEach(t => {
      (t.paragraphs || []).forEach(p => {
        pairs.push({ textId: t.id, paraId: p.id, textTitle: t.title, textAuthor: t.author, para: p, category: t.category });
      });
    });
  }

  // 原文・訳の両方が存在する段落のみ
  pairs = pairs.filter(p => getOriginalText(p.para) && getTranslation(p.para));

  // SRS: 'again' または未学習を先、'good' を後にソート
  pairs.sort((a, b) => {
    const ka = fcParaKey(a.textId, a.paraId);
    const kb = fcParaKey(b.textId, b.paraId);
    const sa = (srsData[ka]?.status === 'good') ? 1 : 0;
    const sb = (srsData[kb]?.status === 'good') ? 1 : 0;
    return sa - sb;
  });

  return pairs;
};

// ── カードテキスト取得 ────────────────────────────────────────
export const getCardFront = (card, mode) => {
  if (!card) return '';
  if (mode === 'orig2trans') return getOriginalText(card.para);
  if (mode === 'trans2orig') return getTranslation(card.para);
  const orig = getOriginalText(card.para);
  return orig.slice(0, 30) + (orig.length > 30 ? '…' : '');
};

export const getCardBack = (card, mode, userTranslations, backMode) => {
  if (!card) return '';
  if (mode === 'orig2trans') {
    const provisional = getTranslation(card.para);
    const user = userTranslations?.[card.paraId];
    return (backMode === 'user' && user) ? user : provisional;
  }
  if (mode === 'trans2orig') return getOriginalText(card.para);
  return getOriginalText(card.para);
};

// ── メインフック ──────────────────────────────────────────────
export const useFlashcard = (texts) => {
  // 設定
  const [source, setSource]     = useState('bookmarks');
  const [sourceId, setSourceId] = useState('');
  const [mode, setMode]         = useState('orig2trans');
  const [backMode, setBackMode] = useState('provisional');

  // セッション
  const [cards, setCards]               = useState([]);
  const [index, setIndex]               = useState(0);
  const [flipped, setFlipped]           = useState(false);
  const [sessionResult, setSessionResult] = useState({});
  const [finished, setFinished]         = useState(false);

  // SRS
  const [srsData, setSrsData] = useState(loadSrs);

  // ブックマーク（localStorageから読み込み）
  const bookmarks = loadBookmarks();

  // ── セッション開始 ────────────────────────────────────────
  const startSession = useCallback(() => {
    const built = buildCards(source, sourceId, texts, bookmarks, srsData);
    setCards(built);
    setIndex(0);
    setFlipped(false);
    setSessionResult({});
    setFinished(false);
  }, [source, sourceId, texts, srsData]);

  // ── 判定 ──────────────────────────────────────────────────
  // ── 判定 ────────
const judge = useCallback((status) => {
  const card = cards[index];
  if (!card) return;
  const key = fcParaKey(card.textId, card.paraId);

  // SRS 保存
  setSrsData(prev => {
    const next = { ...prev, [key]: { status, lastSeen: Date.now() } };
    saveSrsToStorage(next);
    return next;
  });

  setSessionResult(prev => ({ ...prev, [key]: status }));

  if (index + 1 >= cards.length) {
    setFinished(true);
  } else {
    setIndex(i => i + 1);
    setFlipped(false);
    
    // ── 追加ポイント: 次のカードへ行く時にユーザー入力をクリアする ──
    if (setUserInput) { 
      setUserInput(''); 
    }
  }
}, [cards, index, setUserInput]); // 依存配列に setUserInput を追加
  // ── シャッフル ────────────────────────────────────────────
  const shuffle = useCallback(() => {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
  }, []);

  // ── リセット（設定画面に戻る） ────────────────────────────
  const resetSession = useCallback(() => {
    setCards([]);
    setFinished(false);
    setSessionResult({});
    setIndex(0);
    setFlipped(false);
  }, []);

  // ── SRSリセット ───────────────────────────────────────────
  const resetSrs = useCallback(() => {
    setSrsData({});
    try { localStorage.removeItem(SRS_KEY); } catch {}
  }, []);

  // ── もう一周 ──────────────────────────────────────────────
  const restart = useCallback(() => {
    const built = buildCards(source, sourceId, texts, bookmarks, srsData);
    setCards(built);
    setIndex(0);
    setFlipped(false);
    setSessionResult({});
    setFinished(false);
  }, [source, sourceId, texts, srsData]);

  // ── スキップ ──────────────────────────────────────────────
  const skip = useCallback(() => {
    if (index + 1 < cards.length) {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  }, [index, cards.length]);

  // ── 集計 ──────────────────────────────────────────────────
  const goodCount  = Object.values(sessionResult).filter(v => v === 'good').length;
  const againCount = Object.values(sessionResult).filter(v => v === 'again').length;
  const totalGoodEver = Object.values(srsData).filter(v => v.status === 'good').length;

  const currentCard = cards[index] || null;

  // ── ユーザー訳（localStorage から取得） ───────────────────
  const getUserTrans = useCallback((textId, paraId) => {
    try {
      const stored = localStorage.getItem(`translations-${textId}`);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed[paraId]?.text || null;
    } catch { return null; }
  }, []);

  return {
    // 設定
    source, setSource,
    sourceId, setSourceId,
    mode, setMode,
    backMode, setBackMode,
    // セッション状態
    cards, index, flipped, setFlipped,
    sessionResult, finished,
    currentCard,
    // SRS
    srsData, totalGoodEver,
    // 操作
    startSession, judge, shuffle, resetSession, resetSrs, restart, skip,
    // 集計
    goodCount, againCount,
    // ユーティリティ
    getUserTrans,
    bookmarks,
    // ...既存の戻り値
    userInput,
    setUserInput,
    judge,
  };
};
