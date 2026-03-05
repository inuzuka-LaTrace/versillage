import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark, BookmarkCheck,
  CalendarDays, Settings, Moon, Sun,
  Volume2, Square as IconSquare,
  Search, Link, FileText, List,
  ChevronRight, ChevronDown,
  X, Check, Tag,
} from 'lucide-react';
import racineData from './data/racine';
import mallarmeData from './data/mallarme';
import baudelaireData from './data/baudelaire';
import valeryData from './data/valery';
import valmoreData from './data/valmore';
import rimbaudData from './data/rimbaud';
import verlaineData from './data/verlaine';
import lecontelisleData from './data/lecontelisle';
import rodenbachData from './data/rodenbach';
import vanlerbergheData from './data/vanlerberghe';
import gautierData from './data/gautier';
import poeData from './data/poe';
import wildeData from './data/wilde';
import swinburneData from './data/swinburne';
import yeatsData from './data/yeats';
import georgeData from './data/george';
import hofmannsthalData from './data/hofmannsthal';
import traklData from './data/trakl';
import hoelderlinData from './data/hoelderlin';

// ユーティリティ：officialTranslation / provisionalTranslation 両対応
const getTranslation = (para) =>
  para.provisionalTranslation ?? para.officialTranslation ?? '';

// ユーティリティ：french / originalText 両フィールド対応
const getOriginalText = (para) =>
  para.french ?? para.originalText ?? '';

// 言語コード判定（JSONのoriginalLangフィールド優先、なければfr-FR）
const getSpeechLang = (textObj) =>
  textObj?.originalLang ?? 'fr-FR';

// 言語ごとの優先音声名リスト（品質の高いものを優先）
const PREFERRED_VOICES = {
  'fr': ['Thomas', 'Google français', 'Microsoft Julie', 'Amelie'],
  'de': ['Anna', 'Google Deutsch', 'Microsoft Hedda'],
  'en': ['Daniel', 'Google UK English Female', 'Samantha', 'Google US English'],
};

