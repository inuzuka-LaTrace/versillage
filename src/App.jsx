import React, { useState, useEffect, useRef } from 'react';
import {
  Bookmark, BookmarkCheck,
  Settings, Moon, Sun, Sparkles, ChevronUp,
  Volume2, Square as IconSquare,
  Search, Link, FileText, List,
  ChevronRight, ChevronDown,　
  X, Check, Tag,
  Clock, ExternalLink, PenLine,
} from 'lucide-react';
import racineData from './data/racine';
import mallarmeData from './data/mallarme';
import baudelaireData from './data/baudelaire';
import valeryData from './data/valery';
import valmoreData from './data/valmore';
import rimbaudData from './data/rimbaud';
import verlaineData from './data/verlaine';
import lecontelisleData from './data/lecontelisle';
import banvilleData from './data/banville';
import rodenbachData from './data/rodenbach';
import verhaerenData from './data/verhaeren';
import maeterlinckData from './data/maeterlinck';
import vanlerbergheData from './data/vanlerberghe';
import gautierData from './data/gautier';
import georgeData from './data/george';
import hofmannsthalData from './data/hofmannsthal';
import traklData from './data/trakl';
import hoelderlinData from './data/hoelderlin';
import rilkeData from './data/rilke';
import danteData from './data/dante';
import dannunzioData from './data/dannunzio';
import pascoliData from './data/pascoli';
import gozzanoData from './data/gozzano';
import corazziniData from './data/corazzini';
import bryusovData from './data/bryusov';
import sologubData from './data/sologub';
import blokData from './data/blok';
import balmontData from './data/balmont';
import poeData from './data/poe';
import wildeData from './data/wilde';
import dowsonData from './data/dowson';
import swinburneData from './data/swinburne';
import rossetti_cData from './data/rossetti_c';
import d_g_rossettiData from './data/d_g_rossetti';
import yeatsData from './data/yeats';
import { CATEGORIES, CAT_SHORT, ANNOTATION_TYPE_DEF, SPEECH_RATES, PREFERRED_VOICES } from './constants';
import { getTranslation, getOriginalText, getSpeechLang, getBestVoice, extractSnippet } from './utils';

