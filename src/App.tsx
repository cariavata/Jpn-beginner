/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, FC } from 'react';
import { INITIAL_GREETINGS_DATA, INITIAL_TRAVEL_DATA, INITIAL_DAILY_DATA } from './initialData';
import { Volume2, Plane, Home, MessageSquare, Info, Music, Music2, Pencil, Trash2, Plus, X, Lock, Settings, BarChart2, Monitor, Smartphone, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { NewsSection } from './NewsSection';

// --- Data Section ---

interface CharItem {
  jp: string;
  ko: string;
}

type CharData = (CharItem | null)[];

const INITIAL_HIRAGANA_DATA: CharData = [
  { jp: 'あ', ko: '아' }, { jp: 'い', ko: '이' }, { jp: 'う', ko: '우' }, { jp: 'え', ko: '에' }, { jp: 'お', ko: '오' },
  { jp: 'か', ko: '카' }, { jp: 'き', ko: '키' }, { jp: 'く', ko: '쿠' }, { jp: 'け', ko: '케' }, { jp: 'こ', ko: '코' },
  { jp: 'さ', ko: '사' }, { jp: 'し', ko: '시' }, { jp: 'す', ko: '스' }, { jp: 'せ', ko: '세' }, { jp: 'そ', ko: '소' },
  { jp: 'た', ko: '타' }, { jp: 'ち', ko: '치' }, { jp: 'つ', ko: '츠' }, { jp: 'て', ko: '테' }, { jp: 'と', ko: '토' },
  { jp: 'な', ko: '나' }, { jp: 'に', ko: '니' }, { jp: 'ぬ', ko: '누' }, { jp: 'ね', ko: '네' }, { jp: 'の', ko: '노' },
  { jp: 'は', ko: '하' }, { jp: 'ひ', ko: '히' }, { jp: 'ふ', ko: '후' }, { jp: 'へ', ko: '헤' }, { jp: 'ほ', ko: '호' },
  { jp: 'ま', ko: '마' }, { jp: 'み', ko: '미' }, { jp: 'む', ko: '무' }, { jp: 'め', ko: '메' }, { jp: 'も', ko: '모' },
  { jp: 'や', ko: '야' }, null, { jp: 'ゆ', ko: '유' }, null, { jp: 'よ', ko: '요' },
  { jp: 'ら', ko: '라' }, { jp: 'り', ko: '리' }, { jp: 'る', ko: '루' }, { jp: 'れ', ko: '레' }, { jp: 'ろ', ko: '로' },
  { jp: 'わ', ko: '와' }, null, null, null, { jp: 'を', ko: '오(조사)' },
  { jp: 'ん', ko: '응' }, null, null, null, null
];

const INITIAL_KATAKANA_DATA: CharData = [
  { jp: 'ア', ko: '아' }, { jp: 'イ', ko: '이' }, { jp: 'ウ', ko: '우' }, { jp: 'エ', ko: '에' }, { jp: 'オ', ko: '오' },
  { jp: 'カ', ko: '카' }, { jp: 'キ', ko: '키' }, { jp: 'ク', ko: '쿠' }, { jp: 'ケ', ko: '케' }, { jp: 'コ', ko: '코' },
  { jp: 'サ', ko: '사' }, { jp: 'シ', ko: '시' }, { jp: 'ス', ko: '스' }, { jp: 'セ', ko: '세' }, { jp: 'ソ', ko: '소' },
  { jp: 'タ', ko: '타' }, { jp: 'チ', ko: '치' }, { jp: 'ツ', ko: '츠' }, { jp: 'テ', ko: '테' }, { jp: 'ト', ko: '토' },
  { jp: 'ナ', ko: '나' }, { jp: 'ニ', ko: '니' }, { jp: 'ヌ', ko: '누' }, { jp: 'ネ', ko: '네' }, { jp: 'ノ', ko: '노' },
  { jp: 'ハ', ko: '하' }, { jp: 'ヒ', ko: '히' }, { jp: 'フ', ko: '후' }, { jp: 'ヘ', ko: '헤' }, { jp: 'ホ', ko: '호' },
  { jp: 'マ', ko: '마' }, { jp: 'ミ', ko: '미' }, { jp: 'ム', ko: '무' }, { jp: 'メ', ko: '메' }, { jp: 'モ', ko: '모' },
  { jp: 'ヤ', ko: '야' }, null, { jp: 'ユ', ko: '유' }, null, { jp: 'ヨ', ko: '요' },
  { jp: 'ラ', ko: '라' }, { jp: 'リ', ko: '리' }, { jp: 'ル', ko: '루' }, { jp: 'レ', ko: '레' }, { jp: 'ロ', ko: '로' },
  { jp: 'ワ', ko: '와' }, null, null, null, { jp: 'ヲ', ko: '오(조사)' },
  { jp: 'ン', ko: '응' }, null, null, null, null
];

interface SentenceItem {
  jp: string;
  ko: string;
  mean: string;
}

interface NewsPost {
  id?: string;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt: number;
}







const fadeAudio = (audio: HTMLAudioElement, targetVolume: number, duration: number = 300) => {
  let startVolume = audio.volume;
  // If target is the same, do nothing
  if (startVolume === targetVolume) return;
  // Ensure we do not start fading if it is paused or 0 (unless we are fading in)
  
  const change = targetVolume - startVolume;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    audio.volume = Math.max(0, Math.min(1, startVolume + change * progress));
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

export default function App() {
  const [activeTab, setActiveTabState] = useState('letters');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    // History manipulation for back button
    window.history.replaceState({ isRoot: true }, '');
    window.history.pushState({ tab: activeTabRef.current }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.isRoot) {
        setShowExitConfirm(true);
        window.history.pushState({ tab: activeTabRef.current }, '');
      } else if (e.state && e.state.tab) {
        setActiveTabState(e.state.tab);
        setShowExitConfirm(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveTab = (newTab: string) => {
    if (newTab !== activeTab) {
      window.history.pushState({ tab: newTab }, '');
      setActiveTabState(newTab);
    }
  };

  const handleExitConfirmYes = () => {
    window.history.go(-2); // Try to go back fully
    setShowExitConfirm(false);
  };

  const handleExitConfirmNo = () => {
    setShowExitConfirm(false);
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPwd, setAdminPwd] = useState('');
  
  const [greetingsData, setGreetingsData] = useState<SentenceItem[]>(() => {
    const saved = localStorage.getItem('greetingsData');
    return saved ? JSON.parse(saved) : INITIAL_GREETINGS_DATA;
  });
  const [travelData, setTravelData] = useState<SentenceItem[]>(() => {
    const saved = localStorage.getItem('travelData');
    return saved ? JSON.parse(saved) : INITIAL_TRAVEL_DATA;
  });
  const [dailyData, setDailyData] = useState<SentenceItem[]>(() => {
    const saved = localStorage.getItem('dailyData');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_DATA;
  });
  
  const [hiraganaData, setHiraganaData] = useState<CharData>(() => {
    const saved = localStorage.getItem('hiraganaData');
    return saved ? JSON.parse(saved) : INITIAL_HIRAGANA_DATA;
  });
  
  const [katakanaData, setKatakanaData] = useState<CharData>(() => {
    const saved = localStorage.getItem('katakanaData');
    return saved ? JSON.parse(saved) : INITIAL_KATAKANA_DATA;
  });

  const [editingItem, setEditingItem] = useState<{tab: string, index: number, item: SentenceItem} | null>(null);
  const [editingLetter, setEditingLetter] = useState<{type: 'hiragana' | 'katakana', index: number, item: CharItem} | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const [siteTitle, setSiteTitle] = useState(() => localStorage.getItem('siteTitle') || '처음 만나는 일본어 🌸');
  const [siteSubtitle, setSiteSubtitle] = useState(() => localStorage.getItem('siteSubtitle') || '왕초보를 위한 가장 쉽고 재미있는 일본어 놀이터');
  const [tabLetterLabel, setTabLetterLabel] = useState(() => localStorage.getItem('tabLetterLabel') || '문자 마스터');
  const [tabGreetingLabel, setTabGreetingLabel] = useState(() => localStorage.getItem('tabGreetingLabel') || '🙏 필수 인사말');
  const [tabTravelLabel, setTabTravelLabel] = useState(() => localStorage.getItem('tabTravelLabel') || '✈️ 여행 회화');
  const [tabDailyLabel, setTabDailyLabel] = useState(() => localStorage.getItem('tabDailyLabel') || '🏠 생활 표현');
  const [tabNewsLabel, setTabNewsLabel] = useState(() => localStorage.getItem('tabNewsLabel') || '📰 일본 소식');
  const [footerText, setFooterText] = useState(() => localStorage.getItem('footerText') || '© 2026 처음 만나는 일본어. 실전 일본어 학습기');
  const [naverMeta, setNaverMeta] = useState(() => localStorage.getItem('naverMeta') || '');
  const [seoData, setSeoData] = useState(() => {
    const saved = localStorage.getItem('seoData');
    return saved ? JSON.parse(saved) : { robotsTxt: 'User-agent: *\nAllow: /', sitemapXml: '', rssXml: '', adsTxt: '' };
  });

  useEffect(() => {
    localStorage.setItem('seoData', JSON.stringify(seoData));
    const saveSeoToFirebase = async () => {
      try {
        await setDoc(doc(db, 'settings', 'seo'), seoData);
      } catch (error) {
        // silently fail for non admins if they trigger it
      }
    };
    saveSeoToFirebase();
  }, [seoData]);

  const handleSeoSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'seo'), seoData);
      alert('SEO 설정이 반영되었습니다.');
    } catch(err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/seo');
      alert('저장에 실패했습니다.');
    }
  };
  const [popupInfo, setPopupInfo] = useState(() => {
    const saved = localStorage.getItem('popupInfo');
    return saved ? JSON.parse(saved) : { active: false, content: '새로운 공지사항입니다.', image: '' };
  });


  const [dataLoaded, setDataLoaded] = useState(true);

  
  // Analytics Stats State
  const [statsPeriod, setStatsPeriod] = useState<'day'|'week'|'month'|'year'>('day');
  const [siteStats, setSiteStats] = useState<any>({});

  // AdSense push
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e: any) {
      if (e?.message?.includes("already have ads")) return;
      console.error("AdSense error:", e);
    }
  }, []);

  // Fetch / Init Data and Stats
  useEffect(() => {
    // 1. Fetch App Data
    const unsubApp = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.greetingsData !== undefined) setGreetingsData(data.greetingsData ?? INITIAL_GREETINGS_DATA);
        if (data.travelData !== undefined) setTravelData(data.travelData ?? INITIAL_TRAVEL_DATA);
        if (data.dailyData !== undefined) setDailyData(data.dailyData ?? INITIAL_DAILY_DATA);
        if (data.hiraganaData !== undefined) setHiraganaData(data.hiraganaData ?? []);
        if (data.katakanaData !== undefined) setKatakanaData(data.katakanaData ?? []);
        if (data.siteTitle !== undefined) setSiteTitle(data.siteTitle ?? '');
        if (data.siteSubtitle !== undefined) setSiteSubtitle(data.siteSubtitle ?? '');
        if (data.tabLetterLabel !== undefined) setTabLetterLabel(data.tabLetterLabel ?? '');
        if (data.tabGreetingLabel !== undefined) setTabGreetingLabel(data.tabGreetingLabel ?? '');
        if (data.tabTravelLabel !== undefined) setTabTravelLabel(data.tabTravelLabel ?? '');
        if (data.tabDailyLabel !== undefined) setTabDailyLabel(data.tabDailyLabel ?? '');
        if (data.tabNewsLabel !== undefined) setTabNewsLabel(data.tabNewsLabel ?? '');
        if (data.footerText !== undefined) setFooterText(data.footerText ?? '');
        if (data.naverMeta !== undefined) setNaverMeta(data.naverMeta ?? '');
        if (data.popupInfo !== undefined) setPopupInfo(data.popupInfo ?? {show: false, content: ''});
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/app'));

    // 2. Fetch SEO Data
    const unsubSeo = onSnapshot(doc(db, 'settings', 'seo'), (docSnap) => {
      if (docSnap.exists()) {
        setSeoData(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/seo'));

    // 3. Stats Tracking
    const today = new Date().toISOString().split('T')[0];
    
    if (!sessionStorage.getItem('visited_today')) {
      sessionStorage.setItem('visited_today', 'true');
      
      const ref = document.referrer;
      let refKey = '기타/직접입력';
      if (ref.includes('naver.com')) refKey = '네이버';
      else if (ref.includes('google.com') || ref.includes('google.co.kr')) refKey = '구글';
      else if (ref.includes('daum.net') || ref.includes('kakao.com')) refKey = '다음/카카오';
      
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q') || urlParams.get('query') || urlParams.get('keyword');

      const ua = navigator.userAgent;
      let device = 'PC/Desktop';
      if (/Mobi|Android/i.test(ua)) device = 'Tablet/Mobile';

      let browser = '기타';
      if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('Whale')) browser = 'Chrome';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('Whale')) browser = 'Naver Whale';
      else if (ua.includes('Edg')) browser = 'Edge';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      
      const statDocRef = doc(db, 'stats', today);
      import('firebase/firestore').then(({ setDoc, increment }) => {
         const updates: any = {
            visitors: increment(1),
            referrers: { [refKey]: increment(1) },
            devices: { [device]: increment(1) },
            browsers: { [browser]: increment(1) }
         };
         if (query) {
            updates.keywords = { [query]: increment(1) };
         }
         setDoc(statDocRef, updates, { merge: true }).catch(err => {
            // Silently fail for tracking
         });
      });
    }

    // load all stats
    // We only load stats if the user wants them, but since we update state, I'll load them all for display
    /*
      Firestore loading multiple stats docs can be done via fetching collection('stats') later,
      but for now we'll do it if admin login happens or just do it here. 
    */

    return () => {
      unsubApp();
      unsubSeo();
    };
  }, []);

  // Naver Meta Hook
  useEffect(() => {
    localStorage.setItem('naverMeta', naverMeta);
    
    // 이전에 추가된 메타 태그가 있다면 제거
    let meta = document.querySelector('meta[name="naver-site-verification"]');
    if (meta) {
        meta.remove();
    }
    
    if (naverMeta) {
      if (naverMeta.trim().startsWith('<meta')) {
        // 사용자가 메타 태그 전체를 입력한 경우
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = naverMeta;
        const metaElement = tempDiv.querySelector('meta');
        if (metaElement) {
          document.head.appendChild(metaElement);
        }
      } else {
        // 사용자가 content 값만 입력한 경우
        meta = document.createElement('meta');
        meta.setAttribute('name', 'naver-site-verification');
        meta.setAttribute('content', naverMeta);
        document.head.appendChild(meta);
      }
    }
  }, [naverMeta]);

    
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [closedPopup, setClosedPopup] = useState(false);

  useEffect(() => { localStorage.setItem('siteTitle', siteTitle); }, [siteTitle]);
  useEffect(() => { localStorage.setItem('siteSubtitle', siteSubtitle); }, [siteSubtitle]);
  useEffect(() => { localStorage.setItem('tabLetterLabel', tabLetterLabel); }, [tabLetterLabel]);
  useEffect(() => { localStorage.setItem('tabGreetingLabel', tabGreetingLabel); }, [tabGreetingLabel]);
  useEffect(() => { localStorage.setItem('tabTravelLabel', tabTravelLabel); }, [tabTravelLabel]);
  useEffect(() => { localStorage.setItem('tabDailyLabel', tabDailyLabel); }, [tabDailyLabel]);
  useEffect(() => { localStorage.setItem('tabNewsLabel', tabNewsLabel); }, [tabNewsLabel]);
  useEffect(() => { localStorage.setItem('footerText', footerText); }, [footerText]);
  useEffect(() => { localStorage.setItem('popupInfo', JSON.stringify(popupInfo)); }, [popupInfo]);

  useEffect(() => { localStorage.setItem('greetingsData', JSON.stringify(greetingsData)); }, [greetingsData]);
  useEffect(() => { localStorage.setItem('travelData', JSON.stringify(travelData)); }, [travelData]);
  useEffect(() => { localStorage.setItem('dailyData', JSON.stringify(dailyData)); }, [dailyData]);
  useEffect(() => { localStorage.setItem('hiraganaData', JSON.stringify(hiraganaData)); }, [hiraganaData]);
  useEffect(() => { localStorage.setItem('katakanaData', JSON.stringify(katakanaData)); }, [katakanaData]);
  useEffect(() => { setSelectedItems([]); }, [activeTab]);

  const [letterType, setLetterType] = useState<'hiragana' | 'katakana'>('hiragana');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReady, setIsReady] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsReady(true);
    
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        voicesRef.current = v;
      }
    };
    
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    
    // Some mobile browsers need a retry
    const interval = setInterval(() => {
      if (voicesRef.current.length === 0) {
        updateVoices();
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearInterval(interval);
    };
  }, []);

  const speakText = useCallback((text: string) => {
    const playAudioFallback = (text: string) => {
      if (!ttsAudioRef.current) return;
      const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=ja&q=${encodeURIComponent(text)}`;
      
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current.src = url;
      
      ttsAudioRef.current.play().catch(err => {
        console.error("Fallback TTS audio blocked by browser:", err);
      });
    };

    const isMobileInAppOrNoTTS = typeof window === 'undefined' || !('speechSynthesis' in window) || /KAKAOTALK|NAVER|Line|Instagram|FBAN|FBAV/i.test(navigator.userAgent);

    if (isMobileInAppOrNoTTS) {
      playAudioFallback(text);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      
      const jaVoice = voicesRef.current.find(voice => 
        voice.lang === 'ja-JP' || voice.lang === 'ja_JP' || voice.lang.includes('ja')
      );
      
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      
      utterance.onerror = (e) => {
        console.error("TTS Error:", e);
        playAudioFallback(text);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS Error:", err);
      playAudioFallback(text);
    }
  }, []);

  const handleAdminLogin = async () => {
    if (adminId === 'cariavata' && adminPwd === 'dudwls3098!!') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminId('');
      setAdminPwd('');
      // Load all stats when admin logs in
      import('firebase/firestore').then(({ collection, getDocs }) => {
        getDocs(collection(db, 'stats')).then(snapshot => {
           let allStats: any = {};
           snapshot.forEach(doc => { allStats[doc.id] = doc.data(); });
           setSiteStats(allStats);
        }).catch(err => handleFirestoreError(err, OperationType.LIST, 'stats'));
      });
    } else {
      alert('아이디 또는 비밀번호가 틀렸습니다.');
    }
  };

  const handleSaveAll = async () => {
    try {
      const appData = {
        greetingsData,
        travelData,
        dailyData,
        hiraganaData,
        katakanaData,
        siteTitle,
        siteSubtitle,
        tabLetterLabel,
        tabGreetingLabel,
        tabTravelLabel,
        tabDailyLabel,
        tabNewsLabel,
        footerText,
        naverMeta,
        popupInfo
      };
      
      // Clean undefined values to prevent Firebase setDoc throws
      const cleanAppData = JSON.parse(JSON.stringify(appData));
      
      await setDoc(doc(db, 'settings', 'app'), cleanAppData);
      await setDoc(doc(db, 'settings', 'seo'), seoData);
      alert('모든 설정이 서버에 성공적으로 저장되었습니다!\n(다른 브라우저에서도 유지됩니다.)');
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다: ' + (e instanceof Error ? e.message : String(e)));
      try { handleFirestoreError(e, OperationType.WRITE, 'settings/app'); } catch(err) {}
    }
  };

  if (!isReady) {
    return <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center font-bold text-rose-400">학습장 준비 중...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#333] font-sans selection:bg-rose-200">
      {/* TTS Audio Fallback */}
      <audio ref={ttsAudioRef} className="hidden" preload="none" />

      {/* Global Layer Popup */}
      {popupInfo.active && !closedPopup && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white shadow-2xl rounded-2xl p-6 z-[200] border-2 border-[#FF9B9B] transform transition-all animate-bounce-slight">
          <button onClick={() => setClosedPopup(true)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800"><X size={20}/></button>
          <div className="flex items-center gap-2 mb-3 text-[#FF6B6B] font-black text-lg">
            <Info size={20}/>
            <span>Notice</span>
          </div>
          {popupInfo.image && <img src={popupInfo.image} className="w-full mb-3 rounded-lg object-contain border border-gray-100" />}
          <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-wrap text-sm">{popupInfo.content}</p>
        </div>
      )}

      {/* Exit Confirm Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <h2 className="text-xl font-bold text-gray-800 mb-2">홈페이지 종료</h2>
              <p className="text-gray-500 mb-6 font-medium text-sm">정말 종료하시겠습니까?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleExitConfirmNo} className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors w-full">아니오</button>
                <button onClick={handleExitConfirmYes} className="px-6 py-2.5 rounded-xl bg-[#FF6B6B] text-white font-bold hover:bg-[#FF5252] transition-colors w-full shadow-md">네</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-[#FF9B9B] text-white p-6 shadow-md border-b-4 border-[#FF6B6B]/10 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[5rem] gap-4 relative z-10">
          <button onClick={() => setActiveTab('letters')} className="text-center md:absolute md:left-1/2 md:-translate-x-1/2 cursor-pointer hover:opacity-90 transition-opacity">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight m-0">{siteTitle}</h1>
            <p className="text-pink-100 mt-2 text-base md:text-lg">{siteSubtitle}</p>
          </button>
          
          <div className="flex items-center gap-3 w-full justify-center md:w-auto md:justify-end md:ml-auto">
              {isAdmin ? (
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setShowAdminDashboard(true)}
                     className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-xl transition-all border-2 bg-indigo-500 text-white border-indigo-600 font-bold hover:bg-indigo-400 shadow-sm"
                   >
                     <Settings size={16} />
                     <span className="text-xs md:text-sm font-bold tracking-wider hidden md:inline">설정 및 통계</span>
                   </button>
                   <button 
                     onClick={() => setIsAdmin(false)}
                     className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-xl transition-all border-2 bg-yellow-400 text-yellow-900 border-yellow-500 font-bold hover:bg-yellow-300 shadow-sm"
                   >
                     <span className="text-xs md:text-sm font-bold tracking-wider">관리자 종료</span>
                   </button>
                 </div>
              ) : (
                 <button 
                   onClick={() => setShowAdminLogin(true)}
                   className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-2 bg-white/20 text-white border-white/30 hover:bg-white/30"
                 >
                   <Lock size={16} />
                   <span className="text-sm font-bold tracking-wider hidden md:inline">관리자</span>
                 </button>
              )}

            
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#FFB3B3] p-2 md:p-3 flex justify-center gap-2 md:gap-4 border-b border-[#FF9B9B] sticky top-0 z-50 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <TabButton active={activeTab === 'letters'} onClick={() => setActiveTab('letters')} label={tabLetterLabel} />
        <TabButton active={activeTab === 'greetings'} onClick={() => setActiveTab('greetings')} label={tabGreetingLabel} />
        <TabButton active={activeTab === 'travel'} onClick={() => setActiveTab('travel')} label={tabTravelLabel} />
        <TabButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} label={tabDailyLabel} />
        <TabButton active={activeTab === 'news'} onClick={() => setActiveTab('news')} label={tabNewsLabel} />
              </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto my-6 p-4 md:p-8 bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-4 border-[#FFE4E1] mx-4 md:mx-auto">
        <div className="bg-[#FFF8E1] border border-[#FFECB3] p-4 rounded-2xl text-xs md:text-sm text-[#795548] mb-6 flex items-start md:items-center gap-3">
          <span className="text-xl md:text-2xl flex-shrink-0">💡</span>
          <p className="leading-snug">
            <strong>Tip:</strong> 글자 칸을 클릭하면 발음을 들을 수 있습니다! 소리가 나지 않는다면 <b>볼륨</b>과 <b>무음 모드</b>를 확인해 주세요.<br/>(모바일 네이버, 카카오톡 인앱 브라우저에서는 음성이 나오지 않을 수 있으니 크롬 및 엣지 브라우저에서 실행해 주시기 바랍니다.)
          </p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'letters' && (
            <motion.section
              key="letters"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-3xl font-black text-[#FF6B6B] flex items-center gap-2 md:gap-3">
                  <span className="bg-[#FF6B6B] text-white w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-lg">あ</span>
                  기본 문자 익히기
                </h2>
                <div className="flex bg-gray-100 rounded-full p-1 overflow-hidden shrink-0">
                  <button 
                    className={`px-3 py-1 md:px-5 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${letterType === 'hiragana' ? 'bg-white shadow-sm text-[#FF6B6B]' : 'text-gray-500'}`}
                    onClick={() => setLetterType('hiragana')}
                  >
                    히라가나
                  </button>
                  <button 
                    className={`px-3 py-1 md:px-5 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${letterType === 'katakana' ? 'bg-white shadow-sm text-[#FF6B6B]' : 'text-gray-500'}`}
                    onClick={() => setLetterType('katakana')}
                  >
                    가타카나
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 md:gap-5">
                {(letterType === 'hiragana' ? hiraganaData : katakanaData).map((item, idx) => (
                  item ? (
                    <motion.div
                      key={`char-${letterType}-${idx}`}
                      whileHover={{ y: -5, backgroundColor: '#FFE4E1' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => speakText(item.jp)}
                      className="bg-[#FFF0F5] border-2 border-[#FFE4E1] rounded-xl md:rounded-2xl p-3 md:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden group"
                    >
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLetter({type: letterType, index: idx, item});
                          }} 
                          className="absolute top-1 right-1 p-1.5 md:p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors z-10 shadow-sm"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <span className="text-2xl md:text-5xl font-black text-[#FF6B6B] mb-1 md:mb-2">{item.jp}</span>
                      <span className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-tight leading-none">{item.ko}</span>
                      <div className="mt-2 text-base md:text-xl opacity-30">🔊</div>
                    </motion.div>
                  ) : (
                    <div key={`empty-${idx}`} className="h-16 md:h-28 border border-dashed border-gray-100 rounded-xl md:rounded-2xl opacity-50 relative group">
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLetter({type: letterType, index: idx, item: { jp: '', ko: '' }});
                          }} 
                          className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors z-10 shadow-sm"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  )
                ))}
              </div>
            </motion.section>
          )}

          {(activeTab === 'greetings' || activeTab === 'travel' || activeTab === 'daily') && (
            <motion.section
              key={`section-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {activeTab === 'greetings' ? '💬' : activeTab === 'travel' ? '✈️' : '🏠'}
                  </span>
                  <SectionHeader 
                    title={activeTab === 'greetings' ? "필수 인사말" : activeTab === 'travel' ? "여행 필수 회화" : "실생활 표현"} 
                    color={activeTab === 'greetings' ? "#FF6B6B" : "#4ECDC4"}
                  />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {selectedItems.length > 0 && (
                      <button 
                        onClick={() => {
                          if(window.confirm(`선택한 ${selectedItems.length}개의 문장을 삭제하시겠습니까?`)) {
                            const remover = (prev: any[]) => prev.filter((_, idx) => !selectedItems.includes(idx));
                            if(activeTab === 'greetings') setGreetingsData(remover);
                            if(activeTab === 'travel') setTravelData(remover);
                            if(activeTab === 'daily') setDailyData(remover);
                            setSelectedItems([]);
                          }
                        }} 
                        className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl hover:bg-red-400 transition-all font-bold shadow-md"
                      >
                        <Trash2 size={16} />
                        <span className="text-sm">선택 삭제</span>
                      </button>
                    )}
                    <button onClick={() => setIsAddingMode(true)} className="flex items-center gap-1 bg-[#4ECDC4] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl hover:bg-[#45B7AF] transition-all font-bold shadow-md">
                      <Plus size={16} />
                      <span className="text-sm">추가</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(activeTab === 'greetings' ? greetingsData : activeTab === 'travel' ? travelData : dailyData).map((item, i) => (
                  <SentenceCard 
                    key={`${activeTab}-${i}`} 
                    index={i} 
                    item={item} 
                    onPlay={speakText}
                    isAdmin={isAdmin} 
                    isSelected={selectedItems.includes(i)}
                    onToggleSelect={() => {
                      setSelectedItems(prev => 
                        prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                      )
                    }}
                    onEdit={() => setEditingItem({tab: activeTab, index: i, item})}
                    onDelete={() => {
                      if(window.confirm('정말 삭제하시겠습니까?')) {
                        const remover = (prev: any[]) => prev.filter((_, idx) => idx !== i);
                        if(activeTab === 'greetings') setGreetingsData(remover);
                        if(activeTab === 'travel') setTravelData(remover);
                        if(activeTab === 'daily') setDailyData(remover);
                        setSelectedItems(prev => prev.filter(idx => idx !== i));
                      }
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {activeTab === 'news' && (
            <NewsSection isAdmin={isAdmin} />
          )}
          
        </AnimatePresence>
      </main>

      <div className="w-full max-w-4xl mx-auto mt-8 mb-4 px-4">
        {/* Google AdSense */}
        <ins className="adsbygoogle"
             style={{ display: 'block', minHeight: '90px' }}
             data-ad-client="ca-pub-6799823492487492"
             data-ad-slot=""
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>

      <footer className="text-center py-8 text-gray-400 text-[10px] md:text-xs font-medium tracking-wider">
        {footerText}
      </footer>

      {/* Scroll to Top Quick Menu */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#FF6B6B] text-white size-12 md:size-14 rounded-full shadow-xl flex items-center justify-center hover:bg-[#FF5252] hover:-translate-y-1 transition-all z-[100]"
        aria-label="최상단으로 이동"
      >
        <span className="text-lg md:text-xl font-bold">▲</span>
      </button>

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto w-full h-full">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-gray-50 rounded-3xl w-full max-w-4xl shadow-2xl relative my-4 flex flex-col max-h-[90vh] md:max-h-[85vh]">
            <div className="p-5 md:p-8 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-3xl shrink-0">
              <h2 className="text-xl md:text-2xl font-black text-gray-800 flex items-center gap-2"><Settings size={24} className="text-[#FF6B6B]"/> 관리자 대시보드</h2>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                 <button onClick={handleSaveAll} className="bg-indigo-600 hover:bg-indigo-700 shadow flex items-center justify-center text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto">💾 모든 변경사항 반영/저장</button>
                 <button onClick={() => setShowAdminDashboard(false)} className="text-gray-400 hover:text-gray-800 transition-colors absolute sm:static top-4 right-4 sm:top-auto sm:right-auto"><X size={28}/></button>
              </div>
            </div>
            
            <div className="p-5 md:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                
                {/* Left Col: Settings */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Home size={18} className="text-indigo-400"/> 홈페이지 기본 설정</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">홈페이지명 (타이틀)</label>
                        <input type="text" value={siteTitle} onChange={e=>setSiteTitle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">서브타이틀 (설명)</label>
                        <input type="text" value={siteSubtitle} onChange={e=>setSiteSubtitle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">하단 카피라이트 (Footer)</label>
                        <input type="text" value={footerText} onChange={e=>setFooterText(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">네이버 사이트 소유확인 (Meta Tag)</label>
                        <input type="text" value={naverMeta} onChange={e=>setNaverMeta(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-indigo-400 focus:outline-none" placeholder='<meta name="naver-site-verification" content="..." />'/>
                        <p className="text-[10px] text-gray-400 mt-1">네이버 웹마스터도구에서 제공하는 메타태그 전체 또는 content 값을 입력하세요.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-green-400"/> 레이어 팝업 (공지)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="popupToggle" checked={popupInfo.active} onChange={e=>setPopupInfo({...popupInfo, active: e.target.checked})} className="w-4 h-4 rounded text-green-500 focus:ring-green-500"/>
                        <label htmlFor="popupToggle" className="text-sm font-bold text-gray-700 cursor-pointer">팝업 활성화</label>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">팝업 이미지 (선택)</label>
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             if (file.size > 2 * 1024 * 1024) { alert('이미지는 2MB 이내로 첨부 가능합니다.'); return; }
                             const reader = new FileReader();
                             reader.onload = (ev) => setPopupInfo({...popupInfo, image: ev.target?.result as string});
                             reader.readAsDataURL(file);
                          }
                        }} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium"/>
                        {popupInfo.image && (
                          <div className="mt-2 relative inline-block">
                             <img src={popupInfo.image} className="h-16 object-contain rounded border" />
                             <button onClick={() => setPopupInfo({...popupInfo, image: ''})} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-[10px] leading-none">X</button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">팝업 내용</label>
                        <textarea value={popupInfo.content} onChange={e=>setPopupInfo({...popupInfo, content: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-green-400 focus:outline-none min-h-[80px]"/>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Plane size={18} className="text-blue-400"/> 카테고리 (메뉴명) 변경</h3>
                    <div className="space-y-3 grid grid-cols-2 gap-x-3 gap-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">메뉴 1</label>
                        <input type="text" value={tabLetterLabel} onChange={e=>setTabLetterLabel(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">메뉴 2</label>
                        <input type="text" value={tabGreetingLabel} onChange={e=>setTabGreetingLabel(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">메뉴 3</label>
                        <input type="text" value={tabTravelLabel} onChange={e=>setTabTravelLabel(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">메뉴 4</label>
                        <input type="text" value={tabDailyLabel} onChange={e=>setTabDailyLabel(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">메뉴 5 (소식)</label>
                        <input type="text" value={tabNewsLabel} onChange={e=>setTabNewsLabel(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-blue-400 focus:outline-none"/>
                      </div>
                      
                    </div>
                  </div>



                </div>

                {/* Right Col: Stats & SEO */}
                <div className="space-y-6">

                  {/* 📊 통계 현황 (Detailed) */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                     <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={18} className="text-indigo-500"/> 방문자 및 유입 통계</h3>
                     <div className="flex gap-2 mb-4">
                        <button onClick={() => setStatsPeriod('day')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statsPeriod==='day' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>오늘</button>
                        <button onClick={() => setStatsPeriod('week')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statsPeriod==='week' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>최근 7일</button>
                        <button onClick={() => setStatsPeriod('month')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statsPeriod==='month' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>이번 달</button>
                        <button onClick={() => setStatsPeriod('year')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statsPeriod==='year' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>올해</button>
                     </div>
                     {(() => {
                        let visits = 0;
                        let referrers: Record<string, number> = {};
                        let keywords: Record<string, number> = {};
                        let devices: Record<string, number> = {};
                        let browsers: Record<string, number> = {};
                        const dates = Object.keys(siteStats);
                        
                        const now = new Date();
                        const filterDate = (dString: string) => {
                           const d = new Date(dString);
                           if (!d.getTime()) return false;
                           if (statsPeriod === 'day') return dString === now.toISOString().split('T')[0];
                           if (statsPeriod === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
                           if (statsPeriod === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                           if (statsPeriod === 'year') return d.getFullYear() === now.getFullYear();
                           return true;
                        };

                        const filteredDates = dates.filter(filterDate).sort();
                        const chartData = filteredDates.map(d => ({
                           date: d.slice(5),
                           visitors: siteStats[d]?.visitors || 0
                        }));

                        filteredDates.forEach(d => {
                           visits += siteStats[d]?.visitors || 0;
                           const r = siteStats[d]?.referrers || {};
                           Object.keys(r).forEach(k => { referrers[k] = (referrers[k] || 0) + r[k]; });
                           const kw = siteStats[d]?.keywords || {};
                           Object.keys(kw).forEach(k => { keywords[k] = (keywords[k] || 0) + kw[k]; });
                           
                           const dev = siteStats[d]?.devices || {};
                           Object.keys(dev).forEach(k => { devices[k] = (devices[k] || 0) + dev[k]; });
                           const brw = siteStats[d]?.browsers || {};
                           Object.keys(brw).forEach(k => { browsers[k] = (browsers[k] || 0) + brw[k]; });
                        });

                        const sortedRef = Object.entries(referrers).sort((a,b) => b[1] - a[1]);
                        const sortedKeywords = Object.entries(keywords).sort((a,b) => b[1] - a[1]).slice(0, 10);
                        const deviceData = Object.entries(devices).map(([name, value]) => ({name, value}));
                        const browserData = Object.entries(browsers).map(([name, value]) => ({name, value}));
                        
                        const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

                        return (
                          <div className="space-y-6">
                            {/* Visitors Summary & Chart */}
                            <div>
                               <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 flex justify-between items-center">
                                  <span>총 방문자 트렌드</span>
                                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">총 {visits.toLocaleString()}명</span>
                               </h4>
                               {chartData.length > 0 ? (
                                 <div className="h-48 w-full mb-4 mt-2">
                                   <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                       <defs>
                                         <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                         </linearGradient>
                                       </defs>
                                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                       <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                       <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                       <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                       <Area type="monotone" dataKey="visitors" name="방문자" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                                     </AreaChart>
                                   </ResponsiveContainer>
                                 </div>
                               ) : (
                                 <p className="text-xs text-gray-400 py-4 text-center">데이터가 없습니다.</p>
                               )}
                            </div>

                            {/* Devices & Browsers */}
                            <div className="grid grid-cols-2 gap-4">
                               <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                 <h4 className="text-xs font-bold text-gray-600 mb-2 border-b pb-2 flex items-center gap-1"><Smartphone size={14}/> 디바이스 비율</h4>
                                 {deviceData.length > 0 ? (
                                   <div className="h-32 w-full relative">
                                     <ResponsiveContainer width="100%" height="100%">
                                       <PieChart>
                                         <Pie data={deviceData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                                           {deviceData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                         </Pie>
                                         <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', padding: '4px 8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#333' }} />
                                       </PieChart>
                                     </ResponsiveContainer>
                                   </div>
                                 ) : <p className="text-xs text-gray-400 mt-2 text-center">데이터 없음</p>}
                               </div>
                               <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                 <h4 className="text-xs font-bold text-gray-600 mb-2 border-b pb-2 flex items-center gap-1"><Globe size={14}/> 브라우저 비율</h4>
                                 {browserData.length > 0 ? (
                                   <div className="h-32 w-full relative">
                                     <ResponsiveContainer width="100%" height="100%">
                                       <PieChart>
                                         <Pie data={browserData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                                           {browserData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                         </Pie>
                                         <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', padding: '4px 8px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#333' }} />
                                       </PieChart>
                                     </ResponsiveContainer>
                                   </div>
                                 ) : <p className="text-xs text-gray-400 mt-2 text-center">데이터 없음</p>}
                               </div>
                            </div>

                            {/* Referrers and Keywords */}
                            <div className="grid grid-cols-1 gap-6 mt-4">
                               <div>
                                 <h4 className="text-sm font-bold text-gray-700 mb-2">유입 경로 현황</h4>
                                 <ul className="space-y-1.5 text-xs">
                                    {sortedRef.length === 0 ? <p className="text-xs text-gray-400">데이터가 없습니다.</p> : sortedRef.map(([key, count], i) => (
                                       <li key={key} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg font-medium">
                                          <span className="text-gray-700 flex items-center">
                                             <span className={`font-bold mr-2 w-4 text-center ${i===0?'text-blue-500':i===1?'text-blue-400':i===2?'text-blue-300':'text-gray-400'}`}>{i+1}</span>
                                             <span className="truncate max-w-[150px]" title={key}>{key}</span>
                                          </span>
                                          <span className="text-gray-400">{count.toLocaleString()}명</span>
                                       </li>
                                    ))}
                                 </ul>
                               </div>

                               <div>
                                 <h4 className="text-sm font-bold text-gray-700 mb-2">인기 유입 키워드 TOP 10</h4>
                                 <ul className="space-y-1.5 text-xs">
                                    {sortedKeywords.length === 0 ? <p className="text-xs text-gray-400">데이터가 없습니다.</p> : sortedKeywords.map(([key, count], i) => (
                                       <li key={key} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg font-medium">
                                          <span className="text-gray-700 flex items-center">
                                             <span className={`font-bold mr-2 w-4 text-center ${i===0?'text-red-500':i===1?'text-orange-500':i===2?'text-yellow-500':'text-gray-400'}`}>{i+1}</span>
                                             <span className="truncate max-w-[150px]" title={key}>{key}</span>
                                          </span>
                                          <span className="text-gray-400">{count.toLocaleString()}회</span>
                                       </li>
                                    ))}
                                 </ul>
                               </div>
                            </div>
                          </div>
                        );
                    })()}
                  </div>

                  {/* SEO 등록 */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Settings size={18} className="text-purple-500"/> SEO (검색엔진 최적화) 등록</h3>
                       <button onClick={handleSeoSave} className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">저장하기/반영</button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">robots.txt (검색 로봇 제어)</label>
                        <textarea value={seoData.robotsTxt} onChange={e=>setSeoData({...seoData, robotsTxt: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-purple-400 focus:outline-none h-24 font-mono text-xs" placeholder="User-agent: *&#10;Allow: /"/>
                        <p className="flex justify-between items-center text-[10px] text-gray-400 mt-1"><span>네이버 서치어드바이저 &gt; 검증 &gt; robots.txt 에서 확인 가능</span><a href="/robots.txt" target="_blank" className="text-purple-500 hover:underline">/robots.txt 열기</a></p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ads.txt (구글 애드센스 등)</label>
                        <textarea value={seoData.adsTxt || ''} onChange={e=>setSeoData({...seoData, adsTxt: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-purple-400 focus:outline-none h-24 font-mono text-xs" placeholder="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"/>
                        <p className="flex justify-between items-center text-[10px] text-gray-400 mt-1"><span>애드센스 승인을 위해 ads.txt 내용을 붙여넣으세요.</span><a href="/ads.txt" target="_blank" className="text-purple-500 hover:underline">/ads.txt 열기</a></p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">사이트맵 (sitemap.xml)</label>
                        <textarea value={seoData.sitemapXml} onChange={e=>setSeoData({...seoData, sitemapXml: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-purple-400 focus:outline-none h-24 font-mono text-xs" placeholder="<?xml version='1.0' encoding='UTF-8'?>..."/>
                        <p className="flex justify-between items-center text-[10px] text-gray-400 mt-1"><span>sitemap.xml 내용을 복사하여 붙여넣으세요.</span><a href="/sitemap.xml" target="_blank" className="text-purple-500 hover:underline">/sitemap.xml 열기</a></p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">RSS 피드 (rss.xml)</label>
                        <textarea value={seoData.rssXml} onChange={e=>setSeoData({...seoData, rssXml: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:border-purple-400 focus:outline-none h-24 font-mono text-xs" placeholder="<?xml version='1.0' encoding='UTF-8'?>..."/>
                        <p className="flex justify-between items-center text-[10px] text-gray-400 mt-1"><span>rss.xml 내용을 복사하여 붙여넣으세요.</span><a href="/rss.xml" target="_blank" className="text-purple-500 hover:underline">/rss.xml 열기</a></p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(editingItem || isAddingMode) && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full relative">
            <button onClick={() => {setEditingItem(null); setIsAddingMode(false);}} className="absolute right-4 top-4 text-gray-400 hover:text-gray-800 transition-colors"><X size={24}/></button>
            <h2 className="text-2xl font-black text-gray-800 mb-6">{isAddingMode ? '새로운 문장 추가' : '문장 수정'}</h2>
            <FormContent 
              editingItem={editingItem} 
              isAddingMode={isAddingMode} 
              close={() => {setEditingItem(null); setIsAddingMode(false);}} 
              activeTab={activeTab}
              setGreetingsData={setGreetingsData}
              setTravelData={setTravelData}
              setDailyData={setDailyData}
            />
          </motion.div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowAdminLogin(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-800 transition-colors"><X size={24}/></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500">
                <Lock size={24}/>
              </div>
              <h2 className="text-2xl font-black text-gray-800">관리자 접속</h2>
            </div>
            <div className="space-y-4">
              <input type="text" value={adminId} onChange={e=>setAdminId(e.target.value)} placeholder="관리자 이메일" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-rose-400 focus:outline-none"/>
              <input type="password" value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} placeholder="비밀번호" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-rose-400 focus:outline-none" onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}/>
              <button onClick={handleAdminLogin} className="w-full bg-rose-400 text-white font-bold py-3 rounded-xl shadow-md hover:bg-rose-500 transition-colors">로그인</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 md:px-6 md:py-2 rounded-full font-bold transition-all text-xs md:text-base ${
        active 
          ? 'bg-white text-[#FF9B9B] shadow-sm' 
          : 'bg-transparent text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

function SectionHeader({ title, color }: { title: string, color: string }) {
  return (
    <div className="pb-1 group">
      <h2 className="text-xl md:text-3xl font-black mb-1" style={{ color }}>{title}</h2>
    </div>
  );
}


function LetterFormContent({editingLetter, close, setHiraganaData, setKatakanaData}: any) {
  const [jp, setJp] = useState(editingLetter?.item?.jp ?? '');
  const [ko, setKo] = useState(editingLetter?.item?.ko ?? '');

  const handleSave = () => {
    const newItem = (jp && ko) ? { jp, ko } : null;
    
    const updateTarget = (prev: any[]) => {
      const next = [...prev];
      next[editingLetter.index] = newItem;
      return next;
    };

    if(editingLetter.type === 'hiragana') setHiraganaData(updateTarget);
    if(editingLetter.type === 'katakana') setKatakanaData(updateTarget);
    close();
  };

  const handleRemove = () => {
    const updateTarget = (prev: any[]) => {
      const next = [...prev];
      next[editingLetter.index] = null;
      return next;
    };
    if(editingLetter.type === 'hiragana') setHiraganaData(updateTarget);
    if(editingLetter.type === 'katakana') setKatakanaData(updateTarget);
    close();
  };

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">일본어 글자</label>
        <input type="text" value={jp} onChange={e=>setJp(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#FF9B9B] focus:outline-none transition-colors" placeholder="예: あ"/>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">한국어 발음</label>
        <input type="text" value={ko} onChange={e=>setKo(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-[#FF9B9B] focus:outline-none transition-colors" placeholder="예: 아"/>
      </div>
      <div className="flex gap-2 mt-6">
        <button onClick={handleRemove} className="flex-1 bg-red-100 text-red-600 font-bold text-sm md:text-base rounded-xl py-3 hover:bg-red-200 transition-colors shadow-md">빈칸으로 만들기</button>
        <button onClick={handleSave} className="flex-1 bg-[#4ECDC4] text-white font-bold text-sm md:text-base rounded-xl py-3 hover:bg-[#45B7AF] transition-colors shadow-md">저장하기</button>
      </div>
    </>
  );
}

interface SentenceCardProps {
  item: SentenceItem;
  index: number;
  onPlay: (t: string) => void;
  isAdmin?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const SentenceCard: FC<SentenceCardProps> = ({ item, index, onPlay, isAdmin, isSelected, onToggleSelect, onEdit, onDelete }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.01 }}
      className={`flex items-center justify-between p-3 md:p-5 bg-[#F8F9FA] border-l-[6px] md:border-l-[10px] ${isSelected ? 'border-red-500 bg-red-50' : 'border-[#FF9B9B]'} rounded-xl md:rounded-2xl hover:bg-white hover:shadow-lg transition-all group relative`}
    >
      {isAdmin && (
        <div className="mr-3 flex items-center justify-center">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500 shrink-0 cursor-pointer"
          />
        </div>
      )}
      <div className="flex-1 pr-3 md:pr-6 min-w-0">
        <div className="flex flex-col">
          <span className="text-sm md:text-xl font-bold text-gray-800 leading-tight mb-0.5 truncate">{item.jp}</span>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium italic tracking-wide lowercase mb-1 leading-none">{item.ko}</span>
          <span className="text-xs md:text-base font-black text-[#FF6B6B] leading-tight truncate">{item.mean || (item as any).단어}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <div className="flex flex-col gap-1 mr-1">
            <button onClick={onEdit} className="p-1.5 md:p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"><Pencil size={14}/></button>
            <button onClick={onDelete} className="p-1.5 md:p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><Trash2 size={14}/></button>
          </div>
        )}
        <button 
          onClick={() => onPlay(item.jp)}
          className="size-8 md:size-12 rounded-lg md:rounded-full bg-[#4ECDC4] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all flex-shrink-0"
        >
          <Volume2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function FormContent({editingItem, isAddingMode, close, activeTab, setGreetingsData, setTravelData, setDailyData}: any) {
  const [jp, setJp] = useState(editingItem?.item?.jp ?? '');
  const [ko, setKo] = useState(editingItem?.item?.ko ?? '');
  const [mean, setMean] = useState(editingItem?.item?.mean ?? editingItem?.item?.단어 ?? '');

  const handleSave = () => {
    if(!jp || !ko || !mean) return alert('모든 칸을 입력해주세요.');
    const newItem = { jp, ko, mean };
    
    const updateTarget = (prev: any[]) => {
      if(isAddingMode) return [...prev, newItem];
      const next = [...prev];
      next[editingItem.index] = newItem;
      return next;
    };

    if(activeTab === 'greetings') setGreetingsData(updateTarget);
    if(activeTab === 'travel') setTravelData(updateTarget);
    if(activeTab === 'daily') setDailyData(updateTarget);
    close();
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">일본어 문장</label>
          <input type="text" value={jp} onChange={e=>setJp(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-red-400 focus:outline-none transition-colors" placeholder="예: こんにちは"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">한국어 발음</label>
          <input type="text" value={ko} onChange={e=>setKo(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-red-400 focus:outline-none transition-colors" placeholder="예: 콘니치와"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">뜻 (의미)</label>
          <input type="text" value={mean} onChange={e=>setMean(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-red-400 focus:outline-none transition-colors" placeholder="예: 안녕하세요"/>
        </div>
      </div>
      <div className="mt-6">
        <button onClick={handleSave} className="w-full bg-[#4ECDC4] text-white font-bold text-base rounded-xl py-3 hover:bg-[#45B7AF] transition-colors shadow-md">저장하기</button>
      </div>
    </>
  );
}




