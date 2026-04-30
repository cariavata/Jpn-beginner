import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, MessageSquare, Plane, Home, Newspaper, Sparkles, Map, Heart, Star } from 'lucide-react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

interface NewsPost {
  id?: string;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt: number;
  isNotice?: boolean;
}

interface HomeSectionProps {
  setActiveTab: (tab: string, subPath?: string) => void;
  labels: {
    letters: string;
    greetings: string;
    travel: string;
    daily: string;
    news: string;
  };
}

export function HomeSection({ setActiveTab, labels }: HomeSectionProps) {
  const [topNews, setTopNews] = useState<NewsPost[]>([]);

  useEffect(() => {
    async function fetchTopNews() {
      try {
        const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsPost));
        data.sort((a, b) => {
          if (a.isNotice && !b.isNotice) return -1;
          if (!a.isNotice && b.isNotice) return 1;
          return b.createdAt - a.createdAt;
        });
        setTopNews(data.slice(0, 2));
      } catch (err) {
        console.error(err);
      }
    }
    fetchTopNews();
  }, []);

  const cards = [
    { id: 'letters', label: labels.letters, description: '히라가나와 가타카나를 완벽하게 마스터하세요.', icon: BookOpen, color: 'bg-pink-100', iconColor: 'text-pink-500' },
    { id: 'greetings', label: labels.greetings, description: '일본어의 기본인 필수 인사말을 배워보세요.', icon: MessageSquare, color: 'bg-green-100', iconColor: 'text-green-500' },
    { id: 'travel', label: labels.travel, description: '일본 여행에서 바로 쓸 수 있는 실전 회화!', icon: Plane, color: 'bg-blue-100', iconColor: 'text-blue-500' },
    { id: 'daily', label: labels.daily, description: '일상 생활에서 자주 쓰이는 유용한 표현들.', icon: Home, color: 'bg-purple-100', iconColor: 'text-purple-500' },
    { id: 'news', label: labels.news, description: '일본의 최신 소식과 트렌드를 확인하세요.', icon: Newspaper, color: 'bg-orange-100', iconColor: 'text-orange-500' },
  ];

  return (
    <motion.section
      key="home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 flex flex-col pb-10"
    >
      {/* Hero Header with Japanese Image */}
      <div className="relative w-full h-[280px] md:h-[400px] rounded-[2.5rem] overflow-hidden shadow-lg group">
        <img 
          src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1200" 
          alt="일본 벚꽃 풍경" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-block px-3 py-1 bg-pink-500/80 text-white text-xs md:text-sm font-bold rounded-full mb-3 backdrop-blur-sm border border-pink-400">
              🌸 실전 일본어 마스터
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight drop-shadow-md">
              처음 만나는 일본어,<br className="hidden md:block" /> 쉽고 재미있게.
            </h2>
            <p className="text-gray-200 text-sm md:text-lg drop-shadow-sm max-w-2xl">
              어렵게 생각하지 마세요! 자주 쓰이는 인사말부터 여행 회화, 매일 쓰는 생활 표현까지, 꼭 필요한 일본어만 골라 즐겁게 배울 수 있습니다.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Categories Menu */}
      <div className="space-y-4 md:space-y-6">
        <div className="text-center md:text-left flex items-center justify-center md:justify-start gap-2 px-2">
          <Sparkles className="text-pink-400" size={24} />
          <h3 className="text-2xl font-bold text-gray-800">우선 어떤 학습을 시작해 볼까요?</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isFullWidth = index === cards.length - 1 && cards.length % 2 !== 0;

            return (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className={`p-5 md:p-6 rounded-[2rem] border-2 border-pink-50 hover:border-pink-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex items-start gap-4 flex-col sm:flex-row group ${isFullWidth ? 'md:col-span-2 cursor-pointer' : 'cursor-pointer'}`}
              >
                <div className={`p-4 rounded-[1.5rem] ${card.color} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={32} className={card.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1.5 md:mb-2 group-hover:text-pink-500 transition-colors">{card.label}</h3>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed">{card.description}</p>
                </div>
                <div className="hidden sm:flex self-center w-10 h-10 rounded-full bg-gray-50 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300 shrink-0">
                  <span className="text-gray-400 font-bold">→</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent News Preview Section */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Newspaper className="text-orange-400" size={24} />
            <h3 className="text-2xl font-bold text-gray-800">최신 일본 소식</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {topNews.length > 0 ? topNews.map(news => (
            <div 
              key={news.id} 
              onClick={() => setActiveTab('news', news.id)}
              className="bg-white p-4 rounded-[1.5rem] md:rounded-[2rem] border-2 border-transparent hover:border-orange-100 flex gap-4 items-center group cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 bg-gray-50 rounded-xl md:rounded-2xl overflow-hidden relative border border-gray-100">
                {news.thumbnail ? (
                  <img src={news.thumbnail} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Newspaper size={32} />
                  </div>
                )}
                {news.isNotice && (
                  <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm">
                    공지
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h4 className="font-bold text-gray-800 text-base md:text-lg mb-1 truncate group-hover:text-orange-500 transition-colors">{news.title}</h4>
                <p className="text-xs md:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">
                  {news.content.replace(/[#*`>]/g, '')}
                </p>
                <div className="text-[10px] md:text-xs font-bold text-gray-400">
                  {new Date(news.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-10 text-center text-gray-400 font-medium bg-white rounded-[2rem] shadow-sm border border-gray-100">
              최근 업데이트된 소식이 없습니다.
            </div>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setActiveTab('news')}
            className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-800 hover:text-gray-800 transition-colors bg-white shadow-sm hover:shadow-md"
          >
            소식 살펴보기 →
          </button>
        </div>
      </div>

      {/* Motivational Section / Feature highlights (Redesigned) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch py-8 border-y border-pink-100/50 gap-8 md:gap-4 mt-8">
        <div className="flex-1 flex flex-col items-center text-center px-4 group">
           <div className="w-12 h-12 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
              <Plane size={20} />
           </div>
           <h4 className="text-lg font-bold text-gray-800 mb-2">일본 여행 준비 끝!</h4>
           <p className="text-sm text-gray-500 leading-relaxed font-medium">공항, 호텔, 식당에서<br className="hidden lg:block"/>꼭 필요한 핵심 문장만 모았습니다.</p>
        </div>
        
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-pink-100 to-transparent self-stretch my-4"></div>
        
        <div className="flex-1 flex flex-col items-center text-center px-4 group">
           <div className="w-12 h-12 border-2 border-pink-100 rounded-full flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 group-hover:bg-pink-50 transition-all">
              <MessageSquare size={20} />
           </div>
           <h4 className="text-lg font-bold text-gray-800 mb-2">네이티브처럼 말하기</h4>
           <p className="text-sm text-gray-500 leading-relaxed font-medium">일본인 친구를 만났을 때<br className="hidden lg:block"/>바로 쓸 수 있는 리얼 일본어.</p>
        </div>
        
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-pink-100 to-transparent self-stretch my-4"></div>
        
        <div className="flex-1 flex flex-col items-center text-center px-4 group">
           <div className="w-12 h-12 border-2 border-orange-100 rounded-full flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 group-hover:bg-orange-50 transition-all">
              <BookOpen size={20} />
           </div>
           <h4 className="text-lg font-bold text-gray-800 mb-2">기초부터 탄탄하게</h4>
           <p className="text-sm text-gray-500 leading-relaxed font-medium">히라가나와 가타카나를<br className="hidden lg:block"/>듣고 보며 쉽게 암기해보세요.</p>
        </div>
      </div>

      {/* Decorative Cultural Bottom Banner */}
      <div className="w-full h-[180px] rounded-[2rem] overflow-hidden shadow-sm relative group cursor-pointer" onClick={() => setActiveTab('travel')}>
        <img 
          src="https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=1200" 
          alt="일본 문화 일본 거리" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 blur-[2px] group-hover:blur-0"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
          <h3 className="text-white text-2xl font-bold mb-2 tracking-wide drop-shadow-md">千里の道も一歩から</h3>
          <p className="text-pink-200 text-sm font-medium drop-shadow-sm">천 리 길도 한 걸음부터 - 망설이지 말고 지금 바로 시작해 보세요!</p>
          <div className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 rounded-full text-white text-sm font-bold transition-colors">
            여행 회화 둘러보기 →
          </div>
        </div>
      </div>
    </motion.section>
  );
}

