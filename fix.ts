import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The file is corrupted near line 768 AGAIN. Let's fix it first.
const corruptedPattern = /setEditingLetter\(\{type: letterType, index: idx, item: \{\s*\)\}\n\s*<\/AnimatePresence>\n\s*<\/main> \{\(activeTab === 'greetings' \? greetingsData : activeTab === 'travel' \? travelData : dailyData\)\.map\(\(item, i\) => \(/;

const fixPattern = `setEditingLetter({type: letterType, index: idx, item: { jp: '', ko: '' }});
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
              key={\`section-\${activeTab}\`}
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
                          if(window.confirm(\`선택한 \${selectedItems.length}개의 문장을 삭제하시겠습니까?\`)) {
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
                {(activeTab === 'greetings' ? greetingsData : activeTab === 'travel' ? travelData : dailyData).map((item, i) => (`;

content = content.replace(corruptedPattern, fixPattern);

// Now remove the board section
const boardRegex = /\{\s*activeTab === 'board' && \([\s\S]*?(?=\s*<\/main>)/g;
content = content.replace(boardRegex, '');

fs.writeFileSync('src/App.tsx', content);