// getTranslation, getOriginalText, getSpeechLang, getBestVoice, PREFERRED_VOICES, SPEECH_RATES → constants.js / utils.js

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
    () => getTextIdFromHash() || null
  );
  const [userTranslations, setUserTranslations] = useState({});
  const [editingParagraph, setEditingParagraph] = useState(null);
  const [showFrench, setShowFrench] = useState(true);
  const [showOfficial, setShowOfficial] = useState(true);
  const [showUser, setShowUser] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    // ブラウザ言語が日本語なら非表示
    const lang = navigator.language || navigator.languages?.[0] || '';
    if (lang.startsWith('ja')) return false;
    // 一度閉じたらlocalStorageに記録
    try { if (localStorage.getItem('welcomeDismissed') === '1') return false; } catch {}
    return true;
  });
  const dismissWelcome = () => {
    setShowWelcome(false);
    try { localStorage.setItem('welcomeDismissed', '1'); } catch {}
  };
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [fontFamily, setFontFamily] = useState('garamond');
  const [transColor, setTransColor] = useState(() => {
    try { return localStorage.getItem('transColor') || 'neutral'; } catch { return 'neutral'; }
  });
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'vertical', 'side'

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
  // 対照読解ビュー
  const [crossMode, setCrossMode] = useState(false);
  const [crossTexts, setCrossTexts] = useState([]);
  // ブックマーク: { textId: [paraId, ...] }
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bookmarks') || '{}'); } catch { return {}; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showToc, setShowToc]             = useState(false);
  const [tocOpenAuthors, setTocOpenAuthors] = useState({}); // { authorKey: bool }
  const [tocLangFilter, setTocLangFilter]   = useState('all'); // 'all'|'fr'|'de'|'en'|'it'|'ru'
  const [tocSearch, setTocSearch]           = useState('');

  const settingsRef = useRef(null);
  const bodyRef = useRef(null);      // 段落コントロールバーへのref
  const textInfoRef = useRef(null);  // テキスト情報パネルへのref
  const paragraphRefs = useRef({});  // paragraphId → DOM要素ref
  const headerRef = useRef(null);    // sticky ヘッダーへのref

  // sticky ヘッダーを考慮したスクロールヘルパー（オフセット16px余白付き）
  const scrollToEl = (el, smooth = true) => {
    if (!el) return;
    const headerH = headerRef.current?.offsetHeight ?? 60;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  };

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

  const [displayAuthor, setDisplayAuthor] = useState("");
  
  useEffect(() => {
  if (loading) {
    const authorList = Object.values(texts).flat().map(item => item.author);
    const uniqueAuthors = Array.from(new Set(authorList)).filter(Boolean);
    
    let count = 0;
    const maxCount = 7; // VANITISMEの前に表示する作家の人数（お好みで調整してください）

    const interval = setInterval(() => {
      if (count < maxCount) {
        // ランダムな作家を表示
        const randomAuthor = uniqueAuthors[Math.floor(Math.random() * uniqueAuthors.length)];
        setDisplayAuthor(randomAuthor);
        count++;
      } else {
        // 最後にタイトルを表示して、タイマーを止める
        setDisplayAuthor("VANITISME");
        clearInterval(interval);
      }
    }, 600); // 500ms（0.5秒）間隔を維持
    return () => clearInterval(interval);
  }
}, [loading, texts]);
  // コンポーネントアンマウント時・テキスト切替時に読み上げ停止
  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [selectedText]);

  // <html lang> を現在表示中テキストの言語に動的更新
  // （ブラウザ自動翻訳がUIの言語を正しく認識できるようにする）
  useEffect(() => {
    const lang = texts[selectedText];
    // テキスト未選択 or 不明なら日本語UIとして ja を設定
    document.documentElement.lang = lang ? 'ja' : 'ja';
  }, [selectedText, texts]);

  useEffect(() => {
    const allTexts = {
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
    setTexts(allTexts);
  const timer = setTimeout(() => {
    setLoading(false);
  }, 5300);

  return () => clearTimeout(timer);
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
              scrollToEl(paragraphRefs.current[paraId]);
            }, 60);
          }, 80);
        }
      } else {
        // hash が空 or '#' → 一覧に戻る
        resetTextState(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // --- ステート・参照の定義 ---
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const deltaY = currentY - lastScrollY.current;

      // --- ヘッダー切り替えロジック ---
      // 50pxを超えており、かつ下方向に動いている時だけ true
      if (currentY > 50 && deltaY > 0) {
        setIsScrollingDown(true);
      } 
      // 上にスクロールした瞬間に即座に解除
      else if (deltaY < 0) {
        setIsScrollingDown(false);
      }

      // --- トップボタン表示ロジック ---
      setShowScrollTop(currentY > 300 && deltaY < 0);

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const categories = CATEGORIES; // constants.js

  // 訳文カラー設定を localStorage に保存
  useEffect(() => {
    try { localStorage.setItem('transColor', transColor); } catch {}
  }, [transColor]);

  // extractSnippet → utils.js

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
          scrollToEl(paragraphRefs.current[paraId]);
        }, 60);
      }, 100);
    } else {
      pushParaHash(textId, paraId);
      setCollapsedParagraphs(prev => ({ ...prev, [paraId]: false }));
      setTimeout(() => {
        scrollToEl(paragraphRefs.current[paraId]);
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

  // テキスト切り替え（状態リセット + URL更新 + テキスト情報へスクロール）
  const handleTextChange = (textId) => {
    resetTextState(textId);
    pushTextHash(textId);
    setTimeout(() => {
      scrollToEl(textInfoRef.current);
    }, 80);
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
      scrollToEl(paragraphRefs.current[paraId]);
    }, 60);
  };

  // ─── 注釈ユーティリティ ────────────────────────────────────

  // typeごとの表示定義
  // ANNOTATION_TYPE_DEF → constants.js

  const getTypeDef = (type) =>
    ANNOTATION_TYPE_DEF[type] ?? { label: type, colorLight: 'bg-gray-100 text-gray-700 border-gray-300', colorDark: 'bg-gray-800 text-gray-300 border-gray-600', dot: 'bg-gray-400' };

  // 段落の注釈一覧取得
  const getParaAnnotations = (paraId) =>
    (currentText?.annotations || []).filter(a => a.paragraphId === paraId);

  // anchor付き注釈：テキスト全体（改行含む）をparts配列に分割するヘルパー
  // anchorが複数行にまたがっていても正しくマッチする
  const splitTextByAnchors = (fullText, anchored) => {
    let parts = [{ text: fullText, type: 'plain' }];
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

  // partsを改行展開してReact要素列に変換
  const renderParts = (parts, paraId) => {
    const isActive = (ann) =>
      activeAnchor?.paraId === paraId && activeAnchor?.anchor === ann.anchor;
    const typeDef = (ann) => getTypeDef(ann.type);

    const tokens = [];
    for (const part of parts) {
      if (part.type === 'plain') {
        const lines = part.text.split('\n');
        lines.forEach((line, li) => {
          if (li > 0) tokens.push({ type: 'br' });
          if (line) tokens.push({ type: 'text', text: line });
        });
      } else {
        const lines = part.text.split('\n');
        lines.forEach((line, li) => {
          if (li > 0) tokens.push({ type: 'br' });
          if (line) tokens.push({ type: 'anchor', text: line, ann: part.ann, isFirst: li === 0 });
        });
      }
    }

    return tokens.map((tok, i) => {
      if (tok.type === 'br') return <br key={i} />;
      if (tok.type === 'text') return <span key={i}>{tok.text}</span>;
      const ann = tok.ann;
      const active = isActive(ann);
      return (
        <span
          key={i}
          role="button"
          tabIndex={0}
          onClick={() => setActiveAnchor(active ? null : { paraId, anchor: ann.anchor })}
          onKeyDown={(e) => e.key === 'Enter' && setActiveAnchor(active ? null : { paraId, anchor: ann.anchor })}
          className={`relative inline border-b-2 transition-colors cursor-pointer rounded-sm px-0.5 ${
            active
              ? darkMode
                ? `border-amber-400 ${typeDef(ann).colorDark} bg-opacity-60`
                : `border-amber-500 bg-amber-50`
              : darkMode
                ? 'border-zinc-600 hover:border-amber-500'
                : 'border-stone-400 hover:border-amber-500'
          }`}
          title={`${getTypeDef(ann.type).label}：クリックで表示`}
        >
          {tok.text}
          {tok.isFirst && (
            <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${typeDef(ann).dot}`} />
          )}
        </span>
      );
    });
  };

  // anchor付き注釈レンダリング（全モード共通・複数行anchor対応）
  const renderTextWithAnchors = (text, annotations, paraId) => {
    const anchored = annotations.filter(a => a.anchor);
    if (!anchored.length) {
      return (
        <>
          {text.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </>
      );
    }
    const parts = splitTextByAnchors(text, anchored);
    return <>{renderParts(parts, paraId)}</>;
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

  // ─── テキストボリューム計算ヘルパー ───────────────────────────
  // フランス語・英語等の原文単語数（空白区切り、句読点除去）
  const countWords = (text) => {
    if (!text) return 0;
    return text.replace(/[\n\r]+/g, ' ').trim().split(/\s+/).filter(w => w.replace(/[«»—.,;:!?()\[\]"']/g, '').length > 0).length;
  };
  // テキストオブジェクト全体の原文単語数合計
  const textWordCount = (textObj) => {
    if (!textObj?.paragraphs) return 0;
    return textObj.paragraphs.reduce((sum, p) => sum + countWords(getOriginalText(p)), 0);
  };

  // ─── ブックマーク一覧パネル ──────────────────────────────────
  const BookmarkPanel = () => {
    const allBookmarks = Object.entries(bookmarks).flatMap(([tid, pids]) =>
      (texts[tid] ? pids.map(pid => ({ textId: tid, paraId: pid, text: texts[tid] })) : [])
    );
    if (allBookmarks.length === 0) return (
      <div className={`rounded-sm border p-5 mb-4 ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP flex items-center gap-1.5 ${textSecondary}`}><Bookmark size={13} strokeWidth={1.6} />ブックマーク</h2>
          <button onClick={() => setShowBookmarks(false)} className={`text-xs ${textSecondary} hover:opacity-70`}>閉じる</button>
        </div>
        <p className={`text-sm font-IBM Plex sans JP ${textSecondary} py-3 flex items-center gap-1.5 flex-wrap`}>
          ブックマークはありません。段落ヘッダーの
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-xs font-mono"
            style={{verticalAlign:'middle'}}><Bookmark size={11} strokeWidth={1.6} /></span>
          ボタンで追加できます。
        </p>
        {/* フラッシュカードへのリンク */}
        <div className={`mt-2 pt-3 border-t ${darkMode ? 'border-zinc-800' : 'border-stone-100'}`}>
          <a
            href="/flashcard.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-IBM Plex sans JP transition-colors ${
              darkMode
                ? 'bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            <span>フラッシュカード学習を開く</span>
            <span className="opacity-50">→</span>
          </a>
        </div>
      </div>
    );
    return (
      <div className={`rounded-sm border p-4 mb-4 ${cardBgClass}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP flex items-center gap-1.5 ${textSecondary}`}>
            <Bookmark size={13} strokeWidth={1.6} />ブックマーク <span className="font-normal opacity-70">({allBookmarks.length}件)</span>
          </h2>
          <button onClick={() => setShowBookmarks(false)} className={`text-xs ${textSecondary} hover:opacity-70 font-IBM Plex sans JP`}>閉じる</button>
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
                  <p className={`text-xs font-IBM Plex sans JP font-medium truncate ${textSecondary}`}>{text.author} — {text.title}</p>
                  <p translate="no" className={`notranslate text-xs font-serif truncate ${textClass}`}>{preview}{preview.length >= 60 ? '…' : ''}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); copyParaLink(e, textId, paraId); }}
                  title="リンクをコピー"
                  className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-IBM Plex sans JP transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-stone-400 hover:text-stone-600'}`}
><Link size={12} strokeWidth={1.6} /></button>
                <button
                  onClick={(e) => toggleBookmark(e, textId, paraId)}
                  title="ブックマーク解除"
                  className={`shrink-0 text-xs font-IBM Plex sans JP transition-colors ${darkMode ? 'text-amber-400 hover:text-zinc-400' : 'text-amber-600 hover:text-stone-400'}`}
><BookmarkCheck size={13} strokeWidth={2} /></button>
              </div>
            );
          })}
        </div>
        {/* フラッシュカードへのリンク */}
        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-zinc-800' : 'border-stone-100'}`}>
          <a
            href="/flashcard.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-IBM Plex sans JP transition-colors ${
              darkMode
                ? 'bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            <span>ブックマークでフラッシュカード学習</span>
            <span className="opacity-50">→</span>
          </a>
        </div>
      </div>
    );
  };


  // ─── 対照読解：1パネル分のレンダリング ───────────────────────
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
              <h3 className={`font-EB Garamond text-sm font-semibold leading-snug ${textClass}`}>{textObj.title}</h3>
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
                      darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-600 font-IBM Plex sans JP' : 'bg-stone-100 text-stone-600 border-stone-300 font-sans'
                    }`}>Scène {para.scene}</span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-700' : 'bg-[#c8b480]'}`} />
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
                      {para.epigraphs && para.epigraphs.length > 0 && (
                        <div className={`mt-2 mb-2 pl-3 border-l-2 space-y-1 ${darkMode ? 'border-stone-600' : 'border-stone-300'}`}>
                          {para.epigraphs.map((ep, ei) => (
                            <div key={ei}>
                              <p className={`text-xs italic leading-snug font-serif ${darkMode ? 'text-zinc-400' : 'text-stone-500'}`}>{ep.text}</p>
                              {(ep.author || ep.source) && (
                                <p className={`text-xs ${darkMode ? 'text-zinc-600' : 'text-stone-400'}`}>— {[ep.author, ep.source].filter(Boolean).join(', ')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {showOrig && orig && (
                        <p translate="no" className={`notranslate pt-2 leading-relaxed whitespace-pre-line ${textClass} text-sm`}>{orig}</p>
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
    <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* キー（key）に displayAuthor を指定することで、名前が変わった時だけアニメーションをリセットさせます */}
        <span 
          key={displayAuthor}
          className="text-[#8a7a5a] font-serif text-2xl md:text-4xl tracking-[0.3em] animate-in fade-in zoom-in duration-500"
          style={{ 
            fontFamily: 'Cinzel, serif',
            // 位置を固定、または微細なランダムに留める
            transform: 'translate(0, -10%)', 
            textShadow: '0 0 15px rgba(138, 122, 90, 0.3)'
          }}
        >
          {displayAuthor || "VANITÉ DES VANITÉS"}
        </span>
      </div>

      {/* 装飾：ゴダール風の水平線（動かない静かな要素） */}
      <div className="absolute w-16 h-[1px] bg-red-900/20 top-1/2 left-1/2 -translate-x-1/2 mt-12" />
    </div>
  );
}
  // ─── テーマ変数 ───────────────────────────────────────────
  const bgClass         = darkMode ? 'bg-[#131008]'                              : 'bg-[#f5efe0]';
  const cardBgClass     = darkMode ? 'bg-[#17140e] border-[#2e2a20]'             : 'bg-[#ede4cc] border-[#c8b480]';
  const textClass       = darkMode ? 'text-[#ddd0b3]'                            : 'text-[#1a1208]';
  const textSecondary   = darkMode ? 'text-[#8a7a5a]'                            : 'text-[#6b5a3a]';
  const borderClass     = darkMode ? 'border-[#2e2a20]'                          : 'border-[#c8b480]';
  const inputBg         = darkMode ? 'bg-[#0f0d09] text-[#ddd0b3] placeholder-[#5a4a38] border-[#3a3228]' : 'bg-[#ede4cc] text-[#1a1208] placeholder-[#a08560] border-[#c8b480]';
  const settingsBg      = darkMode ? 'bg-[#17140e] border-[#3a3228] shadow-2xl'  : 'bg-[#ede4cc] border-[#c8b480] shadow-2xl';

  const fontFamilyStyle =
    fontFamily === 'garamond'     ? '"EB Garamond", "Shippori Mincho B1", serif' :
    fontFamily === 'alice'        ? '"Alice", "Shippori Mincho B1", serif' :
    fontFamily === 'jura'         ? '"Jura", "IBM Plex sans JP", sans-serif' :
    '"EB Garamond", "Shippori Mincho B1", serif';

  const fontSizeMap = { xxsmall: 'text-[10px]', xsmall: 'text-xs', small: 'text-sm', medium: 'text-base', large: 'text-lg', xlarge: 'text-xl', xxlarge: 'text-2xl' };

  // 訳文カラー設定から Tailwind クラスを返すヘルパー
  // neutral: ダーク zinc-300 / ライト stone-700（白黒）
  // red:    ダーク red-300/80 / ライト red-800/80
  // violet:    ダーク violet-300/80 / ライト violet-800/80
  // transTextClass: neutral / red / violet / ink
  const transTextClass =
    transColor === 'red'    ? (darkMode ? 'text-red-400/80'     : 'text-red-800/80') :
    transColor === 'violet' ? (darkMode ? 'text-violet-300/80'  : 'text-violet-800/80') :
    transColor === 'ink'    ? (darkMode ? 'text-[#b8a880]'      : 'text-[#3a2e20]') :
    /* neutral */             (darkMode ? 'text-zinc-300'        : 'text-[#4a3a28]');
  const transBorderClass =
    transColor === 'red'    ? (darkMode ? 'border-red-700/50'    : 'border-red-300/60') :
    transColor === 'violet' ? (darkMode ? 'border-violet-700/50' : 'border-violet-300/60') :
    transColor === 'ink'    ? (darkMode ? 'border-[#5a4a38]'     : 'border-[#8a6a40]') :
    /* neutral */             (darkMode ? 'border-stone-600'     : 'border-[#c8b480]');

    // カテゴリーラベルの短縮表示用マップ
  const catShort = CAT_SHORT; // constants.js

  const authorColor = (cat) => {
    if (cat?.startsWith('racine'))       return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('baudelaire'))   return darkMode ? 'bg-yellow-900/40 text-yellow-300'   : 'bg-yellow-100 text-yellow-800';
    if (cat?.startsWith('mallarme'))     return darkMode ? 'bg-sky-900/40 text-sky-300'       : 'bg-sky-100 text-sky-800';
    if (cat?.startsWith('valery'))       return darkMode ? 'bg-rose-900/40 text-rose-300'     : 'bg-rose-100 text-rose-800';
    if (cat?.startsWith('valmore'))      return darkMode ? 'bg-pink-900/40 text-pink-300'     : 'bg-pink-100 text-pink-800';
    if (cat?.startsWith('leconte_de_lisle')) return darkMode ? 'bg-emerald-900/40 text-emerald-300': 'bg-emerald-100 text-emerald-800';
    if (cat?.startsWith('banville'))     return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('rodenbach'))    return darkMode ? 'bg-sky-1000/40 text-sky-400'       : 'bg-sky-200 text-sky-900';
    if (cat?.startsWith('verhaeren'))    return darkMode ? 'bg-emerald-900/40 text-emerald-300': 'bg-emerald-100 text-emerald-800';
    if (cat?.startsWith('maeterlinck'))  return darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800';
    if (cat?.startsWith('vanlerberghe')) return darkMode ? 'bg-red-900/40 text-red-300'       : 'bg-red-100 text-red-800';
    if (cat?.startsWith('dante'))        return darkMode ? 'bg-red-900/40 text-red-300'       : 'bg-red-100 text-red-800';
    if (cat?.startsWith('dannunzio'))    return darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
    if (cat?.startsWith('pascoli'))      return darkMode ? 'bg-sky-1000/40 text-sky-400'       : 'bg-sky-200 text-sky-900';
    if (cat?.startsWith('gozzano'))      return darkMode ? 'bg-yellow-900/40 text-yellow-300'   : 'bg-yellow-100 text-yellow-800';
    if (cat?.startsWith('corazzini'))      return darkMode ? 'bg-pink-900/40 text-pink-300'     : 'bg-pink-100 text-pink-800';
    if (cat?.startsWith('leconte_de_lisle')) return darkMode ? 'bg-cyan-900/40 text-cyan-300': 'bg-cyan-100 text-cyan-800';
    if (cat?.startsWith('bryusov'))      return darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
    if (cat?.startsWith('sologub'))      return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('blok'))         return darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800';
    if (cat?.startsWith('balmont'))      return darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-800';
    if (cat?.startsWith('rimbaud'))      return darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-800';
    if (cat?.startsWith('verlaine'))     return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('gautier'))      return darkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-100 text-cyan-800';
    if (cat?.startsWith('poe'))        return darkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-800';
    if (cat?.startsWith('wilde'))        return darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-800';
    if (cat?.startsWith('dowson'))        return darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-800';
    if (cat?.startsWith('swinburne'))    return darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800';
    if (cat?.startsWith('rossetti_c'))       return darkMode ? 'bg-rose-900/40 text-rose-300'     : 'bg-rose-100 text-rose-800';
    if (cat?.startsWith('d_g_rossetti'))       return darkMode ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-800';
    if (cat?.startsWith('yeats'))        return darkMode ? 'bg-amber-900/40 text-amber-300'   : 'bg-amber-100 text-amber-800';
    if (cat?.startsWith('george'))       return darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-100 text-teal-800';
    if (cat?.startsWith('hofmannsthal')) return darkMode ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-200 text-yellow-900';
    if (cat?.startsWith('trakl'))        return darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-200 text-blue-900';
    if (cat?.startsWith('hoelderlin'))   return darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-800';
    if (cat?.startsWith('rilke')) return darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-800';
    return darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-stone-100 text-stone-700';
  };

  return (
    <div className={`min-h-screen ${bgClass} relative`} style={{ fontFamily: fontFamilyStyle }}>

      {/* ─── 目次ドロワー ─────────────────────────────────── */}
      {showToc && <TocDrawer
      showToc={showToc}
      setShowToc={setShowToc}
      darkMode={darkMode}
      texts={texts}
      currentText={currentText}
      tocSearch={tocSearch}
      setTocSearch={setTocSearch}
      tocLangFilter={tocLangFilter}
      setTocLangFilter={setTocLangFilter}
      tocOpenAuthors={tocOpenAuthors}
      setTocOpenAuthors={setTocOpenAuthors}
      handleTextChange={handleTextChange}
      />}

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
          ${loading ? '' : 'transition-transform duration-500 ease-in-out'}
          ${showSettings ? 'translate-x-0' : 'translate-x-full'}
          ${loading ? 'invisible' : 'visible'}
          ${darkMode ? 'bg-zinc-900 border-l border-zinc-800' : 'bg-[#f5efe0] border-l border-[#c8b480]'}`}
          >
          <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-zinc-800' : 'border-[#c8b480]'}`}>
          <h3 className={`text-sm font-semibold tracking-wide font-IBM Plex sans JP ${textClass}`}>表示設定</h3>
          <button
            onClick={() => setShowSettings(false)}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-stone-200 text-stone-500'}`}
          ><X size={13} strokeWidth={2} /></button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* 追加：外観（ダークモード切替） */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP ${textSecondary} block mb-2.5`}>外観</label>
            <div 
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer rounded-xl border transition-all font-IBM Plex sans JP
              ${darkMode 
                ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750' 
                : 'bg-stone-100 border-stone-200 hover:bg-stone-200'}`}
              >
              <div className="flex items-center gap-3">
                {darkMode ? (
                <Moon size={16} className="text-amber-400" strokeWidth={1.6} />
              ) : (
                <Sun size={16} className="text-stone-500" strokeWidth={1.6} />
              )}
                <span className={`text-sm ${textClass}`}>{darkMode ? 'テーマ切替' : 'テーマ切替'}</span>
              </div>      
      {/* トグルスイッチ（既存のデザインに準拠） */}
      <div className={`relative w-10 h-5 rounded-full transition-colors
        ${darkMode ? 'bg-amber-600' : 'bg-stone-300'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
          ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </div>
  </div>
{/* --- 表示モード設定（3つのモード：標準・上下・左右） --- */}
<div className="space-y-3 pt-6 mt-6 border-t border-stone-200/60 dark:border-[#3a3228]">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#17140e]' : 'bg-stone-100'}`}>
        <List className={`w-4 h-4 ${textSecondary}`} />
      </div>
      <div>
        <p className={`text-sm font-medium ${textClass}`}>表示レイアウト</p>
        <p className={`text-xs ${textSecondary}`}>原文と訳文の構成を選択</p>
      </div>
    </div>
  </div>

  <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl ${darkMode ? 'bg-black/20' : 'bg-stone-100'}`}>
    {/* 標準（原文のみ） */}
    <button
      onClick={() => setViewMode('standard')}
      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
        viewMode === 'standard' 
          ? (darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-white text-stone-800 shadow-sm')
          : (darkMode ? 'text-zinc-500 hover:text-zinc-400' : 'text-stone-500 hover:text-stone-700')
      }`}
    >
      <FileText className="w-3.5 h-3.5 mb-1" />
      <span className="text-[10px] font-medium">標準</span>
    </button>
    
    {/* 上下（対訳） */}
    <button
      onClick={() => setViewMode('vertical')}
      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
        viewMode === 'vertical' 
          ? (darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-white text-stone-800 shadow-sm')
          : (darkMode ? 'text-zinc-500 hover:text-zinc-400' : 'text-stone-500 hover:text-stone-700')
      }`}
    >
      <div className="flex flex-col gap-0.5 mb-1 items-center">
        <div className="w-3 h-0.5 bg-current opacity-40"></div>
        <div className="w-3 h-0.5 bg-current"></div>
      </div>
      <span className="text-[10px] font-medium">上下</span>
    </button>

    {/* 左右（対訳） */}
    <button
      onClick={() => setViewMode('side')}
      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
        viewMode === 'side' 
          ? (darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-white text-stone-800 shadow-sm')
          : (darkMode ? 'text-zinc-500 hover:text-zinc-400' : 'text-stone-500 hover:text-stone-700')
      }`}
    >
      <div className="flex gap-0.5 mb-1 items-center">
        <div className="w-1 h-3 bg-current opacity-40"></div>
        <div className="w-1 h-3 bg-current"></div>
      </div>
      <span className="text-[10px] font-medium">左右</span>
    </button>
  </div>