const getBestVoice = (lang) => {
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

// 読み上げ速度設定
const SPEECH_RATES = {
  fast:   { rate: 1.25, label: '高速' },
  normal: { rate: 0.9,  label: '通常' },
  slow:   { rate: 0.65, label: '低速' },
};

// ─── URLルーティング ユーティリティ ───────────────────────────
// ハッシュ形式: #/text/<textId>  または  #/text/<textId>/para/<paraId>
const getRouteFromHash = () => {
  const m = window.location.hash.match(/^#\/text\/([^\/]+)(?:\/para\/(.+))?$/);
  if (!m) return { textId: null, paraId: null };
  return { textId: m[1], paraId: m[2] ? Number(m[2]) : null };
};
const getTextIdFromHash = () => getRouteFromHash().textId;
const pushTextHash = (textId) => {
  const hash = `#/text/${textId}`;
  if (window.location.hash !== hash) {
    window.history.pushState({ textId }, '', hash);
  }
};
const pushParaHash = (textId, paraId) => {
  const hash = `#/text/${textId}/para/${paraId}`;
  window.history.pushState({ textId, paraId }, '', hash);
};

export default function App() {
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState(
    () => getTextIdFromHash() || 'mallarme_musique_lettres'
  );
  const [userTranslations, setUserTranslations] = useState({});
  const [editingParagraph, setEditingParagraph] = useState(null);
  const [showFrench, setShowFrench] = useState(true);
  const [showOfficial, setShowOfficial] = useState(true);
  const [showUser, setShowUser] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('garamond');

  // 新機能
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [collapsedParagraphs, setCollapsedParagraphs] = useState({});
  const [speakingId, setSpeakingId] = useState(null); // 'all' or paragraphId
  const [speechRate, setSpeechRate] = useState('normal');
  // 注釈機能
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [expandedAnnotations, setExpandedAnnotations] = useState({}); // paragraphId → bool
  const [activeAnchor, setActiveAnchor] = useState(null); // { paraId, anchor }
  // 横断読解ビュー
  const [crossMode, setCrossMode] = useState(false);
  const [crossTexts, setCrossTexts] = useState([]);
  // ブックマーク: { textId: [paraId, ...] }
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bookmarks') || '{}'); } catch { return {}; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  // タイムラインビュー
  const [showTimeline, setShowTimeline] = useState(false);
  // キーワードフィルター（クラウドクリック時にセット）
  const [activeKeyword, setActiveKeyword] = useState(null);
  const settingsRef = useRef(null);
  const bodyRef = useRef(null);      // 段落コントロールバーへのref
  const textInfoRef = useRef(null);  // テキスト情報パネルへのref
  const paragraphRefs = useRef({});  // paragraphId → DOM要素ref

  // ── 読み上げ関数 ──────────────────────────────────────────
  const speak = (text, lang, id) => {
    window.speechSynthesis.cancel();
    if (speakingId === id) { setSpeakingId(null); return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = SPEECH_RATES[speechRate]?.rate ?? 0.9;
    // 高品質音声を優先選択（voices非同期読み込み対策）
    const assignVoice = () => {
      const best = getBestVoice(lang);
      if (best) utter.voice = best;
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utter);
    };
    // voicesがまだ読み込まれていない場合は待機
    if (window.speechSynthesis.getVoices().length) {
      assignVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { assignVoice(); window.speechSynthesis.onvoiceschanged = null; };
    }
  };

  const speakParagraph = (para, textObj) => {
    const txt = getOriginalText(para);
    if (!txt) return;
    speak(txt, getSpeechLang(textObj), para.id);
  };

  const speakAll = (textObj) => {
    const fullText = (textObj.paragraphs || [])
      .map(p => getOriginalText(p))
      .filter(Boolean)
      .join('\n');
    speak(fullText, getSpeechLang(textObj), 'all');
  };

  // コンポーネントアンマウント時・テキスト切替時に読み上げ停止
  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [selectedText]);

  useEffect(() => {
    const allTexts = {
      ...baudelaireData,
      ...mallarmeData,
      ...valeryData,
      ...verlaineData,
      ...gautierData,
      ...valmoreData,
      ...lecontelisleData,
      ...rodenbachData,
      ...vanlerbergheData,
      ...racineData,
      ...rimbaudData,
      ...poeData,
      ...wildeData,
      ...swinburneData,
      ...yeatsData,
      ...georgeData,
　　　　...hofmannsthalData,
      ...traklData,
      ...hoelderlinData,
    };
    setTexts(allTexts);
    setLoading(false);
  }, []);

  // ブラウザ戻る/進む → URL変化を検知してテキストを切り替え（段落直リンク対応）
  useEffect(() => {
    const handlePopState = () => {
      const { textId, paraId } = getRouteFromHash();
      if (textId) {
        resetTextState(textId);
        if (paraId) {
          setTimeout(() => {
            setCollapsedParagraphs(prev => ({ ...prev, [paraId]: false }));
            setTimeout(() => {
              paragraphRefs.current[paraId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 60);
          }, 80);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 設定パネルの外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const currentText = texts[selectedText];

  const categories = {
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
    valmore:                    { name: 'ヴァルモール' },
    leconte_de_lisle:           { name: 'ルコント・ド・リール' },
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
  };

  // カテゴリーで絞り込み後、さらに検索クエリで絞り込む（本文テキストも対象）
  const filteredTexts = Object.values(texts)
    .filter(t => selectedCategory === 'all' || t.category === selectedCategory)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      // activeKeyword時はキーワード完全一致優先
      if (activeKeyword) return (t.keywords || []).some(k => k === activeKeyword);
      const inMeta =
        t.title?.toLowerCase().includes(q) ||
        t.author?.toLowerCase().includes(q) ||
        t.year?.toString().includes(q) ||
        (t.keywords || []).some(k => k.toLowerCase().includes(q));
      const inBody = (t.paragraphs || []).some(p =>
        getOriginalText(p).toLowerCase().includes(q) ||
        getTranslation(p).toLowerCase().includes(q)
      );
      return inMeta || inBody;
    });

  useEffect(() => {
    if (!loading && currentText) loadUserTranslations();
  }, [selectedText, loading, currentText]);

  const loadUserTranslations = () => {
    try {
      const stored = localStorage.getItem(`translations-${selectedText}`);
      setUserTranslations(stored ? JSON.parse(stored) : {});
    } catch {
      setUserTranslations({});
    }
  };

  const saveUserTranslation = (paragraphId, translation) => {
    const updated = {
      ...userTranslations,
      [paragraphId]: { text: translation, lastModified: new Date().toISOString() }
    };
    setUserTranslations(updated);
    try {
      localStorage.setItem(`translations-${selectedText}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save:', e);
    }
  };

  const handleSaveTranslation = (paragraphId) => {
    const textarea = document.getElementById(`user-translation-${paragraphId}`);
    if (textarea) {
      saveUserTranslation(paragraphId, textarea.value);
      setEditingParagraph(null);
    }
  };

  const clearAllTranslations = () => {
    if (window.confirm('このテキストのすべての訳文を削除してもよろしいですか？')) {
      setUserTranslations({});
      try { localStorage.removeItem(`translations-${selectedText}`); } catch {}
    }
  };

  // 状態リセットのみ（popstate経由など、URL操作を伴わない場合）
  const resetTextState = (textId) => {
    setSelectedText(textId);
    setEditingParagraph(null);
    setCollapsedParagraphs({});
    setExpandedAnnotations({});
    setActiveAnchor(null);
    setShowAnnotationIndex(false);
    setIntertextualExpanded({});
    setCrossMode(false);
    setCrossTexts([]);
    setShowBookmarks(false);
    setShowTimeline(false);
  };

  // ─── ブックマーク操作 ────────────────────────────────────
  const isBookmarked = (textId, paraId) =>
    (bookmarks[textId] || []).includes(paraId);

  const toggleBookmark = (e, textId, paraId) => {
    e.stopPropagation();
    setBookmarks(prev => {
      const list = prev[textId] || [];
      const next = list.includes(paraId)
        ? list.filter(id => id !== paraId)
        : [...list, paraId];
      const updated = next.length ? { ...prev, [textId]: next } : (() => { const o = {...prev}; delete o[textId]; return o; })();
      try { localStorage.setItem('bookmarks', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const jumpToBookmark = (textId, paraId) => {
    if (selectedText !== textId) {
      resetTextState(textId);
      pushParaHash(textId, paraId);
      setTimeout(() => {
        setCollapsedParagraphs(prev => ({ ...prev, [paraId]: false }));
        setTimeout(() => {
          paragraphRefs.current[paraId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }, 100);
    } else {
      pushParaHash(textId, paraId);
      setCollapsedParagraphs(prev => ({ ...prev, [paraId]: false }));
      setTimeout(() => {
        paragraphRefs.current[paraId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
    setShowBookmarks(false);
  };

  const copyParaLink = (e, textId, paraId) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/text/${textId}/para/${paraId}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    pushParaHash(textId, paraId);
  };

  // キーワードクリック → 検索フィルターとして適用
  const handleKeywordClick = (kw) => {
    if (activeKeyword === kw) {
      setActiveKeyword(null);
      setSearchQuery('');
    } else {
      setActiveKeyword(kw);
      setSearchQuery(kw);
      setSelectedCategory('all');
      setShowTimeline(false);
    }
  };

  // テキスト切り替え（状態リセット + URL更新）
  const handleTextChange = (textId) => {
    resetTextState(textId);
    pushTextHash(textId);
  };

  // vボタン：シングルクリックでテキスト情報パネルへスクロール
  const handleVButton = (e, textId) => {
    e.stopPropagation();
    if (selectedText !== textId) {
      handleTextChange(textId);
      setTimeout(() => {
        textInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      textInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleParagraph = (id) => {
    setCollapsedParagraphs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 全段落を折りたたむ / 展開する
  const collapseAll = () => {
    if (!currentText) return;
    const all = {};
    currentText.paragraphs.forEach(p => { all[p.id] = true; });
    setCollapsedParagraphs(all);
  };
  const expandAll = () => setCollapsedParagraphs({});

  // 注釈インデックス
  const [showAnnotationIndex, setShowAnnotationIndex] = useState(false);
  // intertextualインライン展開: key = `${paraId}-${annIdx}`
  const [intertextualExpanded, setIntertextualExpanded] = useState({});

  // インデックスから段落へジャンプ
  const jumpToAnnotation = (ann) => {
    const paraId = ann.paragraphId;
    // 対象段落を展開
    setCollapsedParagraphs(prev => ({ ...prev, [paraId]: false }));
    // 注釈パネルを展開
    setExpandedAnnotations(prev => ({ ...prev, [paraId]: true }));
    // anchor付きなら原文ハイライトもセット
    if (ann.anchor) setActiveAnchor({ paraId, anchor: ann.anchor });
    // 少し待ってからスクロール
    setTimeout(() => {
      paragraphRefs.current[paraId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // ─── 注釈ユーティリティ ────────────────────────────────────

  // typeごとの表示定義
  const ANNOTATION_TYPE_DEF = {
    glossary:     { label: '語釈',     colorLight: 'bg-amber-100 text-amber-800 border-amber-300',   colorDark: 'bg-amber-900/40 text-amber-300 border-amber-700',   dot: 'bg-amber-400' },
    allusion:     { label: '典拠',     colorLight: 'bg-rose-100 text-rose-800 border-rose-300',      colorDark: 'bg-rose-900/40 text-rose-300 border-rose-700',      dot: 'bg-rose-400' },
    commentary:   { label: '注釈',     colorLight: 'bg-sky-100 text-sky-800 border-sky-300',         colorDark: 'bg-sky-900/40 text-sky-300 border-sky-700',         dot: 'bg-sky-400' },
    intertextual: { label: '参照',     colorLight: 'bg-violet-100 text-violet-800 border-violet-300', colorDark: 'bg-violet-900/40 text-violet-300 border-violet-700', dot: 'bg-violet-400' },
    prosody:      { label: '韻律',     colorLight: 'bg-teal-100 text-teal-800 border-teal-300',      colorDark: 'bg-teal-900/40 text-teal-300 border-teal-700',      dot: 'bg-teal-400' },
  };

  const getTypeDef = (type) =>
    ANNOTATION_TYPE_DEF[type] ?? { label: type, colorLight: 'bg-gray-100 text-gray-700 border-gray-300', colorDark: 'bg-gray-800 text-gray-300 border-gray-600', dot: 'bg-gray-400' };

  // 段落の注釈一覧取得
  const getParaAnnotations = (paraId) =>
    (currentText?.annotations || []).filter(a => a.paragraphId === paraId);

  // anchor付き注釈：1行分のテキストをparts配列に分割するヘルパー
  const splitLineByAnchors = (lineText, anchored) => {
    let parts = [{ text: lineText, type: 'plain' }];
    for (const ann of anchored) {
      const next = [];
      for (const part of parts) {
        if (part.type !== 'plain') { next.push(part); continue; }
        const idx = part.text.indexOf(ann.anchor);
        if (idx === -1) { next.push(part); continue; }
        if (idx > 0) next.push({ text: part.text.slice(0, idx), type: 'plain' });
        next.push({ text: ann.anchor, type: 'anchor', ann });
        const after = part.text.slice(idx + ann.anchor.length);
        if (after) next.push({ text: after, type: 'plain' });
      }
      parts = next;
    }
    return parts;
  };

  // anchor付き注釈：行単位で分割してから各行をanchor処理し<br />で繋ぐ
  // → whitespace-pre-line と button の混在による詩形崩れを防ぐ
  const renderTextWithAnchors = (text, annotations, paraId) => {
    const anchored = annotations.filter(a => a.anchor);

    const isActive = (ann) =>
      activeAnchor?.paraId === paraId && activeAnchor?.anchor === ann.anchor;
    const typeDef = (ann) => getTypeDef(ann.type);

    const renderPart = (part, i) =>
      part.type === 'plain' ? (
        <span key={i}>{part.text}</span>
      ) : (
        <span
          key={i}
          role="button"
          tabIndex={0}
          onClick={() => setActiveAnchor(
            isActive(part.ann) ? null : { paraId, anchor: part.ann.anchor }
          )}
          onKeyDown={(e) => e.key === 'Enter' && setActiveAnchor(
            isActive(part.ann) ? null : { paraId, anchor: part.ann.anchor }
          )}
          className={`relative inline border-b-2 transition-colors cursor-pointer rounded-sm px-0.5 ${
            isActive(part.ann)
              ? darkMode
                ? `border-amber-400 ${typeDef(part.ann).colorDark} bg-opacity-60`
                : `border-amber-500 bg-amber-50`
              : darkMode
                ? 'border-zinc-600 hover:border-amber-500'
                : 'border-stone-400 hover:border-amber-500'
          }`}
          title={`${getTypeDef(part.ann.type).label}：クリックで表示`}
        >
          {part.text}
          <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${typeDef(part.ann).dot}`} />
        </span>
      );

    if (!anchored.length) {
      // anchorなし：行ごとに<br />で繋ぐだけ
      return (
        <>
          {text.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </>
      );
    }

    // anchorあり：行ごとに分割 → 各行をanchor処理 → <br />で繋ぐ
    const lines = text.split('\n');
    return (
      <>
        {lines.map((line, lineIdx) => {
          const parts = splitLineByAnchors(line, anchored);
          return (
            <span key={lineIdx}>
              {parts.map((part, i) => renderPart(part, i))}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          );
        })}
      </>
    );
  };

  // 注釈パネル1件のレンダリング
  const AnnotationItem = ({ ann, paraId, annIdx }) => {
    const def = getTypeDef(ann.type);
    const colorClass = darkMode ? def.colorDark : def.colorLight;
    const isHighlighted = ann.anchor && activeAnchor?.paraId === paraId && activeAnchor?.anchor === ann.anchor;
    const expandKey = `${paraId}-${annIdx}`;
    const isIntertextualOpen = intertextualExpanded[expandKey];

    // パネル側クリック → 原文側のanchorをハイライト（双方向フォーカス）
    const handleCardClick = () => {
      if (!ann.anchor) return;
      if (isHighlighted) {
        setActiveAnchor(null);
      } else {
        setActiveAnchor({ paraId, anchor: ann.anchor });
      }
    };

    // intertextual：対象テキスト・段落データを取得
    const targetText = ann.type === 'intertextual' && ann.targetId ? texts[ann.targetId] : null;
    const targetParas = targetText
      ? ann.targetParagraphId
        ? targetText.paragraphs.filter(p => p.id === ann.targetParagraphId)
        : targetText.paragraphs
      : [];

    return (
      <div
        onClick={ann.type !== 'intertextual' ? handleCardClick : undefined}
        className={`rounded-lg border p-3 text-xs transition-all ${colorClass} ${isHighlighted ? 'ring-2 ring-amber-400' : ''} ${ann.anchor && ann.type !== 'intertextual' ? 'cursor-pointer hover:opacity-90' : ''}`}
      >
        {/* ヘッダー行 */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-bold uppercase tracking-wider text-xs opacity-70">{def.label}</span>
          {ann.anchor && (
            <span className={`font-mono text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${darkMode ? 'bg-black/30' : 'bg-white/60'}`}>
              {isHighlighted
                ? <span className="text-amber-500">●</span>
                : <span className="opacity-40">○</span>
              }
              「{ann.anchor.length > 20 ? ann.anchor.slice(0, 20) + '…' : ann.anchor}」
            </span>
          )}
        </div>

        {/* 注釈本文 */}
        <p className="leading-relaxed">{ann.body}</p>

        {/* intertextual：展開ボタン＋インラインプレビュー */}
        {ann.type === 'intertextual' && targetText && (
          <div className="mt-2">
            {/* ボタン行：展開トグル＋テキスト遷移 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIntertextualExpanded(prev => ({ ...prev, [expandKey]: !prev[expandKey] }));
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isIntertextualOpen
                    ? darkMode ? 'bg-violet-800/60 text-violet-200' : 'bg-violet-200 text-violet-900'
                    : darkMode ? 'bg-black/20 text-violet-300 hover:bg-black/30' : 'bg-white/70 text-violet-800 hover:bg-violet-100'
                }`}
              >
{isIntertextualOpen ? <><ChevronDown size={11} className='inline mr-0.5' />折りたたむ</> : <><ChevronRight size={11} className='inline mr-0.5' />対照テキストを展開</>}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleTextChange(ann.targetId); }}
                className="flex items-center gap-1 font-medium underline underline-offset-2 hover:opacity-70 transition-opacity text-xs"
              >
                → {targetText.title}
                <span className="opacity-60">({targetText.author})</span>
              </button>
            </div>

            {/* インライン展開パネル */}
            {isIntertextualOpen && (
              <div className={`mt-2 rounded-lg border overflow-hidden ${darkMode ? 'border-violet-800/50 bg-zinc-950/60' : 'border-violet-200 bg-white/90'}`}>
                {/* パネルヘッダー */}
                <div className={`px-3 py-2 flex items-center justify-between border-b ${darkMode ? 'border-violet-800/40 bg-violet-950/40' : 'border-violet-100 bg-violet-50'}`}>
                  <div>
                    <span className={`font-serif text-xs font-semibold ${darkMode ? 'text-violet-200' : 'text-violet-900'}`}>
                      {targetText.title}
                    </span>
                    <span className={`ml-2 text-xs opacity-60 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
                      {targetText.author}
                    </span>
                  </div>
                  {ann.targetParagraphId && (
                    <span className={`text-xs font-mono opacity-50 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
                      § {ann.targetParagraphId}
                    </span>
                  )}
                </div>

                {/* 対象段落テキスト */}
                <div className="px-3 py-2 space-y-2">
                  {targetParas.map(p => (
                    <div key={p.id}>
                      {!ann.targetParagraphId && (
                        <span className={`text-xs font-mono opacity-40 mr-2 ${darkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                          {p.id}
                        </span>
                      )}
                      <span className={`font-serif leading-relaxed whitespace-pre-line text-xs ${darkMode ? 'text-zinc-200' : 'text-stone-800'}`}>
                        {getOriginalText(p)}
                      </span>
                      {getTranslation(p) && (
                        <p className={`mt-1 text-xs leading-relaxed whitespace-pre-line border-l-2 pl-2 ${darkMode ? 'border-green-700 text-green-300/70' : 'border-green-400 text-green-800/70'}`}>
                          {getTranslation(p)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── ブックマーク一覧パネル ──────────────────────────────────
  const BookmarkPanel = () => {
    const allBookmarks = Object.entries(bookmarks).flatMap(([tid, pids]) =>
      (texts[tid] ? pids.map(pid => ({ textId: tid, paraId: pid, text: texts[tid] })) : [])
    );
    if (allBookmarks.length === 0) return (
      <div className={`rounded-xl border p-5 mb-4 ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className={`text-xs font-semibold uppercase tracking-wider font-sans flex items-center gap-1.5 ${textSecondary}`}><Bookmark size={13} strokeWidth={1.6} />ブックマーク</h2>
          <button onClick={() => setShowBookmarks(false)} className={`text-xs ${textSecondary} hover:opacity-70`}>閉じる</button>
        </div>
        <p className={`text-sm font-sans ${textSecondary} py-3 flex items-center gap-1.5 flex-wrap`}>
          ブックマークはありません。段落ヘッダーの
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-xs font-mono"
            style={{verticalAlign:'middle'}}><Bookmark size={11} strokeWidth={1.6} /></span>
          ボタンで追加できます。
        </p>
      </div>
    );
    return (
      <div className={`rounded-xl border p-4 mb-4 ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xs font-semibold uppercase tracking-wider font-sans flex items-center gap-1.5 ${textSecondary}`}>
            <Bookmark size={13} strokeWidth={1.6} />ブックマーク <span className="font-normal opacity-70">({allBookmarks.length}件)</span>
          </h2>
          <button onClick={() => setShowBookmarks(false)} className={`text-xs ${textSecondary} hover:opacity-70 font-sans`}>閉じる</button>
        </div>
        <div className="space-y-1.5">
          {allBookmarks.map(({ textId, paraId, text }) => {
            const para = text.paragraphs.find(p => p.id === paraId);
            if (!para) return null;
            const preview = getOriginalText(para).split('\n')[0].slice(0, 60);
            return (
              <div key={`${textId}-${paraId}`}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  darkMode ? 'border-zinc-800 hover:bg-zinc-800/60' : 'border-stone-100 hover:bg-stone-50'
                }`}
                onClick={() => jumpToBookmark(textId, paraId)}
              >
                <span className={`text-xs font-mono shrink-0 opacity-40 ${textClass}`}>§{paraId}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-sans font-medium truncate ${textSecondary}`}>{text.author} — {text.title}</p>
                  <p className={`text-xs font-serif truncate ${textClass}`}>{preview}{preview.length >= 60 ? '…' : ''}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); copyParaLink(e, textId, paraId); }}
                  title="リンクをコピー"
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-sans transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-stone-400 hover:text-stone-600'}`}
><Link size={12} strokeWidth={1.6} /></button>
                <button
                  onClick={(e) => toggleBookmark(e, textId, paraId)}
                  title="ブックマーク解除"
                  className={`shrink-0 text-xs font-sans transition-colors ${darkMode ? 'text-amber-400 hover:text-zinc-400' : 'text-amber-600 hover:text-stone-400'}`}
><BookmarkCheck size={13} strokeWidth={2} /></button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── 時系列マップ（縦スクロール式） ──────────────────────────
  const TimelineView = () => {
    const allTexts = Object.values(texts);
    const withYear = allTexts
      .map(t => ({ ...t, yearNum: parseInt(t.year) }))
      .filter(t => !isNaN(t.yearNum) && t.yearNum >= 1800 && t.yearNum <= 1940);

    // 著者ごとにグループ化し年でソート
    const byAuthor = {};
    withYear.forEach(t => {
      if (!byAuthor[t.author]) byAuthor[t.author] = { author: t.author, category: t.category, texts: [] };
      byAuthor[t.author].texts.push(t);
    });
    const authorGroups = Object.values(byAuthor).sort((a, b) => {
      return Math.min(...a.texts.map(t => t.yearNum)) - Math.min(...b.texts.map(t => t.yearNum));
    });

    // テキストを年順にフラット化
    const allEntries = authorGroups.flatMap(g =>
      [...g.texts].sort((a, b) => a.yearNum - b.yearNum).map(t => ({ ...t, category: g.category }))
    );

    // 10年ごとの区切り年（表示範囲内）
    const decadeBreaks = new Set();
    allEntries.forEach(t => { decadeBreaks.add(Math.floor(t.yearNum / 10) * 10); });
    const sortedDecades = [...decadeBreaks].sort((a, b) => a - b);

    // decade → その decade に属するエントリ
    const byDecade = {};
    sortedDecades.forEach(d => { byDecade[d] = allEntries.filter(t => Math.floor(t.yearNum / 10) * 10 === d); });

    // 著者カラー → Tailwind クラスを返すヘルパー
    const dotColor = (cat) => {
      const c = authorColor(cat);
      if (c.includes('violet'))  return darkMode ? 'bg-violet-400'  : 'bg-violet-500';
      if (c.includes('amber'))   return darkMode ? 'bg-amber-400'   : 'bg-amber-500';
      if (c.includes('sky'))     return darkMode ? 'bg-sky-400'     : 'bg-sky-500';
      if (c.includes('rose'))    return darkMode ? 'bg-rose-400'    : 'bg-rose-500';
      if (c.includes('emerald')) return darkMode ? 'bg-emerald-400' : 'bg-emerald-500';
      if (c.includes('teal'))    return darkMode ? 'bg-teal-400'    : 'bg-teal-500';
      if (c.includes('indigo'))  return darkMode ? 'bg-indigo-400'  : 'bg-indigo-500';
      if (c.includes('cyan'))    return darkMode ? 'bg-cyan-400'    : 'bg-cyan-500';
      if (c.includes('pink'))    return darkMode ? 'bg-pink-400'    : 'bg-pink-500';
      if (c.includes('blue'))    return darkMode ? 'bg-blue-400'    : 'bg-blue-500';
      return darkMode ? 'bg-stone-500' : 'bg-stone-400';
    };

    return (
      <div className={`rounded-xl border mb-4 overflow-hidden ${cardBgClass}`}>
        {/* ヘッダー */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${borderClass}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wider font-sans flex items-center gap-1.5 ${textSecondary}`}>
            <CalendarDays size={13} strokeWidth={1.6} />
            時系列マップ
            <span className="font-normal opacity-60">({allEntries.length}作品)</span>
          </h2>
          <button
            onClick={() => setShowTimeline(false)}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-stone-200 text-stone-500'}`}
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>

        {/* 本体：縦スクロール */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {sortedDecades.map(decade => (
            <div key={decade}>
              {/* 10年区切りヘッダー */}
              <div className={`sticky top-0 z-10 flex items-center gap-3 px-4 py-1.5 ${
                darkMode ? 'bg-zinc-900/95 border-b border-zinc-800' : 'bg-stone-50/95 border-b border-stone-100'
              }`}>
                <span className={`text-xs font-mono font-bold tabular-nums ${darkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                  {decade}年代
                </span>
                <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-800' : 'bg-stone-200'}`} />
              </div>

              {/* その decade のテキスト一覧 */}
              <div className="px-3 py-1.5 space-y-1">
                {byDecade[decade].map(t => {
                  const isSelected = selectedText === t.id;
                  const dot = dotColor(t.category);
                  return (
                    <button
                      key={t.id}
                      onClick={() => { handleTextChange(t.id); setShowTimeline(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? darkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'
                          : darkMode ? 'hover:bg-zinc-800/60 border border-transparent' : 'hover:bg-stone-50 border border-transparent'
                      }`}
                    >
                      {/* 年 */}
                      <span className={`text-xs font-mono tabular-nums shrink-0 w-10 ${
                        isSelected
                          ? darkMode ? 'text-amber-300' : 'text-amber-700'
                          : textSecondary
                      }`}>
                        {t.year}
                      </span>

                      {/* カラードット */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot} ${isSelected ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70'}`} />

                      {/* 著者・タイトル */}
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-sans ${textSecondary} shrink-0`}>
                          {t.author.split(' ').pop()}
                        </span>
                        <span className={`mx-1.5 text-xs opacity-30 ${textClass}`}>·</span>
                        <span className={`text-xs font-serif ${textClass} ${isSelected ? 'font-semibold' : ''}`}>
                          {t.title}
                        </span>
                      </div>

                      {/* 選択中インジケーター */}
                      {isSelected && (
                        <ChevronRight size={13} strokeWidth={2} className={darkMode ? 'text-amber-400 shrink-0' : 'text-amber-600 shrink-0'} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`px-4 py-2 border-t text-xs font-sans ${borderClass} ${textSecondary} opacity-60`}>
          各行をクリックするとテキストを選択します
        </div>
      </div>
    );
  };

  // ─── 横断読解：1パネル分のレンダリング ───────────────────────
  const CrossPanel = ({ textObj, panelIndex }) => {
    const [collapsed, setCollapsed] = React.useState({});
    const [showOrig, setShowOrig] = React.useState(true);
    const [showTrans, setShowTrans] = React.useState(true);
    const accentColors = [
      { border: 'border-indigo-400', badge: darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-600 text-white', header: darkMode ? 'bg-indigo-950/40 border-indigo-800' : 'bg-indigo-50 border-indigo-200' },
      { border: 'border-emerald-400', badge: darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-600 text-white', header: darkMode ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200' },
      { border: 'border-rose-400', badge: darkMode ? 'bg-rose-900/50 text-rose-300' : 'bg-rose-600 text-white', header: darkMode ? 'bg-rose-950/40 border-rose-800' : 'bg-rose-50 border-rose-200' },
    ];
    const ac = accentColors[panelIndex % accentColors.length];

    return (
      <div className={`flex flex-col rounded-xl border-2 ${ac.border} overflow-hidden ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
        {/* パネルヘッダー */}
        <div className={`px-4 py-3 border-b ${ac.header} shrink-0`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={`font-serif text-sm font-semibold leading-snug ${textClass}`}>{textObj.title}</h3>
              <p className={`text-xs mt-0.5 ${textSecondary}`}>{textObj.author}　{textObj.year}</p>
            </div>
            {/* 表示トグル */}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setShowOrig(v => !v)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${showOrig ? (darkMode ? 'bg-indigo-800 text-indigo-200' : 'bg-indigo-100 text-indigo-700') : (darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-stone-100 text-stone-400')}`}
              >原</button>
              <button
                onClick={() => setShowTrans(v => !v)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${showTrans ? (darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-stone-100 text-stone-400')}`}
              >訳</button>
            </div>
          </div>
          {/* context（折りたたみ） */}
          {textObj.context && (
            <p className={`mt-2 text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-indigo-300/70' : 'text-indigo-700/70'}`}>
              {textObj.context}
            </p>
          )}
        </div>

        {/* 段落リスト */}
        <div className={`overflow-y-auto flex-1 space-y-1 p-2 ${fontSizeMap[fontSize]}`} style={{ maxHeight: '70vh' }}>
          {textObj.paragraphs.map((para, paraIdx) => {
            const isCol = collapsed[para.id];
            const trans = getTranslation(para);
            const orig = getOriginalText(para);
            const hasSpeaker = !!para.speaker;
            const prevPara   = textObj.paragraphs[paraIdx - 1];
            const isNewScene = para.scene != null && (!prevPara || prevPara.scene !== para.scene);
            // CrossPanel用speakerカラー（通常ビューと同系列）
            const crossSpeakerColors = [
              { light: 'bg-violet-100 text-violet-800', dark: 'bg-violet-900/40 text-violet-200' },
              { light: 'bg-sky-100 text-sky-800',       dark: 'bg-sky-900/40 text-sky-200' },
              { light: 'bg-rose-100 text-rose-800',     dark: 'bg-rose-900/40 text-rose-200' },
              { light: 'bg-teal-100 text-teal-800',     dark: 'bg-teal-900/40 text-teal-200' },
              { light: 'bg-amber-100 text-amber-800',   dark: 'bg-amber-900/40 text-amber-200' },
              { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900/40 text-indigo-200' },
            ];
            const allSpeakersCross = hasSpeaker
              ? [...new Set(textObj.paragraphs.map(p => p.speaker).filter(Boolean))]
              : [];
            const spIdxCross = hasSpeaker ? allSpeakersCross.indexOf(para.speaker) : -1;
            const spColorCross = crossSpeakerColors[spIdxCross % crossSpeakerColors.length];

            return (
              <React.Fragment key={para.id}>
                {/* Scène 区切り */}
                {isNewScene && (
                  <div className={`flex items-center gap-2 px-1 pt-1 pb-0.5`}>
                    <span className={`text-xs font-semibold tracking-wider px-2 py-0.5 rounded-full border ${
                      darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-600 font-sans' : 'bg-stone-100 text-stone-600 border-stone-300 font-sans'
                    }`}>Scène {para.scene}</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-700' : 'bg-stone-200'}`} />
                  </div>
                )}
                <div className={`rounded-lg border ${darkMode ? 'border-zinc-800' : 'border-stone-100'}`}>
                  {/* 段落ヘッダー */}
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [para.id]: !prev[para.id] }))}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${darkMode ? 'hover:bg-zinc-800/60' : 'hover:bg-stone-50'}`}
                  >
                    <span className={`text-xs font-mono w-5 shrink-0 ${textSecondary}`}>{para.id}</span>
                    {hasSpeaker && (
                      <span className={`text-xs font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 ${darkMode ? spColorCross.dark : spColorCross.light}`}>
                        {para.speaker.toUpperCase()}
                      </span>
                    )}
                    {isCol && orig && (
                      <span className={`text-xs truncate ${textClass}`}>{orig.split('\n')[0]}</span>
                    )}
                    <span className={`ml-auto ${textSecondary}`}>{isCol ? <ChevronRight size={12} strokeWidth={1.8} /> : <ChevronDown size={12} strokeWidth={1.8} />}</span>
                  </button>
                  {/* 段落コンテンツ */}
                  {!isCol && (
                    <div className={`px-3 pb-3 border-t ${borderClass}`}>
                      {showOrig && orig && (
                        <p className={`pt-2 leading-relaxed whitespace-pre-line ${textClass} text-sm`}>{orig}</p>
                      )}
                      {showTrans && trans && (
                        <p className={`mt-2 leading-relaxed whitespace-pre-line text-xs border-l-2 border-green-400 pl-2 ${darkMode ? 'text-green-300/80' : 'text-green-800/80'}`}>{trans}</p>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-serif text-stone-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!currentText) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-serif text-stone-700">テキストが見つかりません</p>
        </div>
      </div>
    );
  }

  // ─── テーマ変数 ───────────────────────────────────────────
  const bgClass         = darkMode ? 'bg-zinc-950'                         : 'bg-stone-50';
  const cardBgClass     = darkMode ? 'bg-zinc-900 border-zinc-800'         : 'bg-white border-stone-200';
  const textClass       = darkMode ? 'text-zinc-100'                        : 'text-stone-900';
  const textSecondary   = darkMode ? 'text-zinc-400'                        : 'text-stone-500';
  const borderClass     = darkMode ? 'border-zinc-800'                      : 'border-stone-200';
  const inputBg         = darkMode ? 'bg-zinc-800 text-zinc-100 placeholder-zinc-500 border-zinc-700' : 'bg-stone-100 text-stone-900 placeholder-stone-400 border-stone-300';
  const settingsBg      = darkMode ? 'bg-zinc-900 border-zinc-700 shadow-2xl' : 'bg-white border-stone-200 shadow-2xl';

  const fontFamilyStyle =
    fontFamily === 'garamond' ? '"EB Garamond", "Shippori Mincho B1", serif' :
    fontFamily === 'im-fell'  ? '"IM Fell English", "Shippori Mincho B1", serif' :
    fontFamily === 'alice'    ? '"Alice", "Shippori Mincho B1", serif' :
    '"EB Garamond", "Shippori Mincho B1", serif';

  const fontSizeMap = { small: 'text-sm', medium: 'text-base', large: 'text-lg', xlarge: 'text-xl' };

    // カテゴリーラベルの短縮表示用マップ
  const catShort = {
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
    valmore:                 'ヴァルモール',
    leconte_de_lisle:        'ルコント・ド・リール',
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
  };

  const authorColor = (cat) => {
    if (cat?.startsWith('racine'))       return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('baudelaire'))   return darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-800';
    if (cat?.startsWith('mallarme'))     return darkMode ? 'bg-sky-900/40 text-sky-300'       : 'bg-sky-100 text-sky-800';
    if (cat?.startsWith('valery'))       return darkMode ? 'bg-rose-900/40 text-rose-300'     : 'bg-rose-100 text-rose-800';
    if (cat?.startsWith('valmore'))      return darkMode ? 'bg-pink-900/40 text-pink-300'     : 'bg-pink-100 text-pink-800';
    if (cat?.startsWith('leconte_de_lisle')) return darkMode ? 'bg-stone-900/40 text-stone-300': 'bg-stone-100 text-stone-800';
    if (cat?.startsWith('rodenbach'))    return darkMode ? 'bg-sky-1000/40 text-sky-400'       : 'bg-sky-200 text-sky-900';
    if (cat?.startsWith('vanlerberghe')) return darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-800';
    if (cat?.startsWith('rimbaud'))      return darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-800';
    if (cat?.startsWith('verlaine'))     return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('gautier'))      return darkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-100 text-cyan-800';
    if (cat?.startsWith('poe'))        return darkMode ? 'bg-red-1000/40 text-red-400' : 'bg-red-200 text-red-900';
    if (cat?.startsWith('wilde'))        return darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-800';
    if (cat?.startsWith('swinburne'))    return darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800';
    if (cat?.startsWith('yeats'))        return darkMode ? 'bg-slate-900/40 text-slate-300' : 'bg-slate-100 text-slate-800';
    if (cat?.startsWith('george'))       return darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-800';
    if (cat?.startsWith('hofmannsthal')) return darkMode ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-200 text-yellow-900';
    if (cat?.startsWith('trakl'))        return darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-200 text-blue-900';
    if (cat?.startsWith('hoelderlin'))   return darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800';
    return darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-stone-100 text-stone-700';
  };

  return (
    <div className={`min-h-screen ${bgClass} relative`} style={{ fontFamily: fontFamilyStyle }}>

      {/* ─── サイドドロワー オーバーレイ ─────────────────── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* ─── サイドドロワー 本体 ──────────────────────────── */}
      <div
        ref={settingsRef}
        className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col overflow-y-auto shadow-2xl
          transition-transform duration-300 ease-in-out
          ${showSettings ? 'translate-x-0' : 'translate-x-full'}
          ${darkMode ? 'bg-zinc-900 border-l border-zinc-700' : 'bg-stone-50 border-l border-stone-200'}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-zinc-800' : 'border-stone-200'}`}>
          <h3 className={`text-sm font-semibold tracking-wide font-sans ${textClass}`}>表示設定</h3>
          <button
            onClick={() => setShowSettings(false)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-stone-200 text-stone-500'}`}
          ><X size={13} strokeWidth={2} /></button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* フォントサイズ */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-sans ${textSecondary} block mb-2.5`}>文字サイズ</label>
            <div className="flex gap-1.5">
              {[['small','小'],['medium','中'],['large','大'],['xlarge','特大']].map(([val, label]) => (
                <button key={val} onClick={() => setFontSize(val)}
                  className={`flex-1 py-2 text-xs rounded-lg font-sans transition-all
                    ${fontSize === val
                      ? darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-stone-800 text-white shadow-sm'
                      : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* フォント */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-sans ${textSecondary} block mb-2.5`}>フォント</label>
            <div className="flex flex-col gap-1.5">
              {[
                ['garamond', 'Garamond', 'EB Garamond'],
                ['alice',    'Alice',     'Alice'],
                ['im-fell',  'IM Fell',   'IM Fell English'],
              ].map(([val, label, preview]) => (
                <button key={val} onClick={() => setFontFamily(val)}
                  className={`py-2.5 px-3.5 text-xs rounded-lg text-left transition-all flex items-center justify-between font-sans
                    ${fontFamily === val
                      ? darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-stone-800 text-white shadow-sm'
                      : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  <span>{label}</span>
                  <span className="opacity-60" style={{ fontFamily: `"${preview}", serif`, fontSize: '1.05em' }}>Abcあ</span>
                </button>
              ))}
            </div>
          </div>

          {/* 読み上げ速度 */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-sans ${textSecondary} block mb-2.5`}>読み上げ速度</label>
            <div className="flex flex-col gap-1.5">
              {Object.entries(SPEECH_RATES).map(([key, { label }]) => (
                <button key={key} onClick={() => setSpeechRate(key)}
                  className={`py-2.5 px-3.5 text-xs rounded-lg text-left flex items-center justify-between font-sans transition-all
                    ${speechRate === key
                      ? darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-stone-800 text-white shadow-sm'
                      : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  <span>{key === 'fast' ? '🎧 ' : key === 'slow' ? '🗣 ' : '▶ '}{label}</span>
                  <span className="opacity-50">{key === 'fast' ? '1.25×' : key === 'slow' ? '0.65×' : '0.9×'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 表示する内容（トグルスイッチ） */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-sans ${textSecondary} block mb-2.5`}>表示する内容</label>
            <div className={`rounded-xl overflow-hidden border ${darkMode ? 'border-zinc-700' : 'border-stone-200'}`}>
              {[
                [showFrench, setShowFrench, '原文'],
                [showOfficial, setShowOfficial, '仮訳'],
                [showUser, setShowUser, '自分の訳'],
                [showAnnotations, setShowAnnotations, '注釈'],
              ].map(([checked, setter, label], i, arr) => (
                <div
                  key={label}
                  onClick={() => setter(!checked)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors font-sans
                    ${i < arr.length - 1 ? (darkMode ? 'border-b border-zinc-700' : 'border-b border-stone-100') : ''}
                    ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-stone-100'}`}
                >
                  <span className={`text-sm ${textClass}`}>{label}</span>
                  <div className={`relative w-10 h-5 rounded-full transition-colors
                    ${checked ? (darkMode ? 'bg-amber-600' : 'bg-stone-700') : (darkMode ? 'bg-zinc-700' : 'bg-stone-300')}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                      ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Header ─────────────────────────────────── */}
      <header className={`sticky top-0 z-30 ${darkMode ? 'bg-zinc-950/95 border-zinc-800' : 'bg-stone-50/95 border-stone-200'} border-b backdrop-blur-md`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className={`text-base font-serif font-semibold ${textClass} truncate leading-tight`}>
              近代西洋テクスト対訳
            </h1>
            {currentText && (
              <p className={`text-xs font-sans truncate mt-0.5 ${textSecondary}`}>
                <span className="opacity-60">{currentText.author}</span>
                <span className="opacity-40 mx-1">›</span>
                <span>{currentText.title}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => { setShowBookmarks(v => !v); setShowTimeline(false); }}
            title="ブックマーク一覧"
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              showBookmarks
                ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-800 text-white'
                : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            <Bookmark size={15} strokeWidth={1.6} />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'}`}
            title="ダーク/ライト切替"
          >
            {darkMode ? <Sun size={15} strokeWidth={1.6} /> : <Moon size={15} strokeWidth={1.6} />}
          </button>
          <button
            onClick={() => setShowSettings(v => !v)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              showSettings
                ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-800 text-white'
                : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'}`}
            title="表示設定"
          >
            <Settings size={15} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ─── ウェルカムバナー ───────────────────────── */}
        {showWelcome && (
          <div className={`rounded-xl border p-4 mb-6 relative ${darkMode ? 'bg-amber-950/30 border-amber-900/50' : 'bg-amber-50 border-amber-200'}`}>
            <button
              onClick={() => setShowWelcome(false)}
              className={`absolute top-3 right-3 ${textSecondary} hover:opacity-70`}
            ><X size={14} strokeWidth={2} /></button>
            <p className={`text-sm font-sans ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
              📚 19〜20世紀の近代西洋テクスト対訳集。フランス語・英語・ドイツ語の詩・批評原文と日本語仮訳を並べて比較し、自分の訳文も記録できます。
            </p>
            <p className={`text-xs mt-1 font-sans ${darkMode ? 'text-amber-500' : 'text-amber-700'}`}>
              ※ 掲載の日本語訳は学習補助のための試訳であり、確定した翻訳ではありません。
            </p>
          </div>
        )}

        {/* ─── ブックマークパネル ─────────────────── */}
        {showBookmarks && <BookmarkPanel />}

        {/* ─── カテゴリーフィルター ─────────────────── */}
        <div className={`rounded-xl border p-4 mb-4 ${cardBgClass}`}>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(categories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => { setSelectedCategory(key); setSearchQuery(''); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === key
                    ? 'bg-stone-800 text-white shadow-sm font-sans'
                    : darkMode
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-sans'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 font-sans'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 検索バー + 時系列トグル ──────────────── */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${textSecondary}`}><Search size={14} strokeWidth={1.6} /></span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory('all'); if (!e.target.value) setActiveKeyword(null); }}
                placeholder="タイトル・著者・年・本文テキストで検索..."
                className={`w-full rounded-xl border pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all font-sans ${inputBg}`}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveKeyword(null); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSecondary} hover:opacity-70`}
                ><X size={13} strokeWidth={2} /></button>
              )}
            </div>
            {/* 時系列マップ トグルボタン */}
            <button
              onClick={() => { setShowTimeline(v => !v); setShowBookmarks(false); }}
              title="時系列マップ"
              className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
                showTimeline
                  ? darkMode ? 'bg-amber-700 text-amber-100 border-amber-600' : 'bg-stone-800 text-white border-stone-700'
                  : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700' : 'bg-white hover:bg-stone-50 text-stone-500 border-stone-300'
              }`}
            >
              <CalendarDays size={16} strokeWidth={1.6} />
            </button>
          </div>
          {activeKeyword && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`text-xs font-sans ${textSecondary}`}>キーワードフィルター中：</span>
              <button
                onClick={() => { setActiveKeyword(null); setSearchQuery(''); }}
                className={`text-xs font-sans px-2 py-0.5 rounded border flex items-center gap-1 ${darkMode ? 'bg-amber-700 text-amber-100 border-amber-600' : 'bg-stone-800 text-white border-stone-700'}`}
              >
                <X size={11} strokeWidth={2} />{activeKeyword}
              </button>
            </div>
          )}
        </div>

        {/* ─── 時系列マップ ──────────────────────── */}
        {showTimeline && <TimelineView />}
        <div className={`rounded-xl border p-4 mb-6 ${cardBgClass}`}>
          <h2 className={`text-xs font-semibold uppercase tracking-wider font-sans ${textSecondary} mb-3`}>
            テキスト一覧
            <span className={`ml-2 font-normal`}>({filteredTexts.length}件)</span>
          </h2>

          {filteredTexts.length === 0 ? (
            <p className={`text-sm font-sans ${textSecondary} py-4 text-center`}>
              「{searchQuery}」に一致するテキストが見つかりませんでした
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredTexts.map((text) => (
                <div
                  key={text.id}
                  className={`relative rounded-lg border text-left transition-all overflow-hidden group ${
                    selectedText === text.id
                      ? darkMode
                        ? 'border-stone-500 bg-stone-900/40 shadow-md'
                        : 'border-stone-400 bg-stone-50 shadow-md'
                      : darkMode
                        ? 'border-zinc-800 hover:border-zinc-600 hover:shadow-md hover:bg-zinc-800/60'
                        : 'border-stone-200 hover:border-stone-400 hover:shadow-md hover:bg-white'
                  }`}
                >
                  {/* 著者カラーの左ボーダーアクセント */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all ${
                    selectedText === text.id ? 'opacity-100' : 'opacity-30 group-hover:opacity-80'
                  } ${authorColor(text.category).includes('violet') ? 'bg-violet-400' :
                      authorColor(text.category).includes('amber') ? 'bg-amber-400' :
                      authorColor(text.category).includes('sky') ? 'bg-sky-400' :
                      authorColor(text.category).includes('rose') ? 'bg-rose-400' :
                      authorColor(text.category).includes('emerald') ? 'bg-emerald-400' :
                      authorColor(text.category).includes('teal') ? 'bg-teal-400' :
                      authorColor(text.category).includes('indigo') ? 'bg-indigo-400' :
                      authorColor(text.category).includes('cyan') ? 'bg-cyan-400' :
                      authorColor(text.category).includes('pink') ? 'bg-pink-400' :
                      authorColor(text.category).includes('blue') ? 'bg-blue-400' :
                      'bg-stone-400'}`}
                  />
                  {/* カード本体（テキスト選択） */}
                  <button
                    onClick={() => handleTextChange(text.id)}
                    className="w-full pl-4 pr-9 py-3 text-left"
                  >
                    {/* 著者名（サンセリフ小文字）+ 年 */}
                    <div className={`flex items-center gap-1.5 mb-1`}>
                      <span className={`text-xs font-sans font-medium ${textSecondary}`}>{text.author}</span>
                      <span className={`text-xs font-sans ${textSecondary} opacity-50`}>·</span>
                      <span className={`text-xs font-sans ${textSecondary} opacity-50`}>{text.year}</span>
                    </div>
                    <h3 className={`font-serif text-sm font-medium ${textClass} leading-snug line-clamp-2 mb-1.5`}>
                      {text.title}
                    </h3>
                    <div className={`flex items-center gap-1.5 flex-wrap`}>
                      <span className={`text-xs font-sans px-1.5 py-0.5 rounded ${authorColor(text.category)}`}>
                        {catShort[text.category] || text.category}
                      </span>
                      {text.annotations?.length > 0 && (
                        <span className={`text-xs font-sans px-1.5 py-0.5 rounded ${darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                          注釈{text.annotations.length}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* ↓ボタン：クリックでテキスト情報へスクロール */}
                  <button
                    onClick={(e) => handleVButton(e, text.id)}
                    title="テキスト情報へ移動"
                    className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-xs transition-all select-none font-sans ${
                      selectedText === text.id
                        ? darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-stone-500 hover:text-stone-700'
                        : darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-stone-300 hover:text-stone-500'
                    }`}
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── 現在のテキスト情報 ───────────────────── */}
        <div ref={textInfoRef} className={`rounded-xl border p-5 mb-4 ${cardBgClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 font-medium ${authorColor(currentText.category)}`}>
                {catShort[currentText.category] || currentText.category}
              </span>
              <h2 className={`text-xl font-serif ${textClass} mb-1`}>{currentText.title}</h2>
              <p className={`text-sm font-sans ${textSecondary}`}>{currentText.author}　{currentText.source}（{currentText.year}年）</p>
            </div>
            <div className={`text-right text-xs ${textSecondary} shrink-0`}>
              <span className="font-semibold">{currentText.paragraphs.length}</span>段落
            </div>
          </div>
          {currentText.context && (
            <div className={`mt-3 p-3 rounded-lg text-sm whitespace-pre-line ${darkMode ? 'bg-zinc-800/60 text-zinc-300 border border-zinc-700' : 'bg-stone-100 text-stone-700 border border-stone-200'}`}>
              {currentText.context}
            </div>
          )}
          {currentText.keywords && currentText.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {currentText.keywords.map(k => {
                const isActive = activeKeyword === k;
                return (
                  <button
                    key={k}
                    onClick={() => handleKeywordClick(k)}
                    title={isActive ? `「${k}」フィルターを解除` : `「${k}」で絞り込む`}
                    className={`text-xs font-sans px-2 py-0.5 rounded border transition-all ${
                      isActive
                        ? darkMode ? 'bg-amber-700 text-amber-100 border-amber-600' : 'bg-stone-800 text-white border-stone-700'
                        : darkMode ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200' : 'bg-stone-100 text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
{isActive && <X size={10} strokeWidth={2.5} className='inline mr-0.5' />}{k}
                  </button>
                );
              })}
            </div>
          )}

          {/* 横断読解ボタン＋テキスト選択 */}
          {(currentText.relatedTexts?.length > 0 || crossMode) && (
            <div className={`mt-4 pt-4 border-t ${borderClass}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${textSecondary}`}>横断読解</span>
                <button
                  onClick={() => { setCrossMode(v => !v); if (crossMode) setCrossTexts([]); }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    crossMode
                      ? darkMode ? 'bg-violet-800 text-violet-100 font-sans' : 'bg-violet-700 text-white font-sans'
                      : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-sans' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 font-sans'
                  }`}
                >
                  {crossMode ? '✕ 横断ビューを閉じる' : '⇄ 横断読解ビューを開く'}
                </button>
              </div>

              {/* 比較テキスト選択チップ */}
              {crossMode && (
                <div>
                  <p className={`text-xs mb-2 ${textSecondary}`}>
                    比較するテキストを選択（最大2件）
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(currentText.relatedTexts || []).filter(id => texts[id]).map(id => {
                      const t = texts[id];
                      const isSelected = crossTexts.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => {
                            if (isSelected) {
                              setCrossTexts(prev => prev.filter(x => x !== id));
                            } else if (crossTexts.length < 2) {
                              setCrossTexts(prev => [...prev, id]);
                            }
                          }}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                            isSelected
                              ? darkMode ? 'bg-violet-700 border-violet-500 text-white' : 'bg-violet-100 border-violet-400 text-violet-900'
                              : crossTexts.length >= 2
                                ? darkMode ? 'border-zinc-700 text-zinc-600 cursor-not-allowed font-sans' : 'border-stone-200 text-stone-300 cursor-not-allowed font-sans'
                                : darkMode ? 'border-zinc-700 text-zinc-400 hover:border-violet-600 hover:text-violet-300 font-sans' : 'border-stone-300 text-stone-600 hover:border-violet-400 hover:text-violet-700 font-sans'
                          }`}
                          disabled={!isSelected && crossTexts.length >= 2}
                        >
                          {isSelected && <span className="mr-1">✓</span>}
                          {t.title}
                          <span className={`ml-1 opacity-60`}>({t.author.split(' ').pop()})</span>
                        </button>
                      );
                    })}
                  </div>
                  {crossTexts.length > 0 && (
                    <p className={`mt-2 text-xs ${textSecondary}`}>
                      {crossTexts.length}件選択中 — 下のビューで並べて読めます
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── 注釈インデックス ─────────────────────── */}
        {showAnnotations && (currentText.annotations?.length > 0) && (
          <div className={`rounded-xl border mb-4 overflow-hidden ${cardBgClass}`}>
            <button
              onClick={() => setShowAnnotationIndex(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                darkMode ? 'hover:bg-zinc-800/60' : 'hover:bg-stone-50'
              } ${textClass}`}
            >
              <span className="flex items-center gap-2">
                <List size={14} strokeWidth={1.6} className="shrink-0" />
                <span>注釈インデックス</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                  {currentText.annotations.length}件
                </span>
                {/* typeバッジ集計 */}
                <span className="flex gap-1 ml-1">
                  {[...new Set(currentText.annotations.map(a => a.type))].map(t => (
                    <span key={t} className={`px-1.5 py-0.5 rounded text-xs border hidden sm:inline ${darkMode ? getTypeDef(t).colorDark : getTypeDef(t).colorLight}`}>
                      {getTypeDef(t).label}
                    </span>
                  ))}
                </span>
              </span>
              <span className={`${textSecondary}`}>{showAnnotationIndex ? <ChevronDown size={13} strokeWidth={1.8} /> : <ChevronRight size={13} strokeWidth={1.8} />}</span>
            </button>

            {showAnnotationIndex && (
              <div className={`border-t ${borderClass}`}>
                {/* 段落ごとにグループ化して表示 */}
                {currentText.paragraphs
                  .filter(p => (currentText.annotations || []).some(a => a.paragraphId === p.id))
                  .map(p => {
                    const anns = (currentText.annotations || []).filter(a => a.paragraphId === p.id);
                    return (
                      <div key={p.id} className={`border-b last:border-b-0 ${borderClass}`}>
                        {/* 段落番号ヘッダー */}
                        <div className={`px-4 py-1.5 text-xs font-mono font-semibold ${darkMode ? 'bg-zinc-800/60 text-zinc-400 font-sans' : 'bg-stone-50 text-stone-500 font-sans'}`}>
                          § {p.id}
                          <span className={`ml-2 font-sans font-normal opacity-60 truncate`}>
                            {getOriginalText(p).split('\n')[0].slice(0, 40)}{getOriginalText(p).length > 40 ? '…' : ''}
                          </span>
                        </div>
                        {/* 注釈リスト */}
                        <div className="px-4 py-2 space-y-1.5">
                          {anns.map((ann, i) => {
                            const def = getTypeDef(ann.type);
                            const isActive = ann.anchor && activeAnchor?.paraId === ann.paragraphId && activeAnchor?.anchor === ann.anchor;
                            return (
                              <button
                                key={i}
                                onClick={() => jumpToAnnotation(ann)}
                                className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                  isActive
                                    ? darkMode ? 'bg-amber-900/40' : 'bg-amber-50'
                                    : darkMode ? 'hover:bg-zinc-800' : 'hover:bg-stone-50'
                                }`}
                              >
                                <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded border text-xs ${darkMode ? def.colorDark : def.colorLight}`}>
                                  {def.label}
                                </span>
                                <span className={`${textClass} leading-relaxed`}>
                                  {ann.anchor
                                    ? <><span className="font-mono opacity-70">「{ann.anchor.length > 15 ? ann.anchor.slice(0, 15) + '…' : ann.anchor}」</span> — {ann.body.slice(0, 60)}{ann.body.length > 60 ? '…' : ''}</>
                                    : ann.body.slice(0, 70) + (ann.body.length > 70 ? '…' : '')
                                  }
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ─── 横断読解ビュー ──────────────────────── */}
        {crossMode && crossTexts.length > 0 && (
          <div ref={bodyRef} className="mb-6">
            <div className={`grid gap-4 pb-4`} style={{ gridTemplateColumns: `repeat(${crossTexts.length + 1}, minmax(0, 1fr))` }}>
              {/* メインテキストパネル（常に左端） */}
              <CrossPanel textObj={currentText} panelIndex={0} />
              {/* 選択された比較テキストパネル */}
              {crossTexts.map((id, i) => texts[id] && (
                <CrossPanel key={id} textObj={texts[id]} panelIndex={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* ─── 段落コントロールバー（通常ビューのみ） ─ */}
        {!crossMode && <div ref={bodyRef} className={`rounded-xl border p-3 mb-4 flex flex-wrap items-center justify-between gap-3 ${cardBgClass}`}>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-sans ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              すべて展開
            </button>
            <button
              onClick={collapseAll}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-sans ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              すべて折りたたむ
            </button>
            <button
              onClick={() => speakAll(currentText)}
              title={speakingId === 'all' ? '読み上げ停止' : '全文を読み上げる'}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                speakingId === 'all'
                  ? (darkMode ? 'bg-amber-700 text-amber-100 font-sans' : 'bg-stone-700 text-white font-sans')
                  : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-sans' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 font-sans'
              }`}
            >
              {speakingId === 'all' ? <><IconSquare size={10} strokeWidth={2} fill='currentColor' className='inline mr-1' />停止</> : <><Volume2 size={13} strokeWidth={1.6} className='inline mr-1' />全文</>}
            </button>
          </div>
          <button
            onClick={clearAllTranslations}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${darkMode ? 'bg-rose-900/30 text-rose-400 border border-rose-800 hover:bg-rose-900/50 font-sans' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-sans'}`}
          >
            訳文をすべて削除
          </button>
        </div>}

        {/* ─── 段落リスト（通常ビューのみ） ────────── */}
        {!crossMode && <div className={`space-y-2 pb-10 ${fontSizeMap[fontSize]}`}>
          {currentText.paragraphs.map((para, paraIdx) => {
            const isCollapsed = collapsedParagraphs[para.id];
            const isBookmarkedPara = isBookmarked(selectedText, para.id);
            const hasUserTrans = !!userTranslations[para.id];
            const translation = getTranslation(para);
            const paraAnnotations = getParaAnnotations(para.id);
            const hasAnnotations = paraAnnotations.length > 0;
            const isAnnotationOpen = expandedAnnotations[para.id];

            // ── 戯曲用：scene / speaker ──────────────────────
            const hasSpeaker = !!para.speaker;
            const hasScene   = para.scene != null;
            // 前の段落と scene が変わった時だけ区切りを表示
            const prevPara   = currentText.paragraphs[paraIdx - 1];
            const isNewScene = hasScene && (!prevPara || prevPara.scene !== para.scene);

            // speaker ごとの色（6色ローテーション）
            const speakerColors = [
              { light: 'bg-violet-100 text-violet-800 border-violet-300',  dark: 'bg-violet-900/40 text-violet-200 border-violet-700' },
              { light: 'bg-sky-100 text-sky-800 border-sky-300',           dark: 'bg-sky-900/40 text-sky-200 border-sky-700' },
              { light: 'bg-rose-100 text-rose-800 border-rose-300',        dark: 'bg-rose-900/40 text-rose-200 border-rose-700' },
              { light: 'bg-teal-100 text-teal-800 border-teal-300',        dark: 'bg-teal-900/40 text-teal-200 border-teal-700' },
              { light: 'bg-amber-100 text-amber-800 border-amber-300',     dark: 'bg-amber-900/40 text-amber-200 border-amber-700' },
              { light: 'bg-indigo-100 text-indigo-800 border-indigo-300',  dark: 'bg-indigo-900/40 text-indigo-200 border-indigo-700' },
            ];
            // テキスト内の全発話者リストから一貫した色を割り当て
            const allSpeakers = hasSpeaker
              ? [...new Set(currentText.paragraphs.map(p => p.speaker).filter(Boolean))]
              : [];
            const speakerIndex = hasSpeaker ? allSpeakers.indexOf(para.speaker) : -1;
            const speakerColor = speakerColors[speakerIndex % speakerColors.length];

            return (
              <React.Fragment key={para.id}>
                {/* ── Scène 区切り行（scene が変わった時のみ） ── */}
                {isNewScene && (
                  <div className={`flex items-center gap-3 px-1 pt-2 pb-1`}>
                    <span className={`text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border ${
                      darkMode
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-600 font-sans'
                        : 'bg-stone-100 text-stone-600 border-stone-300 font-sans'
                    }`}>
                      Scène {para.scene}
                    </span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-700' : 'bg-stone-200'}`} />
                  </div>
                )}

              <div
                ref={el => { paragraphRefs.current[para.id] = el; }}
                className={`rounded-xl overflow-hidden transition-all relative ${
                  !isCollapsed ? (darkMode ? 'shadow-md shadow-black/30' : 'shadow-sm') : ''
                } ${
                  isBookmarkedPara
                    ? darkMode ? 'border border-amber-700/60 bg-zinc-900' : 'border border-amber-300 bg-white'
                    : darkMode ? 'border border-zinc-800 bg-zinc-900' : 'border border-stone-200 bg-white'
                }`}
              >
                {/* ブックマーク左ボーダーアクセント */}
                {isBookmarkedPara && (
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${darkMode ? 'bg-amber-500' : 'bg-amber-400'}`} />
                )}
                {/* 段落ヘッダー（折りたたみボタン） */}
                <button
                  onClick={() => toggleParagraph(para.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    isBookmarkedPara
                      ? darkMode ? 'hover:bg-amber-950/30 bg-amber-950/10' : 'hover:bg-amber-50/80 bg-amber-50/40'
                      : darkMode ? 'hover:bg-zinc-800/60' : 'hover:bg-stone-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-sm font-sans w-7 shrink-0 tabular-nums select-none opacity-30 ${textClass}`}>{para.id}</span>

                    {/* speaker バッジ（戯曲のみ） */}
                    {hasSpeaker && (
                      <span className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                        darkMode ? speakerColor.dark : speakerColor.light
                      }`}>
                        {para.speaker.toUpperCase()}
                      </span>
                    )}

                    {/* 折りたたみ時：発話の冒頭プレビュー */}
                    {isCollapsed && showFrench && (
                      <span className={`text-sm truncate ${textClass}`}>
                        {getOriginalText(para).split('\n')[0]}
                      </span>
                    )}
                    {/* 展開時：表示モードラベル（speakerがない通常テキスト） */}
                    {!isCollapsed && !hasSpeaker && (
                      <span className={`text-xs ${textSecondary}`}>
                        {showFrench && showOfficial ? '原文 + 仮訳' : showFrench ? '原文' : showOfficial ? '仮訳' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasUserTrans && (
                      <span className="w-2 h-2 rounded-full bg-purple-500" title="自分の訳あり" />
                    )}
                    {hasAnnotations && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="注釈あり" />
                    )}
                    {/* ブックマークボタン */}
                    <button
                      onClick={(e) => toggleBookmark(e, selectedText, para.id)}
                      title={isBookmarked(selectedText, para.id) ? 'ブックマーク解除' : 'ブックマークに追加'}
                      className={`w-5 h-5 flex items-center justify-center rounded transition-all ${
                        isBookmarked(selectedText, para.id)
                          ? darkMode ? 'text-amber-400' : 'text-amber-500'
                          : darkMode ? 'text-zinc-700 hover:text-zinc-400' : 'text-stone-300 hover:text-stone-500'
                      }`}
                    >
                      {isBookmarked(selectedText, para.id)
                        ? <BookmarkCheck size={13} strokeWidth={2} />
                        : <Bookmark size={13} strokeWidth={1.5} />}
                    </button>
                    {/* リンクコピーボタン */}
                    <button
                      onClick={(e) => copyParaLink(e, selectedText, para.id)}
                      title="この段落のリンクをコピー"
                      className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-zinc-700 hover:text-zinc-400' : 'text-stone-300 hover:text-stone-500'}`}
                    >
                      <Link size={12} strokeWidth={1.6} />
                    </button>
                    {/* 段落読み上げボタン */}
                    <button
                      onClick={(e) => { e.stopPropagation(); speakParagraph(para, currentText); }}
                      title={speakingId === para.id ? '停止' : 'この段落を読み上げる'}
                      className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                        speakingId === para.id
                          ? (darkMode ? 'bg-amber-700 text-amber-100' : 'bg-stone-700 text-white')
                          : darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-stone-300 hover:text-stone-500'
                      }`}
                    >
                      {speakingId === para.id ? <IconSquare size={10} strokeWidth={2} fill="currentColor" /> : <Volume2 size={13} strokeWidth={1.6} />}
                    </button>
                    <span className={`${textSecondary}`}>{isCollapsed ? <ChevronRight size={13} strokeWidth={1.8} /> : <ChevronDown size={13} strokeWidth={1.8} />}</span>
                  </div>
                </button>

                {/* 段落コンテンツ */}
                {!isCollapsed && (
                  <div className={`px-6 pb-6 border-t ${borderClass}`}>

                    {/* 原文 */}
                    {showFrench && (
                      <div className="pt-5 mb-4">
                        {/* 原文ラベル行：通常テキストは「原文」バッジ、戯曲は speaker バッジ */}
                        {hasSpeaker ? (
                          <span className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded border ${
                            darkMode ? speakerColor.dark : speakerColor.light
                          }`}>
                            {para.speaker.toUpperCase()}
                          </span>
                        ) : (
                          <span className={`text-xs font-sans tracking-widest uppercase ${darkMode ? 'text-zinc-500' : 'text-stone-400'}`}>
                            原文
                          </span>
                        )}
                        <p className={`mt-2 leading-loose whitespace-pre-line pl-4 border-l-2 ${
                          darkMode ? 'border-stone-700' : 'border-stone-300'
                        } ${textClass} ${
                          fontSize === 'xlarge' ? 'text-2xl' :
                          fontSize === 'large'  ? 'text-xl' :
                          fontSize === 'medium' ? 'text-lg' : 'text-base'
                        }`}>
                          {showAnnotations && hasAnnotations
                            ? renderTextWithAnchors(getOriginalText(para), paraAnnotations, para.id)
                            : getOriginalText(para)
                          }
                        </p>
                      </div>
                    )}

                    {/* 注釈パネル */}
                    {showAnnotations && hasAnnotations && (
                      <div className={`mb-3 rounded-lg border ${darkMode ? 'border-amber-900/50 bg-amber-950/20' : 'border-amber-200 bg-amber-50/50'}`}>
                        <button
                          onClick={() => setExpandedAnnotations(prev => ({ ...prev, [para.id]: !prev[para.id] }))}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors rounded-lg ${
                            darkMode ? 'text-amber-300 hover:bg-amber-900/20' : 'text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <FileText size={13} strokeWidth={1.6} className="shrink-0" />
                            <span>注釈 {paraAnnotations.length}件</span>
                            {/* typeバッジ一覧（折りたたみ時） */}
                            {!isAnnotationOpen && (
                              <span className="flex gap-1">
                                {[...new Set(paraAnnotations.map(a => a.type))].map(t => (
                                  <span key={t} className={`px-1.5 py-0.5 rounded text-xs border ${darkMode ? getTypeDef(t).colorDark : getTypeDef(t).colorLight}`}>
                                    {getTypeDef(t).label}
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                          <span>{isAnnotationOpen ? <ChevronDown size={12} strokeWidth={1.8} /> : <ChevronRight size={12} strokeWidth={1.8} />}</span>
                        </button>
                        {isAnnotationOpen && (
                          <div className="px-3 pb-3 space-y-2">
                            {paraAnnotations.map((ann, i) => (
                              <AnnotationItem key={i} ann={ann} paraId={para.id} annIdx={i} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 仮訳 */}
                    {showOfficial && translation && (
                      <div className={`mb-4 border-l-2 border-amber-400/70 pl-4 ${showFrench ? '' : 'pt-4'}`}>
                        <span className={`text-xs font-sans tracking-widest uppercase ${darkMode ? 'text-zinc-500' : 'text-stone-400'}`}>
                          仮訳
                        </span>
                        <p className={`mt-2 leading-loose whitespace-pre-line ${darkMode ? 'text-zinc-300' : 'text-stone-700'} ${
                          fontSize === 'xlarge' ? 'text-xl' :
                          fontSize === 'large'  ? 'text-lg' :
                          fontSize === 'medium' ? 'text-base' : 'text-sm'
                        }`}>
                          {translation}
                        </p>
                      </div>
                    )}

                    {/* 自分の訳 */}
                    {showUser && (
                      <div className={`border-l-2 pl-4 ${darkMode ? "border-violet-600/50" : "border-violet-300"}`}>
                        <span className={`text-xs font-sans tracking-widest uppercase ${darkMode ? 'text-zinc-500' : 'text-stone-400'}`}>
                          自分の訳
                        </span>
                        {editingParagraph === para.id ? (
                          <div className="mt-2">
                            <textarea
                              id={`user-translation-${para.id}`}
                              defaultValue={userTranslations[para.id]?.text || ''}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px] text-sm resize-y ${darkMode ? 'bg-zinc-900 text-zinc-100 border-zinc-700' : 'bg-white border-stone-300'}`}
                              placeholder="自分の訳を書く..."
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveTranslation(para.id)}
                                className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors font-medium"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingParagraph(null)}
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 font-sans' : 'bg-stone-100 text-stone-700 hover:bg-stone-200 font-sans'}`}
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {userTranslations[para.id] ? (
                              <p className={`leading-relaxed whitespace-pre-line ${textClass} text-sm mb-2`}>
                                {userTranslations[para.id].text}
                              </p>
                            ) : (
                              <p className={`text-sm ${textSecondary} italic mb-2`}>まだ訳文がありません</p>
                            )}
                            <button
                              onClick={() => setEditingParagraph(para.id)}
                              className={`text-xs font-medium transition-colors ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700 hover:underline'}`}
                            >
                              {userTranslations[para.id] ? '編集' : '訳を書く'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              </React.Fragment>
            );
          })}
        </div>}

        {/* フッター */}
        <div className={`text-center text-xs font-sans ${textSecondary} pb-8 space-y-1`}>
          <p>{Object.keys(texts).length}編収録</p>
          <p>掲載の日本語訳は学習補助のための試訳であり、確定した翻訳ではありません</p>
        </div>
      </div>
    </div>
  );
}
