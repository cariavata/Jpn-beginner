import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { handleFirestoreError, OperationType } from './lib/firebase';

function AdUnit({ className }: { className?: string }) {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e: any) {
      if (!e?.message?.includes("already have ads")) {
        console.error("AdSense error:", e);
      }
    }
  }, []);

  return (
    <ins className={`adsbygoogle w-full ${className || ''}`}
         style={{ display: 'block' }}
         data-ad-client="ca-pub-6799823492487492"
         data-ad-slot=""
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
}

interface NewsPost {
  id?: string;
  title: string;
  content: string;
  thumbnail?: string;
  createdAt: number;
  isNotice?: boolean;
}

export function NewsSection({ isAdmin }: { isAdmin: boolean }) {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const pathParts = window.location.pathname.substring(1).split('/');
    if (pathParts[0] === 'news' && pathParts[1]) {
      const postId = pathParts[1];
      const post = news.find(p => p.id === postId);
      if (post) {
        setSelectedPost(post);
      }
    }
  }, [news]);

  useEffect(() => {
    const handlePopState = () => {
      const pathParts = window.location.pathname.substring(1).split('/');
      if (pathParts[0] === 'news' && pathParts[1]) {
        const post = news.find(p => p.id === pathParts[1]);
        if (post) setSelectedPost(post);
      } else {
        setSelectedPost(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [news]);

  const openPost = (post: NewsPost) => {
    window.history.pushState({ tab: 'news' }, '', `/news/${post.id}`);
    setSelectedPost(post);
  };

  const closePost = () => {
    window.history.pushState({ tab: 'news' }, '', `/news`);
    setSelectedPost(null);
  };

  const fetchNews = async () => {
    try {
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsPost));
      setNews(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'news');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (post: NewsPost) => {
    try {
      if (post.id) {
        await updateDoc(doc(db, 'news', post.id), {
          title: post.title,
          content: post.content,
          thumbnail: post.thumbnail,
          isNotice: post.isNotice || false,
        });
      } else {
        await addDoc(collection(db, 'news'), {
          title: post.title,
          content: post.content,
          thumbnail: post.thumbnail,
          createdAt: Date.now(),
          isNotice: post.isNotice || false,
        });
      }
      setEditingPost(null);
      fetchNews();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'news');
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'news', id));
      closePost();
      fetchNews();
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다. 로그를 확인해주세요.');
      try { handleFirestoreError(err, OperationType.DELETE, `news/${id}`); } catch(e){}
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500 font-bold">로딩 중...</div>;
  }

  if (editingPost) {
    return <NewsEditor post={editingPost} onSave={handleSave} onCancel={() => setEditingPost(null)} />;
  }

  if (selectedPost) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <button onClick={closePost} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold mb-4">
          <ChevronLeft size={20} /> 목록으로 돌아가기
        </button>
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          {isAdmin && (
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => setEditingPost(selectedPost)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"><Edit2 size={20}/></button>
              <button onClick={() => selectedPost.id && handleDelete(selectedPost.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
            </div>
          )}
          
          <h1 className="text-2xl md:text-4xl font-black text-gray-800 mb-4 flex items-center gap-3">
            {selectedPost.isNotice && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md font-bold align-middle">공지</span>}
            {selectedPost.title}
          </h1>
          <p className="text-sm text-gray-400 mb-8 pb-4 border-b border-gray-100">{new Date(selectedPost.createdAt).toLocaleString()}</p>
          
          {selectedPost.thumbnail && (
            <div className="mb-8 flex justify-center">
              <img src={selectedPost.thumbnail} alt="thumbnail" className="max-w-full md:max-w-2xl max-h-[500px] object-contain rounded-2xl shadow-sm" />
            </div>
          )}

          <div className="markdown-body">
            <Markdown 
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw]}
              urlTransform={(url) => url}
            >
              {selectedPost.content}
            </Markdown>
          </div>
          
          {/* AdSense Placeholder Bottom */}
          <AdUnit className="mt-4" />
        </div>
      </motion.div>
    );
  }

  const sortedNews = [...news].sort((a, b) => {
    if (a.isNotice && !b.isNotice) return -1;
    if (!a.isNotice && b.isNotice) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📰</span>
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">일본 소식</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setEditingPost({ title: '', content: '', thumbnail: '', createdAt: 0, isNotice: false })} className="flex items-center gap-1 bg-[#4ECDC4] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl hover:bg-[#45B7AF] transition-all font-bold shadow-md">
            <Plus size={16} />
            <span className="text-sm">새 글 쓰기</span>
          </button>
        )}
      </div>

      {news.length === 0 ? (
        <div className="text-center py-20 text-gray-400 font-medium">등록된 소식이 없습니다.</div>
      ) : (
        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 hidden md:table-header-group border-b-2 border-gray-100">
              <tr>
                <th className="py-3 px-6 text-sm font-bold text-gray-500 w-20 text-center">번호</th>
                <th className="py-3 px-6 text-sm font-bold text-gray-500">제목</th>
                <th className="py-3 px-6 text-sm font-bold text-gray-500 w-32 text-center">작성일</th>
              </tr>
            </thead>
            <tbody>
              {sortedNews.map((post, index) => (
                <tr key={post.id} onClick={() => openPost(post)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group flex flex-col md:table-row">
                  <td className="py-3 px-4 md:px-6 text-center text-gray-400 text-sm hidden md:table-cell">
                    {post.isNotice ? <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-md font-bold">공지</span> : (sortedNews.length - index)}
                  </td>
                  <td className="py-3 px-4 md:px-6">
                    <div className="flex items-center gap-2">
                       {/* Mobile Notice Badge */}
                      {post.isNotice && <span className="md:hidden bg-red-100 text-red-600 text-xs px-2 py-1 rounded-md font-bold whitespace-nowrap">공지</span>}
                      <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{post.title}</span>
                    </div>
                    {/* Mobile Date */}
                    <div className="text-xs text-gray-400 mt-1 md:hidden">
                       {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 md:px-6 text-center text-gray-500 text-sm hidden md:table-cell whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* AdSense Placeholder Bottom List */}
          <AdUnit />
        </div>
      )}
    </motion.section>
  );
}

function NewsEditor({ post, onSave, onCancel }: { post: NewsPost, onSave: (p: NewsPost) => void, onCancel: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [thumbnail, setThumbnail] = useState(post.thumbnail || '');
  const [isNotice, setIsNotice] = useState(post.isNotice || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImageSquare = (file: File, size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          let minSize = Math.min(width, height);
          let sx = (width - minSize) / 2;
          let sy = (height - minSize) / 2;

          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(e.target?.result as string); // fallback
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageSquare(file, 500);
      setThumbnail(base64);
    } catch(err) {
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{post.id ? '소식 수정' : '새 소식 쓰기'}</h2>
        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} className="w-4 h-4 text-red-500 accent-red-500" />
          <span className="text-sm font-bold text-gray-700">공지로 등록 ('공지' 표시 및 최상단 노출)</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1">제목</label>
        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-blue-400 focus:outline-none" placeholder="소식 제목을 입력하세요" />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1">썸네일 이미지</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleThumbnailUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            <ImageIcon size={18} /> 이미지 선택
          </button>
          {thumbnail && <div className="size-16 bg-gray-200 rounded overflow-hidden flex-shrink-0"><img src={thumbnail} className="object-cover w-full h-full" alt="thumb"/></div>}
          {thumbnail && <button onClick={() => setThumbnail('')} className="text-red-500 text-sm hover:underline">제거</button>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-600 mb-1">본문 (Markdown 지원)</label>
        <textarea value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-medium focus:border-blue-400 focus:outline-none min-h-[300px]" placeholder="Markdown 문법을 사용하여 글을 작성하세요."></textarea>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100 transition-colors">취소</button>
        <button onClick={() => onSave({ ...post, title, content, thumbnail, isNotice })} className="px-5 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 shadow-md transition-colors">저장하기</button>
      </div>
    </div>
  );
}