</div>
          {/* フォントサイズ：ステッパー */}
          {(() => {
            const sizeSteps = ['xxsmall','xsmall','small','medium','large','xlarge','xxlarge'];
            const sizeLabels = { xxsmall:'最小', xsmall:'極小', small:'小', medium:'中', large:'大', xlarge:'特大', xxlarge:'最大' };
            const idx = sizeSteps.indexOf(fontSize);
            const canDec = idx > 0;
            const canInc = idx < sizeSteps.length - 1;
            return (
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP ${textSecondary} block mb-2.5`}>文字サイズ</label>
                <div className={`flex items-center rounded-xl overflow-hidden border ${darkMode ? 'border-zinc-700' : 'border-stone-200'}`}>
                  <button
                    onClick={() => canDec && setFontSize(sizeSteps[idx - 1])}
                    disabled={!canDec}
                    className={`w-10 h-10 flex items-center justify-center text-lg font-light transition-colors font-IBM Plex sans JP
                      ${canDec
                        ? darkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-stone-600 hover:bg-stone-100'
                        : darkMode ? 'text-zinc-700' : 'text-stone-300'}`}
                  >−</button>
                  <div className={`flex-1 flex flex-col items-center justify-center py-2 border-x ${darkMode ? 'border-zinc-700' : 'border-stone-200'}`}>
                    <span className={`font-serif leading-none ${fontSizeMap[fontSize]} ${textClass}`} style={{ fontFamily: fontFamilyStyle }}>Abcあ</span>
                    <span className={`text-xs mt-1 font-IBM Plex sans JP ${textSecondary}`}>{sizeLabels[fontSize]}</span>
                  </div>
                  <button
                    onClick={() => canInc && setFontSize(sizeSteps[idx + 1])}
                    disabled={!canInc}
                    className={`w-10 h-10 flex items-center justify-center text-lg font-light transition-colors font-IBM Plex sans JP
                      ${canInc
                        ? darkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-stone-600 hover:bg-stone-100'
                        : darkMode ? 'text-zinc-700' : 'text-stone-300'}`}
                  >＋</button>
                </div>
              </div>
            );
          })()}

          {/* フォント */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP ${textSecondary} block mb-2.5`}>フォント</label>
            <div className="flex flex-col gap-1.5">
              {[
                ['garamond',    'Garamond',     'EB Garamond'],
                ['alice',       'Alice',         'Alice'],
                ['jura',        'Jura',           'Jura'],
              ].map(([val, label, preview]) => (
                <button key={val} onClick={() => setFontFamily(val)}
                  className={`py-2.5 px-3.5 text-xs rounded-lg text-left transition-all flex items-center justify-between font-IBM Plex sans JP
                    ${fontFamily === val
                      ? darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-stone-800 text-white shadow-sm'
                      : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-[#e8dfc0] text-[#4a3a28] hover:bg-[#e0d4b0]'}`}
                >
                  <span>{label}</span>
                  <span className="opacity-60" style={{ fontFamily: `"${preview}", serif`, fontSize: '1.05em' }}>Abcあ</span>
                </button>
              ))}
            </div>
          </div>

          {/* 訳文の色 */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP ${textSecondary} block mb-2.5`}>訳文の色</label>
            <div className={`flex rounded-lg overflow-hidden border ${darkMode ? 'border-zinc-700' : 'border-[#c8b480]'}`}>
              {[['neutral','白黒'],['ink','墨'],['red','赤'],['violet','紫']].map(([val, label], i) => (
                <button key={val} onClick={() => setTransColor(val)}
                  className={`flex-1 py-2 text-xs font-IBM Plex sans JP transition-colors ${transColor === val
                    ? darkMode ? 'bg-amber-700 text-amber-100' : 'bg-[#3a2e20] text-[#f5efe0]'
                    : darkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-[#6b5a3a] hover:bg-[#e8dfc0]'
                  }${i > 0 ? ` border-l ${darkMode ? 'border-zinc-700' : 'border-[#c8b480]'}` : ''}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 読み上げ速度 */}
         <div>
  <label className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP ${textSecondary} block mb-2.5`}>読み上げ速度</label>
  <div className="flex flex-col gap-1.5">
    {Object.entries(SPEECH_RATES).map(([key, value]) => {
      /* 現在の選択状態 (speechRate) と、このボタンの key が一致するか判定 */
      const isActive = speechRate === key;
      
      return (
        <button 
          key={key} 
          onClick={() => setSpeechRate(key)}
          className={`py-2.5 px-3.5 text-xs rounded-lg text-left flex items-center justify-between font-IBM Plex sans JP transition-all
            ${isActive
              ? darkMode ? 'bg-amber-700 text-amber-100 shadow-sm' : 'bg-stone-800 text-white shadow-sm'
              : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
        >
          {/* value.label (標準、ゆっくり、など) を表示 */}
          <span>{value.label}</span>
          
          <span className={`text-[10px] transition-opacity ${isActive ? 'opacity-80' : 'opacity-40'}`}>
            {key === 'fast' ? '1.25×' : key === 'slow' ? '0.65×' : '0.9×'}
          </span>
        </button>
      );
    })}
  </div>
</div>
          {/* 表示する内容（トグルスイッチ） */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider font-IBM Plex sans JP ${textSecondary} block mb-2.5`}>表示する内容</label>
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
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors font-IBM Plex sans JP
                    ${i < arr.length - 1 ? (darkMode ? 'border-b border-zinc-700' : 'border-b border-[#c8b480]/60') : ''}
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

      {/* ─── ヘッダー ────────────────────────────────── */}
<header 
  ref={headerRef} 
  className={`sticky top-0 z-30 border-b backdrop-blur-md 
    /* PWAモードで上端の隙間を埋めるための絶対配置要素 */
    before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-20
    ${darkMode 
      ? 'bg-zinc-950/95 border-zinc-800 before:bg-zinc-950' 
      : 'bg-stone-50/95 border-stone-200 before:bg-stone-50'}
    /* 下スクロール時は padding-top を最小化しつつ、セーフエリア分は死守 */
    ${isScrollingDown 
      ? 'pt-[env(safe-area-inset-top)] pb-1' 
      : 'pt-[calc(env(safe-area-inset-top)+12px)] pb-3'}`}
>
  <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      {/* ロゴ：縮小時は非表示 */}
      <h1
        style={{ fontFamily: "Cinzel, serif", letterSpacing: '0.07em' }}
        className={`text-xl ${textSecondary} truncate leading-tight cursor-pointer select-none
          ${isScrollingDown ? 'hidden' : 'block'}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        VANITISME
      </h1>

      {currentText && (
        <p className={`font-IBM Plex sans JP truncate
          ${isScrollingDown 
            ? `text-xs sm:text-sm py-1 ${darkMode ? 'text-stone-400' : 'text-stone-500'}` 
            : `text-[10px] sm:text-xs mt-0.5 ${textSecondary}`}`}>
          <span className="opacity-60">{currentText.author}</span>
          <span className="opacity-40 mx-1">›</span>
          <span className={`font-medium transition-colors duration-200 ${
            darkMode ? 'text-[#8a7a5a]' : 'text-stone-900'
          }`}>
            {currentText.title}
          </span>
        </p>
      )}
    </div>
{/* 右側ボタン：ここからも transition を削除し、瞬時に消す */}
    <div className={`flex items-center gap-2 flex-shrink-0
      ${isScrollingDown ? 'hidden' : 'flex'}`}>
    {/* 目次ボタン */}
    <button
      onClick={() => { setShowToc(v => !v); setShowBookmarks(false); }}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
        showToc
          ? darkMode ? 'bg-amber-700 text-[#8a7a5a]' : 'bg-stone-800 text-white'
          : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-[#8a7a5a]' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
      }`}
    >
      <List size={15}/>
    </button>

    {/* ブックマークボタン */}
    <button
      onClick={() => { setShowBookmarks(v => !v); setShowToc(false); }}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
        showBookmarks
          ? darkMode ? 'bg-amber-700 text-[#8a7a5a]' : 'bg-stone-800 text-white'
          : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-[#8a7a5a]' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
      }`}
    >
      <Bookmark size={15}/>
    </button>

    {/* 設定ボタン */}
    <button
      onClick={() => setShowSettings(v => !v)}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
        showSettings
          ? darkMode ? 'bg-amber-700 text-[#8a7a5a]' : 'bg-stone-800 text-white'
          : darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-[#8a7a5a]' : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
      }`}
    >
      <Settings size={15}/>
    </button>
  </div>
</div>
</header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ─── ウェルカムバナー ───────────────────────── */}
        {showWelcome && (
          <div className={`rounded-xl border p-4 mb-6 relative ${darkMode ? 'bg-violet-950/30 border-violet-900/50' : 'bg-[#e8dfc0] border-[#c8b480]'}`}>
            <button
              onClick={dismissWelcome}
              className={`absolute top-3 right-3 ${textSecondary} hover:opacity-70`}
            ><X size={14} strokeWidth={2} /></button>
            <p className={`text-m font-IBM Plex sans JP ${darkMode ? 'text-violet-500' : 'text-[#6b5a3a]'}`}>
              🌏 By using your browser's translation feature, you can read the Japanese translations and comentaries in your preferred language, while the original texts remain unchanged.
            </p>
          </div>
        )}

        {/* ─── ブックマークパネル ─────────────────── */}
        {showBookmarks && <BookmarkPanel />}

        {/* ─── テキスト未選択時：目次への誘導 ─── */}
        {!selectedText && (
  /* 1. 親要素：relative で背景を内包し、min-h で高さを確保、px-6 で左右余白を追加 */
  <div className="relative flex flex-col items-center justify-center min-h-[70vh] px-6 py-24 overflow-hidden">
    
    {/* 2. 背景レイヤー：absolute で親要素いっぱいに広げ、z-0 で最背面に */}
    <div className="absolute inset-0 z-0">
      <img
        src="/images/vanitas_adriaen_van_utrecht.jpg"
        /* object-cover と object-center で画面中央を切り取り、不透明度を 20% に */
        className="w-full h-full object-cover object-center opacity-20 grayscale-[30%]"
        alt="" 
        aria-hidden="true" // スクリーンリーダーには無視させる
      />
      {/* 3. 暗くするためのオーバーレイ：背景色とブレンドさせる（透過あり） */}
      <div className={`absolute inset-0 ${darkMode ? 'bg-zinc-950/65' : 'bg-[#f5efe0]/60'}`} />
    </div>

    {/* 4. コンテンツレイヤー：relative z-10 で絵画の前に完璧に重ねる */}
    <div className="relative z-10 flex flex-col items-center justify-center gap-5 text-center">
      <p className={`text-xs tracking-[0.25em] uppercase font-sans ${
        darkMode ? 'text-[#3a3228]' : 'text-stone-300'
  }`}>vanité des vanités</p>
      
      <p className={`font-serif text-base text-center leading-relaxed ${
        darkMode ? 'text-[#6a5840]' : 'text-stone-400'
      }`} style={{ fontFamily: '"EB Garamond", serif' }}>
        目次からテキストを選んでください
      </p>
      
      <button
        onClick={() => setShowToc(true)}
        className={`flex items-center gap-2 px-5 py-2 text-sm font-Shippori Mincho B1 border transition-colors ${
          darkMode
            ? 'border-[#3a3228] text-[#8a7a5a] hover:border-[#8a7a50] hover:text-[#ddd0b3]'
            : 'border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-700'
        }`}
        style={{ borderRadius: '2px', letterSpacing: '0.08em' }}
      >
        <List size={13} strokeWidth={1.6} />
        目次を開く
      </button>
    <div 
  className={`mt-40 text-[9px] opacity-48 ${ // 25 -> 35
    darkMode ? 'text-[#8a7a5a]' : 'text-stone-500' // 金褐色 #8a7a5a を指定
  }`}
  style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.03em' }}
>
  Adriaen van Utrecht, "Stilleven met boeket en schedel", 1642
    </div>
    </div>
  </div>
)}
        {selectedText && (<>
        {/* ─── 現在のテキスト情報 ───────────────────── */}
        <div ref={textInfoRef} className={`rounded-sm border p-5 mb-4 ${cardBgClass}`}>
          <div>
            {/* カテゴリバッジ＋統計を同行に */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${authorColor(currentText.category)}`}>
                {catShort[currentText.category] || currentText.category}
              </span>
              <span className={`text-xs font-IBM Plex sans JP ${textSecondary} opacity-50`}>·</span>
              <span className={`text-xs font-IBM Plex sans JP ${textSecondary} opacity-70`}>
                {currentText.paragraphs.length}段落
              </span>
              <span className={`text-xs font-IBM Plex sans JP ${textSecondary} opacity-50`}>·</span>
              <span className={`text-xs font-IBM Plex sans JP ${textSecondary} opacity-70`}>
                {textWordCount(currentText).toLocaleString()}語
              </span>
              {currentText.annotations?.length > 0 && (
                <>
                  <span className={`text-xs font-IBM Plex sans JP ${textSecondary} opacity-50`}>·</span>
                  <span className={`text-xs font-IBM Plex sans JP ${textSecondary} opacity-70`}>
                    注釈{currentText.annotations.length}
                  </span>
                </>
              )}
            </div>
            <h2 className={`text-xl font-serif ${textClass} mb-1`}>{currentText.title}</h2>
            {/* 神曲 canticle / canto 表示 */}
            {(currentText.canticle || currentText.canto) && (
              <div className="flex items-center gap-2 mb-1">
                {currentText.canticle && (
                  <span className={`text-xs font-IBM Plex sans JP px-2 py-0.5 rounded-full font-medium border ${darkMode ? 'bg-amber-950/40 text-amber-300 border-amber-800/60' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {currentText.canticle}
                  </span>
                )}
                {currentText.canto && (
                  <span className={`text-xs font-IBM Plex sans JP px-2 py-0.5 rounded-full font-medium border ${darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-600' : 'bg-stone-100 text-stone-600 border-stone-300'}`}>
                    Canto {currentText.canto}
                  </span>
                )}
              </div>
            )}
            <p className={`text-sm font-IBM Plex sans JP ${textSecondary}`}>{currentText.author}　{currentText.year}年</p>
            {currentText.source && (
              <p className={`mt-0.5 text-[10px] leading-relaxed font-sans truncate ${darkMode ? 'text-[#5a4a38]' : 'text-[#a08060]/80'}`}
                title={currentText.source}>
                {currentText.source}
              </p>
            )}
          </div>
          {currentText.context && (
            <div className={`mt-3 p-3 rounded-sm text-sm whitespace-pre-line ${darkMode ? 'bg-zinc-800/60 text-zinc-300 border border-zinc-700' : 'bg-[#e8dfc0] text-[#3a2e20] border border-[#c8b480]'}`}>
              {currentText.context}
            </div>
          )}
          {currentText.keywords && currentText.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {currentText.keywords.map(k => (
                <span
                  key={k}
                  className={`text-xs font-sans px-2 py-0.5 rounded border ${
                    darkMode ? 'text-[#8a7a5a] border-[#3a3228]' : 'text-stone-500 border-stone-500'
                  }`}
                >{k}</span>
              ))}
            </div>
          )}

          {/* 対照読解ボタン＋テキスト選択 */}
          {(currentText.relatedTexts?.length > 0 || crossMode) && (
            <div className={`mt-4 pt-4 border-t ${borderClass}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs  ${textSecondary}`}>対照読解</span>
                <button
                  onClick={() => { setCrossMode(v => !v); if (crossMode) setCrossTexts([]); }}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    crossMode
                      ? darkMode ? 'bg-violet-800 text-violet-100 font-IBM Plex sans JP' : 'bg-violet-700 text-white font-IBM Plex sans JP'
                      : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-IBM Plex sans JP' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 font-IBM Plex sans JP'
                  }`}
                >
                  {crossMode ? '✕ 対照ビューを閉じる' : '⇄ 対照読解ビューを開く'}
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
                                ? darkMode ? 'border-zinc-700 text-zinc-600 cursor-not-allowed font-IBM Plex sans JP' : 'border-stone-200 text-stone-300 cursor-not-allowed font-IBM Plex sans JP'
                                : darkMode ? 'border-zinc-700 text-zinc-400 hover:border-violet-600 hover:text-violet-300 font-IBM Plex sans JP' : 'border-stone-300 text-stone-600 hover:border-violet-400 hover:text-violet-700 font-IBM Plex sans JP'
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
          <div className={`rounded-sm border mb-4 overflow-hidden ${cardBgClass}`}>
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
                        <div className={`px-4 py-1.5 text-xs font-mono font-semibold ${darkMode ? 'bg-zinc-800/60 text-zinc-400 font-IBM Plex sans JP' : 'bg-stone-50 text-stone-500 font-IBM Plex sans JP'}`}>
                          § {p.id}
                          <span className={`ml-2 font-IBM Plex sans JP font-normal opacity-60 truncate`}>
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

        {/* ─── 対照読解ビュー ──────────────────────── */}
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
        {!crossMode && <div ref={bodyRef} className={`rounded-sm border p-3 mb-4 flex flex-wrap items-center justify-between gap-3 ${cardBgClass}`}>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-IBM Plex sans JP ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              すべて展開
            </button>
            <button
              onClick={collapseAll}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-IBM Plex sans JP ${darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              すべて折りたたむ
            </button>
            <button
              onClick={() => speakAll(currentText)}
              title={speakingId === 'all' ? '読み上げ停止' : '全文を読み上げる'}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                speakingId === 'all'
                  ? (darkMode ? 'bg-amber-700 text-amber-100 font-IBM Plex sans JP' : 'bg-stone-700 text-white font-IBM Plex sans JP')
                  : darkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-IBM Plex sans JP' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 font-IBM Plex sans JP'
              }`}
            >
              {speakingId === 'all' ? <><IconSquare size={10} strokeWidth={2} fill='currentColor' className='inline mr-1' />停止</> : <><Volume2 size={13} strokeWidth={1.6} className='inline mr-1' />全文</>}
            </button>
          </div>
          <button
            onClick={clearAllTranslations}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${darkMode ? 'bg-rose-900/30 text-rose-400 border border-rose-800 hover:bg-rose-900/50 font-IBM Plex sans JP' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-sans'}`}
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

            // speaker ごとの色（8色ローテーション）
            const speakerColors = [
              { light: 'bg-violet-100 text-violet-800 border-violet-300',  dark: 'bg-violet-900/40 text-violet-200 border-violet-700' },
              { light: 'bg-sky-100 text-sky-800 border-sky-300',           dark: 'bg-sky-900/40 text-sky-200 border-sky-700' },
              { light: 'bg-rose-100 text-rose-800 border-rose-300',        dark: 'bg-rose-900/40 text-rose-200 border-rose-700' },
              { light: 'bg-teal-100 text-teal-800 border-teal-300',        dark: 'bg-teal-900/40 text-teal-200 border-teal-700' },
              { light: 'bg-amber-100 text-amber-800 border-amber-300',     dark: 'bg-amber-900/40 text-amber-200 border-amber-700' },
              { light: 'bg-indigo-100 text-indigo-800 border-indigo-300',  dark: 'bg-indigo-900/40 text-indigo-200 border-indigo-700' },
              { light: 'bg-emerald-100 text-emerald-800 border-emerald-300', dark: 'bg-emerald-900/40 text-emerald-200 border-emerald-700' },
              { light: 'bg-orange-100 text-orange-800 border-orange-300',  dark: 'bg-orange-900/40 text-orange-200 border-orange-700' },
            ];
            // Dante 系の固定カラーマッピング
            const SPEAKER_FIXED_COLORS = {
              'Dante-narratore': { light: 'bg-stone-100 text-stone-600 border-stone-300', dark: 'bg-zinc-800 text-zinc-300 border-zinc-600' },
              'Dante':           { light: 'bg-sky-100 text-sky-800 border-sky-300',       dark: 'bg-sky-900/40 text-sky-200 border-sky-700' },
              'Virgilio':        { light: 'bg-violet-100 text-violet-800 border-violet-300', dark: 'bg-violet-900/40 text-violet-200 border-violet-700' },
            };
            // テキスト内の全発話者リストから一貫した色を割り当て
            const allSpeakers = hasSpeaker
              ? [...new Set(currentText.paragraphs.map(p => p.speaker).filter(Boolean))]
              : [];
            const speakerIndex = hasSpeaker ? allSpeakers.indexOf(para.speaker) : -1;
            const speakerColor = hasSpeaker
              ? (SPEAKER_FIXED_COLORS[para.speaker] ?? speakerColors[speakerIndex % speakerColors.length])
              : speakerColors[0];

            return (
              <React.Fragment key={para.id}>
                {/* ── 段落間フルーロン（通常段落・Scène区切りなし・最初の段落除く） ── */}
                {paraIdx > 0 && !isNewScene && (
                  <div className={`text-center select-none py-0.5 ${
                    darkMode ? 'text-[#3a3228]' : 'text-[#c8b480]'
                  }`} aria-hidden="true" style={{ fontSize: '10px', letterSpacing: '0.4em' }}>
                    ✦
                  </div>
                )}
                {/* ── Scène 区切り行（scene が変わった時のみ） ── */}
                {isNewScene && (
                  <div className={`flex items-center gap-3 px-1 pt-2 pb-1`}>
                    <span className={`text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border ${
                      darkMode
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-600 font-IBM Plex sans JP'
                        : 'bg-[#e8dfc0] text-[#4a3a28] border-[#a08560] font-IBM Plex sans JP'
                    }`}>
                      Scène {para.scene}
                    </span>
                    <div className={`flex-1 h-px ${darkMode ? 'bg-zinc-700' : 'bg-[#c8b480]'}`} />
                  </div>
                )}

              <div
                ref={el => { paragraphRefs.current[para.id] = el; }}
                className={`rounded-sm overflow-hidden transition-all relative ${
                  !isCollapsed ? (darkMode ? 'shadow-md shadow-black/30' : 'shadow-sm shadow-[#c8b480]/40') : ''
                } ${
                  isBookmarkedPara
                    ? darkMode ? 'border border-amber-700/60 bg-zinc-900' : 'border border-[#a08560] bg-[#ede4cc]'
                    : darkMode ? 'border border-zinc-800 bg-zinc-900' : 'border border-[#c8b480] bg-[#ede4cc]'
                }`}
              >
                {/* ブックマーク左ボーダーアクセント */}
                {isBookmarkedPara && (
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-sm ${darkMode ? 'bg-amber-500' : 'bg-[#a08560]'}`} />
                )}
                {/* 段落ヘッダー（折りたたみボタン） */}
                <button
                  onClick={() => toggleParagraph(para.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    isBookmarkedPara
                    ? darkMode ? 'hover:bg-amber-950/30 bg-amber-950/10' : 'hover:bg-[#e0d4b0]/60 bg-[#e0d4b0]/30'
                    : darkMode ? 'hover:bg-zinc-800/60' : 'hover:bg-[#e8dfc0]/50'
                  }`}
                  >
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    {/* ID（セクション番号）：透明度を低くし、背景に溶け込ませる */}
                    <span className={`text-sm font-IBM Plex sans JP w-7 shrink-0 tabular-nums select-none opacity-30 ${textClass}`}>
                      {para.id}
                    </span>

                    {/* verses バッジ：これは構造的な情報（行番号）のため、控えめなテキストのみで残す（または必要なければ削除可） */}
                    {para.verses && (
                    <span className={`text-[10px] font-mono shrink-0 tabular-nums opacity-40 ${textClass}`}>
                      {para.verses}
                    </span>
                  )}
                    {/* 折りたたみ時のプレビュー：バッジ類が消えることで、より文章に目が向くようになります */}
                    {isCollapsed && showFrench && (
                    <span translate="no" className={`notranslate text-sm truncate opacity-60 ${textClass}`}>
                      {getOriginalText(para).split('\n')[0]}
                    </span>
                  )}
    {/* 【削除済み】逐行対訳バッジ（interlinear）の箇所を完全に撤廃しました */}
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
                  <div className={`px-4 pb-4 border-t ${borderClass}`}>

                    {/* ── エピグラフ（Monna Innominata等、ダンテ・ペトラルカ引用） ── */}
                    {para.epigraphs && para.epigraphs.length > 0 && (
                      <div className={`mt-4 mb-3 pl-4 border-l-2 space-y-2 ${darkMode ? 'border-stone-600' : 'border-[#a08560]/60'}`}>
                        {para.epigraphs.map((ep, ei) => (
                          <div key={ei} className="flex flex-col gap-0.5">
                            <p translate="no" className={`notranslate text-sm italic leading-snug font-serif ${darkMode ? 'text-zinc-300' : 'text-stone-600'}`}>
                              {ep.text}
                            </p>
                            {ep.translation && (
                              <p className={`text-xs leading-snug pl-2 ${darkMode ? 'text-teal-400/70' : 'text-teal-700/70'}`}>
                                {ep.translation}
                              </p>
                            )}
                            {(ep.author || ep.source) && (
                              <p className={`text-xs font-IBM Plex sans JP tracking-wide ${darkMode ? 'text-zinc-500' : 'text-stone-400'}`}>
                                — {[ep.author, ep.source].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
 {/* --- 1826行目：表示ロジック開始 --- */}
            {(() => {
                  // 1. データの抽出：getOriginalText/getTranslationで一元化
                  const orig = getOriginalText(para);
                  const translation = getTranslation(para);
                  const hasAnnotations = (currentText?.annotations || []).filter(a => a.paragraphId === para.id).length > 0;
                  const paraAnnotations = (currentText?.annotations || []).filter(a => a.paragraphId === para.id);

                  // 2. デザイン定数
                  const d = darkMode;
                  const oBorder = d ? 'border-amber-900/40' : 'border-[#a08560]';
                  const tBorder = transBorderClass;
                  const oText = d ? 'text-[#ddd0b3]' : 'text-[#1a1208]';
                  const tText = transTextClass;
                  const fS = fontSizeMap[fontSize] || 'text-base';
                  const fST = fontSize === 'xxlarge' ? 'text-xl' : fontSize === 'xlarge' ? 'text-lg' : fontSize === 'large' ? 'text-base' : fontSize === 'medium' ? 'text-sm' : 'text-xs';

                  // データが空の場合は何も表示しない
                  if (!orig && !translation) return null;

                  // 3. モード別のレンダリング
                  if (viewMode === 'vertical') {
                    // --- A. 上下表示 ---
                    const origLines = orig.split('\n');
                    const transLines = translation.split('\n');
                    return (
                      <div className="space-y-4 mb-6">
                        {origLines.map((line, i) => {
                          if (!line.trim() && !transLines[i]?.trim()) return <div key={i} className="h-4" />;
                          return (
                            <div key={i} className="mb-4">
                              {line.trim() && (
                                <span translate="no" className={`notranslate leading-relaxed ${oText} ${fS}`}>
                                  {showAnnotations && hasAnnotations ? renderTextWithAnchors(line, paraAnnotations, para.id) : line}
                                </span>
                              )}
                              {transLines[i]?.trim() && (
                                <div className={`pl-2 mt-1 border-l-2 ${tBorder} ${tText}`}>
                                  <span className={`leading-relaxed ${fST}`}>{transLines[i]}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else if (viewMode === 'side') {
                    // --- B. 左右表示 ---
                    const origLines = orig.split('\n');
                    const transLines = translation.split('\n');
                    return (
                      <div className={`rounded-lg overflow-hidden border mb-8 ${d ? 'border-zinc-800' : 'border-stone-200'}`}>
                        <div className={`grid grid-cols-2 border-b text-[9px] font-sans uppercase tracking-[0.2em] ${d ? 'bg-zinc-900 text-zinc-500 border-zinc-800' : 'bg-stone-50 text-stone-400 border-stone-200'}`}>
                          <div className="px-3 py-1 border-r border-inherit text-center">Original</div>
                          <div className="px-3 py-1 text-center">Traduction</div>
                        </div>
                        {origLines.map((line, i) => (
                          <div key={i} className={`grid grid-cols-2 border-b last:border-b-0 ${d ? 'border-zinc-800' : 'border-stone-100'}`}>
                            <div className={`px-3 py-2 border-r ${d ? 'border-zinc-800' : 'border-stone-100'} ${oText}`}>
                              <span translate="no" className={`notranslate leading-relaxed ${fS}`}>
                                {line.trim() ? (showAnnotations && hasAnnotations ? renderTextWithAnchors(line, paraAnnotations, para.id) : line) : ''}
                              </span>
                            </div>
                            <div className={`px-3 py-2 ${tText}`}>
                              <span className={`leading-relaxed ${fST}`}>{transLines[i] || ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // --- C. 標準表示 ---
                    return (
                      <div className="mb-6">
                        {showFrench && orig && (
                          <div className="pt-3 mb-4">
                            {para.speaker && (
                              <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border mb-2 inline-block ${d ? speakerColor.dark : speakerColor.light}`}>
                                {para.speaker.toUpperCase()}
                              </span>
                            )}
                            <p translate="no" className={`notranslate leading-relaxed whitespace-pre-line pt-1 ${oText} ${fS}`}>
                              {showAnnotations && hasAnnotations ? renderTextWithAnchors(orig, paraAnnotations, para.id) : orig}
                            </p>
                          </div>
                        )}
                        {showOfficial && translation && (
                          <div className={`mt-4 pt-4 border-t ${d ? 'border-zinc-800/50' : 'border-[#c8b480]/60'}`}>
                            <p className={`leading-relaxed whitespace-pre-line ${tText} ${fST}`}>
                              {translation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  }
                })()}

                    {/* 注釈パネル */}
                    {showAnnotations && hasAnnotations && (
                      <div className={`mb-3 rounded-sm border ${darkMode ? 'border-amber-900/50 bg-amber-950/20' : 'border-[#a08560]/50 bg-[#e8dfc0]/60'}`}>
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

                    {/* 自分の訳 */}
                    {showUser && (
                      <div className={`border-l-2 pl-4 ${darkMode ? "border-violet-600/50" : "border-violet-300"}`}>
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
                                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${darkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 font-IBM Plex sans JP' : 'bg-stone-100 text-stone-700 hover:bg-stone-200 font-IBM Plex sans JP'}`}
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
        </>)}

        {/* フッター */}
        <div className={`text-center text-[10px] font-IBM Plex sans JP ${textSecondary} pb-8 space-y-1`}>
          <p>{Object.keys(texts).length}編収録</p>
          <p>掲載の日本語訳は学習補助の為の試訳であり、確定した翻訳ではありません</p>
        </div>
      </div>

      {/* フローティングTOPボタン */}
      {showScrollTop && (
  <button
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    className={`fixed bottom-8 right-8 w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all duration-300
      ${darkMode ? 'bg-zinc-800 text-amber-200' : 'bg-white text-stone-800'}`}
  >
    <ChevronUp size={24} />
  </button>
)}
    </div>
  );
}
// ─── 目次ドロワー ───────────────────────────────────────────
const TocDrawer = ({
  showToc,
  setShowToc,
  darkMode,
  texts,
  currentText,
  tocSearch,
  setTocSearch,
  tocLangFilter,
  setTocLangFilter,
  tocOpenAuthors,
  setTocOpenAuthors,
  handleTextChange
}) => {
    const langMap = { 'fr': 'fr-FR', 'de': 'de-DE', 'en': 'en-GB', 'it': 'it-IT', 'ru': 'ru-RU' };

    // ── フィルタリング（言語 + 検索：タイトル/作家/年/本文） ──────────
    const allTextsArr = Object.values(texts);
    const filtered = allTextsArr.filter(t => {
      if (tocLangFilter !== 'all' && t.originalLang !== langMap[tocLangFilter]) return false;
      if (!tocSearch.trim()) return true;
      const q = tocSearch.toLowerCase();
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

    // ── スニペット抽出 ──────────────────────────────────────────────
    const getSnippet = (t) => {
      if (!tocSearch.trim()) return null;
      const q = tocSearch.toLowerCase();
      for (const p of (t.paragraphs || [])) {
        const orig  = getOriginalText(p).toLowerCase();
        const trans = getTranslation(p).toLowerCase();
        const src   = orig.includes(q) ? getOriginalText(p) : trans.includes(q) ? getTranslation(p) : null;
        if (!src) continue;
        const idx = src.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 20);
        const end   = Math.min(src.length, idx + q.length + 20);
        return {
          pre:   (start > 0 ? '…' : '') + src.slice(start, idx),
          match: src.slice(idx, idx + q.length),
          post:  src.slice(idx + q.length, end) + (end < src.length ? '…' : ''),
        };
      }
      return null;
    };

    // ── 作家グループ化 ──────────────────────────────────────────────
    const groups = {};
    filtered.forEach(t => {
      const key = t.author || '—';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    const sortedAuthors = Object.keys(groups).sort((a, b) => {
      const la = /^[A-Za-z]/.test(a), lb = /^[A-Za-z]/.test(b);
      if (la && !lb) return -1;
      if (!la && lb) return 1;
      return a.localeCompare(b);
    });

    const toggleAuthor = (key) =>
      setTocOpenAuthors(prev => ({ ...prev, [key]: !prev[key] }));

    const isSearching = !!tocSearch.trim();

    // ── ダーク／ライト切替スタイル ─────────────────────────────────
    const d = darkMode;
    const tocBg        = d ? 'bg-[#0f0d09]'     : 'bg-[#f5efe0]';
    const tocBorder    = d ? 'border-[#2e2a20]'  : 'border-[#c8b480]';
    const tocHeaderBg  = d ? 'bg-[#0f0d09]'     : 'bg-[#f0e8d0]';
    const tocText      = d ? 'text-[#ddd0b3]'    : 'text-[#1a1208]';
    const tocSub       = d ? 'text-[#8a7a5a]'    : 'text-[#6b5a3a]';
    const tocDim       = d ? 'text-[#5a4a38]'    : 'text-[#a08560]';
    const tocDimBorder = d ? 'border-[#2e2a20]'  : 'border-[#c8b480]';
    const tocSearchBg  = d ? 'bg-[#131008]'      : 'bg-[#ede4cc]';
    const tocHoverBg   = d ? 'hover:bg-[#181510]' : 'hover:bg-[#e8dfc0]';
    const tocItemBorder= d ? 'border-[#221d14]'  : 'border-[#d4c090]';
    const tocItemHover = d ? 'hover:bg-[#1a1810]' : 'hover:bg-[#e8dfc0]';
    const tocActiveBg  = d ? 'bg-[#1e1b13]'      : 'bg-[#e0d4a8]';
    const tocActiveBdr = d ? 'border-[#a08560]'  : 'border-[#a08560]';
    const tocChipAct   = d ? 'bg-[#3a3018] text-[#ddd0b3] border-[#8a7a50]'
                           : 'bg-amber-100 text-amber-900 border-amber-400';
    const tocChipInact = d ? `${tocDim} border-[#2e2a20] hover:text-[#a08560] hover:border-[#3a3228]`
                           : 'text-stone-400 border-stone-200 hover:text-stone-600 hover:border-stone-400';
    const tocSnipText  = d ? 'text-[#6a5840]'    : 'text-[#6b5a3a]';
    const tocMarkBg    = d ? 'bg-[#4a3a18] text-[#ddd0b3]' : 'bg-[#d4b870] text-[#1a1208]';
    const tocOrnament  = d ? 'text-[#2e2a20]'    : 'text-[#c8b480]';
    const tocHoverAuth = d ? 'group-hover:text-[#b8a880]' : 'group-hover:text-stone-700';
    const tocFooterBg  = d ? '' : 'bg-[#f0e8d0]';

    return (
      <>
        {/* ── オーバーレイ ── */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowToc(false)}
        />

        {/* ── ドロワー本体 ── */}
        <div
          className={`fixed top-0 left-0 h-full z-50 flex flex-col shadow-2xl
            transition-transform duration-300 ease-in-out
            ${showToc ? 'translate-x-0' : '-translate-x-full'}
            ${tocBg} border-r ${tocBorder}`}
          style={{ width: '340px', fontFamily: '"EB Garamond", "Shippori Mincho B1", serif' }}
        >
          {/* ── ヘッダー ── */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${tocBorder} shrink-0 ${tocHeaderBg}`}>
            <span className={`text-xs tracking-[0.2em] uppercase font-Shippori Mincho B1 ${tocDim}`}>目次</span>
            <button
              onClick={() => setShowToc(false)}
              className={`w-6 h-6 flex items-center justify-center ${tocSub} hover:opacity-70 transition-opacity`}
            >
              <X size={12} strokeWidth={1.8} />
            </button>
          </div>

          {/* ── 検索 ── */}
          <div className={`px-3 pt-3 pb-2 border-b ${tocBorder} shrink-0`}>
            <div className={`flex items-center gap-2 border ${tocDimBorder} rounded px-2.5 py-1.5 ${tocSearchBg}`}>
              <Search size={12} strokeWidth={1.6} className={tocDim} />
              <input
                type="text"
                value={tocSearch}
                onChange={e => setTocSearch(e.target.value)}
                placeholder="作家・題名・年・本文…"
                className={`flex-1 bg-transparent text-sm font-Shippori Mincho B1 outline-none ${tocSub}
                ${d ? 'placeholder-[#8a7a5a]/70' : 'placeholder-stone-400'}
                `}
                style={{ caretColor: d ? '#ddd0b3' : '#1c1917' }}
              />
              {tocSearch && (
                <button onClick={() => setTocSearch('')} className={`${tocDim} hover:opacity-70`}>
                  <X size={10} strokeWidth={2} />
                </button>
              )}
            </div>
            {isSearching && (
              <p className={`mt-1.5 text-[10px] font-sans ${tocDim} px-0.5`}>
                本文・訳文も検索対象 — {filtered.length} 件
              </p>
            )}
          </div>

          {/* ── 言語フィルター ── */}
          <div className={`px-3 py-2 border-b ${tocBorder} flex gap-1.5 shrink-0`}>
            {[
              { key: 'all', label: '全' },
              { key: 'fr',  label: 'fr' },
              { key: 'de',  label: 'de' },
              { key: 'en',  label: 'en' },
              { key: 'it',  label: 'it' },
              { key: 'ru',  label: 'ru' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTocLangFilter(key)}
                className={`px-2.5 py-0.5 text-xs font-sans rounded transition-colors border ${
                  tocLangFilter === key ? tocChipAct : tocChipInact
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── テキスト一覧 ── */}
          <div className="flex-1 overflow-y-auto">
            {sortedAuthors.length === 0 ? (
              <p className={`px-4 py-6 text-sm font-sans ${tocDim}`}>
                {tocSearch ? `「${tocSearch}」に一致しません` : 'テキストがありません'}
              </p>
            ) : (
              sortedAuthors.map(author => {
                const isOpen = tocOpenAuthors[author] !== false;
                const authorTexts = groups[author];
                return (
                  <div key={author}>
                    {/* ③ 作家名ヘッダー：▾/▸ トグルのみでなく行全体をトグル */}
                    <button
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left border-b ${tocBorder} ${tocHoverBg} transition-colors group`}
                      onClick={() => toggleAuthor(author)}
                    >
                      <span className={`text-base italic ${tocSub} ${tocHoverAuth} transition-colors`}>
                        {author}
                      </span>
                      <span className="flex items-center gap-1 ml-2 shrink-0">
                        <span className={`font-sans text-[10px] ${tocDim} opacity-60`}>{authorTexts.length}</span>
                        <span className={tocDim} style={{ fontSize: '10px' }}>{isOpen ? '▾' : '▸'}</span>
                      </span>
                    </button>

                    {/* 作品リスト */}
                    {isOpen && (
                      <div>
                        {authorTexts.map(t => {
                          const isSelected = currentText?.id === t.id;
                          const snip = isSearching ? getSnippet(t) : null;
                          return (
                            // タイトル文字のみクリック可能・外枠はpointer-events-none
                            <div
                              key={t.id}
                              className={`pl-6 pr-3 py-1.5 border-b ${tocItemBorder} ${
                                isSelected
                                  ? `${tocActiveBg} border-l-2 ${tocActiveBdr}`
                                  : ''
                              }`}
                              style={{ userSelect: 'none' }}
                            >
                              <div className="flex items-baseline gap-2 w-full" style={{ pointerEvents: 'none' }}>
                                {/* タイトル部分だけ pointer-events を戻す */}
                                <span
                                  className={`text-base leading-snug text-left flex-1 min-w-0 transition-colors cursor-pointer ${
                                    isSelected ? tocText : tocSub
                                  } ${!isSelected ? (d ? 'hover:text-[#ddd0b3]' : 'hover:text-stone-800') : ''}`}
                                  style={{ pointerEvents: 'auto' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTextChange(t.id);
                                    setShowToc(false);
                                  }}
                                >
                                  {t.title}
                                </span>
                                <span className={`text-[10px] font-Alice shrink-0 ml-auto tabular-nums ${tocDim}`}>
                                  {t.year}
                                </span>
                              </div>
                              {/* 本文スニペット（検索ヒット時・クリック不可） */}
                              {snip && (
                                <p className={`text-xs font-sans leading-relaxed ${tocSnipText} pl-0.5 mt-0.5 select-text`} style={{ pointerEvents: 'none' }}>
                                  {snip.pre}
                                  <mark className={`${tocMarkBg} px-0.5 rounded-sm not-italic`}>
                                    {snip.match}
                                  </mark>
                                  {snip.post}
                                </p>
                              )}
                            </div>
                          );
                        })}
                        <div className={`text-center py-1.5 ${tocOrnament} text-xs tracking-[0.4em] select-none`}>
                          · · ·
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── フッター ── */}
          <div className={`px-4 py-2 border-t ${tocBorder} shrink-0 flex items-center justify-between ${tocFooterBg}`}>
            <span className={`text-[10px] font-sans ${tocDim}`}>
              {filtered.length} / {Object.keys(texts).length} テキスト
            </span>
            <button
              onClick={() => { setTocSearch(''); setTocLangFilter('all'); }}
              className={`text-[10px] font-sans ${tocDim} ${d ? 'hover:text-[#8a7a5a]' : 'hover:text-stone-600'} transition-colors`}
            >
              リセット
            </button>
          </div>
        </div>
      </>
    );
  };
