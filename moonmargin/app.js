const favoriteIcon='<svg class="star-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="star-body" d="M15.39,6.21 Q16.00,4.90 16.61,6.21 L18.68,10.66 Q19.29,11.97 20.73,12.15 L25.59,12.74 Q27.03,12.92 25.97,13.90 L22.39,17.24 Q21.33,18.23 21.60,19.65 L22.54,24.46 Q22.82,25.88 21.55,25.18 L17.27,22.80 Q16.00,22.10 14.73,22.80 L10.45,25.18 Q9.18,25.88 9.46,24.46 L10.40,19.65 Q10.67,18.23 9.61,17.24 L6.03,13.90 Q4.97,12.92 6.41,12.74 L11.27,12.15 Q12.71,11.97 13.32,10.66 L15.39,6.21 Z"/><path class="star-spark" d="M27 3v4m-2-2h4M3 25v3m-1.5-1.5h3"/></svg>';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(k,def){try{return JSON.parse(localStorage.getItem('mm-'+k))??def}catch{return def}}
function put(k,v){localStorage.setItem('mm-'+k,JSON.stringify(v))}
let saved=load('saved',{}),done=load('done',{}),daily=load('daily',{}),scale=load('scale',20),view='today',filter='全部',active,day,selected=false;
const all=()=>Object.values(Object.fromEntries([...ARTICLES,...Object.values(daily),...Object.values(saved),...Object.values(quoteArticles)].map(a=>[a.id,a])));
function datestr(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())}
function initial(){const n=Math.floor((Date.parse(day)-Date.parse('2026-11-18'))/86400000);return daily[day]||ARTICLES[((n%ARTICLES.length)+ARTICLES.length)%ARTICLES.length]}
function wordMarkup(text){
 const pattern=/[A-Za-z]+(?:[’'][A-Za-z]+)*/g;
 let html='',last=0,match;
 while((match=pattern.exec(text))){
  const w=match[0],key=w.toLowerCase();
  html+=esc(text.slice(last,match.index))+'<span role="button" tabindex="0" class="word '+(active.focus?.includes(key)?'focus ':'')+(wordFavorites[key]?'saved-word':'')+'" data-word="'+esc(w)+'" title="'+(wordFavorites[key]?'双击取消收藏':'单击查词，双击收藏')+'">'+esc(w)+'</span>';
  last=pattern.lastIndex;
 }
 return html+esc(text.slice(last))
}
function clipDomId(c,index){return c.id||[c.articleId,c.first,c.start,c.text,index].join('|')}
function clipRanges(index){
 return clips.map((c,i)=>({c,i,segments:c.segments||[{index:c.first,start:c.start,end:c.first===c.last?c.start+c.text.length:active.paragraphs[c.first].length}]}))
  .flatMap(x=>x.segments.map(seg=>({...x,...seg}))).filter(x=>x.c.articleId===active.id&&x.index===index).sort((a,b)=>a.start-b.start)
}
function words(p,index){
 const ranges=clipRanges(index);
 if(!ranges.length)return wordMarkup(p);
 let html='',cursor=0;
 ranges.forEach(r=>{
  const start=Math.max(cursor,r.start),end=Math.min(p.length,r.end);
  if(end<=start)return;
  html+=wordMarkup(p.slice(cursor,start))+'<mark class="saved-expression" data-clip-ids="'+esc(clipDomId(r.c,r.i))+'">'+wordMarkup(p.slice(start,end))+'</mark>';
  cursor=end;
 });
 return html+wordMarkup(p.slice(cursor))
}
function item(a){return '<button class="item" data-open="'+esc(a.id)+'"><strong>'+esc(a.title)+'</strong><small>'+esc(a.level)+' · '+esc(a.topic)+'</small></button>'}
function render(animate=false){
 clearChoice();
 document.documentElement.style.setProperty('--read',scale+'px');$('#today').className=view==='today'?'active':'';$('#saved').className=view==='saved'?'active':'';
 const heading='<div class="heading"><h1>'+(view==='saved'?'我的收藏':'今日阅读')+'</h1><span class="date">'+new Date(day+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}).toUpperCase()+'</span></div>';
 if(view==='saved'){renderLibrary(heading);return}
 const a=active,n=Object.keys(done).length,length=a.paragraphs.join(' ').split(/\s+/).length;
 $('#main').innerHTML=heading+'<div class="grid"><section><div class="hero"><div class="heroText"><span class="ey">✧ &nbsp; '+(a.id===initial().id?'THE DAILY READ':'READING ARCHIVE')+'</span><h2>'+esc(a.title)+'</h2><div class="meta"><span class="tag">'+esc(a.level)+'</span><span>'+esc(a.topic)+'</span><span>· '+Math.max(1,Math.ceil(length/120))+' min</span></div></div><img src="moon.jpg" alt="版画风的月夜山峦"></div><article class="panel paper"><div class="bar"><h3>阅读正文</h3><div class="actions"><button id="size" title="调整正文字号">Aa</button><button id="bookmark" class="favorite-star" aria-label="'+(saved[a.id]?'取消收藏文章':'收藏文章')+'" title="'+(saved[a.id]?'取消收藏文章':'收藏文章')+'" aria-pressed="'+Boolean(saved[a.id])+'">'+favoriteIcon+'</button></div></div><p class="hint">单击单词查义，双击收藏单词；长按或拖选文字收藏表达</p><div class="text" lang="en">'+a.paragraphs.map((p,i)=>'<p data-paragraph="'+i+'">'+words(p,i)+'</p>').join('')+'</div>'+(a.source?'<p><a href="'+esc(a.source)+'" target="_blank" rel="noopener">Wikipedia · 原文及作者</a> · CC BY-SA 4.0</p>':'')+'<button class="done" id="finish" '+(done[a.id]?'disabled':'')+'>'+(done[a.id]?'✓ 已读完 · 星星已入罐':'✧ 读完了，收下一颗星')+'</button></article></section><aside><section class="panel jarpanel"><h3>✧ &nbsp;我的星星罐</h3><div class="jarArt" aria-hidden="true"><i class="spark" style="top:18px;left:13px">✧</i><i class="spark" style="right:6px;top:57px">✦</i><i class="spark" style="left:17px;top:91px;font-size:13px">✧</i><div class="glass"><div class="stars '+(animate?'drop':'')+'">'+('★'.repeat(Math.min(n,15)))+'</div></div></div><span class="count">'+n+'</span> 颗星星<p>每读完一篇，收集一颗星星</p></section><section class="panel side"><h3>更多阅读</h3><select id="filter" aria-label="文章难度">'+['全部',...new Set(all().map(v=>v.level))].map(v=>'<option '+(v===filter?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'+ (all().filter(b=>b.id!==a.id&&(filter==='全部'||b.level===filter)).map(item).join('')||'<p>该难度暂无其他文章</p>')+'</section></aside></div>';
 $('#size').onclick=()=>{scale=scale>=24?18:scale+2;put('scale',scale);render()};$('#bookmark').onclick=e=>{const button=e.currentTarget,on=!saved[a.id];if(on)saved[a.id]=a;else delete saved[a.id];put('saved',saved);button.setAttribute('aria-pressed',on);button.setAttribute('aria-label',on?'取消收藏文章':'收藏文章');button.title=on?'取消收藏文章':'收藏文章';button.classList.remove('star-just-toggled');void button.offsetWidth;button.classList.add('star-just-toggled');notice(on?'文章已收藏':'已取消文章收藏')};$('#finish').onclick=()=>{if(done[a.id])return;done[a.id]=true;put('done',done);render();dropStar()};$('#filter').onchange=e=>{filter=e.target.value;render()}
}
let lookup=0;
async function showWord(raw){const id=++lookup,w=raw.toLowerCase(),d=WORDS[w];const p=active.paragraphs.find(s=>s.toLowerCase().match(new RegExp('\\b'+w+'\\b')))||'';const sentence=p.match(/[^.!?]+[.!?]?/g)?.find(s=>s.toLowerCase().includes(w))?.trim()||p;
const body=(def)=>{if(id!==lookup)return;$('#definition').innerHTML='<span class="ey">WORD CARD</span><h2>'+esc(raw)+'</h2>'+def+'<hr><small>文中例句</small><p lang="en">'+esc(sentence)+'</p>'};if(!$('#card').open)$('#card').showModal();if(d){body('<p>'+esc(d.pos||'')+' '+esc(d.ipa||'')+'</p><strong>'+esc(d.zh)+'</strong>'+[['构词与词源',d.formation],['词族',d.family],['搭配',d.collocation],['例句',d.example]].filter(x=>x[1]).map(([k,v])=>'<p><small>'+k+'</small><br>'+esc(v)+'</p>').join(''));return}
body('<p>正在查词…</p>');try{const res=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(w),{signal:AbortSignal.timeout(5500)});const data=await res.json();const m=data[0].meanings[0];body('<p>'+esc(m.partOfSpeech)+'</p><strong>'+esc(m.definitions[0].definition)+'</strong>')}catch{body('<p><a target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/english-chinese-simplified/'+encodeURIComponent(w)+'">查看剑桥英汉词典 ↗</a></p>')}}
function toggleWordFavorite(raw,paragraphIndex){
 const key=raw.toLowerCase(),on=!wordFavorites[key];
 if(on){wordFavorites[key]={word:raw,articleId:active.id,paragraph:Number(paragraphIndex||0)};quoteArticles[active.id]=active;put('quoteArticles',quoteArticles)}
 else delete wordFavorites[key];
 put('wordFavorites',wordFavorites);
 document.querySelectorAll('[data-word]').forEach(el=>{if(el.dataset.word.toLowerCase()===key){el.classList.toggle('saved-word',on);el.title=on?'双击取消收藏':'单击查词，双击收藏'}});
 notice(on?'单词已收藏':'已取消单词收藏')
}
let wordClickTimer;
$('#close').onclick=()=>$('#card').close();$('#card').onclick=e=>{if(e.target===$('#card'))$('#card').close()};$('#main').onclick=e=>{let el=e.target.closest('[data-open],[data-word]');if(!el)return;if(el.dataset.word){if(!window.getSelection()?.isCollapsed)return;clearTimeout(wordClickTimer);if(e.detail>1){toggleWordFavorite(el.dataset.word,el.closest('p')?.dataset.paragraph);return}wordClickTimer=setTimeout(()=>showWord(el.dataset.word),230)}else{active=all().find(a=>a.id===el.dataset.open);selected=true;view='today';render();window.scrollTo(0,0)}};
$('#main').ondblclick=e=>{const el=e.target.closest('[data-word]');if(el)e.preventDefault()};
$('#main').onkeydown=e=>{if(e.target.dataset.word&&['Enter',' '].includes(e.key)){e.preventDefault();showWord(e.target.dataset.word)}};
$('#saved').innerHTML=favoriteIcon+' 收藏库';$('#saved').onclick=()=>{view=view==='saved'?'today':'saved';render()};$('#today').onclick=()=>{view='today';selected=false;active=initial();render()};
async function refresh(){day=datestr();active=initial();render();if(daily[day])return;const key=day;
try{const path=key.replaceAll('-','/');let res=await fetch('./feed/'+path+'.json',{signal:AbortSignal.timeout(6000)});if(!res.ok)res=await fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/featured/'+path,{signal:AbortSignal.timeout(6000)});const j=(await res.json()).tfa;if(!j?.extract)return;daily[key]={id:'wiki-'+j.title,title:j.titles.normalized,topic:'Wikipedia',level:'进阶',paragraphs:[j.extract],focus:[],source:'https://en.wikipedia.org/wiki/'+encodeURIComponent(j.title)};put('daily',daily);if(!selected&&key===day){active=initial();render()}}catch{}}
const clips=load('clips',[]), quoteArticles=load('quoteArticles',{}), wordFavorites=load('wordFavorites',{});
let choice=null, section='clips';
const picker=document.createElement('button');
picker.className='clipPicker';picker.hidden=true;picker.innerHTML=favoriteIcon+'<span>收藏选中表达</span>';
document.body.append(picker);
function clearChoice(){choice=null;picker.hidden=true}
document.addEventListener('selectionchange',()=>{
 const sel=getSelection(), box=$('.text');
 if(!sel?.rangeCount||sel.isCollapsed||!box){clearChoice();return}
 const range=sel.getRangeAt(0);
 if(!box.contains(range.startContainer)||!box.contains(range.endContainer)){clearChoice();return}
 const para=node=>(node.nodeType===1?node:node.parentElement).closest('p');
 const paragraphs=[...box.children],first=paragraphs.indexOf(para(range.startContainer)),last=paragraphs.indexOf(para(range.endContainer));
 const text=sel.toString().trim();
 if(!text||first<0||last<first){clearChoice();return}
 const before=range.cloneRange();before.selectNodeContents(paragraphs[first]);before.setEnd(range.startContainer,range.startOffset);
 const segments=[];
 for(let i=first;i<=last;i++){
  const start=i===first?before.toString().length:0;
  const end=i===last?(i===first?start+range.toString().length:new Range()):paragraphs[i].textContent.length;
  segments.push({index:i,start,end:typeof end==='number'?end:paragraphs[i].textContent.length});
 }
 if(first!==last){
  const tail=range.cloneRange();tail.selectNodeContents(paragraphs[last]);tail.setEnd(range.endContainer,range.endOffset);segments[segments.length-1].end=tail.toString().length;
 }
 choice={id:'clip-'+Date.now().toString(36),articleId:active.id,first,last,start:before.toString().length,text,segments};
 picker.hidden=false;
});
picker.onpointerdown=e=>e.preventDefault();
picker.onclick=()=>{
 if(!choice)return;
 const record={...choice};
 if(!clips.some(c=>c.articleId===record.articleId&&c.first===record.first&&c.start===record.start&&c.text===record.text)){
 quoteArticles[active.id]=active;put('quoteArticles',quoteArticles);
 clips.unshift(record);put('clips',clips)}
 getSelection().removeAllRanges();const savedRecord=record;clearChoice();const y=scrollY;render();scrollTo(0,y);focusSavedExpression(savedRecord,false);notice('已收藏到「句子与表达」')
};
function notice(msg){const n=document.createElement('div');n.className='readNotice';n.setAttribute('role','status');n.textContent=msg;document.body.append(n);setTimeout(()=>n.remove(),1500)}
function dropStar(){
 const jar=$('.jarpanel'),glass=$('.glass'),stars=$('.stars'),n=Object.keys(done).length;
 jar.scrollIntoView({block:'center',behavior:'instant'});
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 stars.textContent='★'.repeat(Math.min(n-1,15));
 const star=document.createElement('span');star.className='fallingStar';star.textContent='★';glass.append(star);
 const flight=star.animate([{transform:'translate(-70px,-115px) rotate(-125deg) scale(1.6)'},{offset:.46,transform:'translate(-8px,-93px) rotate(-38deg) scale(1.3)'},{offset:.85,transform:'translate(0,0) rotate(9deg)'},{transform:'translate(0,-4px) rotate(0)'}],{duration:950,easing:'ease-in-out'});
 flight.onfinish=()=>{star.remove();stars.textContent='★'.repeat(Math.min(n,15));glass.animate([{rotate:'0deg'},{rotate:'5deg'},{rotate:'-3deg'},{rotate:'0deg'}],{duration:330})}
}
function renderLibrary(heading){
 const articles=Object.values(saved).reverse(),favoriteWords=Object.entries(wordFavorites);
 let cards,title,empty;
 if(section==='clips'){title='句子与表达';cards=clips.map((c,i)=>'<button class="shelfCard" data-clip="'+i+'"><strong lang="en">'+esc(c.text)+'</strong><small>'+esc(quoteArticles[c.articleId]?.title)+'</small></button>').join('');empty='在正文中选中一句话或一个短语，再点「收藏选中表达」。'}
 else if(section==='words'){title='收藏单词';cards=favoriteWords.map(([key,w])=>'<button class="shelfCard wordShelf" data-saved-word="'+esc(key)+'"><strong lang="en">'+esc(w.word)+'</strong><small>'+esc(quoteArticles[w.articleId]?.title||'阅读收藏')+' · 双击取消收藏</small></button>').join('');empty='在正文中双击任意单词即可收藏。'}
 else{title='收藏文章';cards=articles.map(a=>'<button class="shelfCard" data-open="'+esc(a.id)+'"><strong>'+esc(a.title)+'</strong><small>'+esc(a.topic)+' · '+esc(a.level)+'</small></button>').join('');empty='在阅读正文上方点星星收藏文章。'}
 $('#main').innerHTML=heading+'<div class="shelf"><aside class="panel"><h3>'+favoriteIcon+' 收藏库</h3>'+[['clips','句子与表达',clips.length],['words','单词',favoriteWords.length],['articles','文章',articles.length]].map(([key,name,n])=>'<button data-section="'+key+'" aria-pressed="'+(section===key)+'">'+name+' <small>'+n+'</small></button>').join('')+'</aside><section><h3>'+title+'</h3><div class="shelfGrid">'+(cards||empty)+'</div></section></div>';
 document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{section=b.dataset.section;render()});
 document.querySelectorAll('[data-clip]').forEach(b=>b.onclick=()=>clipDetail(Number(b.dataset.clip)));
 document.querySelectorAll('[data-saved-word]').forEach(b=>b.ondblclick=()=>{delete wordFavorites[b.dataset.savedWord];put('wordFavorites',wordFavorites);render()})
}
function focusSavedExpression(c,smooth=true){
 const index=clips.indexOf(c),id=clipDomId(c,index<0?0:index);
 const mark=[...document.querySelectorAll('.saved-expression')].find(el=>el.dataset.clipIds?.split(' ').includes(id));
 const paragraph=mark?.closest('p')||$('.text')?.children[c.first];if(!paragraph)return;
 (mark||paragraph).scrollIntoView({block:'center',behavior:smooth?'smooth':'auto'});
 paragraph.classList.remove('clip-paragraph-focus');mark?.classList.remove('clip-focus');void paragraph.offsetWidth;
 paragraph.classList.add('clip-paragraph-focus');mark?.classList.add('clip-focus');
 setTimeout(()=>{paragraph.classList.remove('clip-paragraph-focus');mark?.classList.remove('clip-focus')},1150)
}
function clipDetail(i){
 const c=clips[i],a=quoteArticles[c.articleId];if(!a)return;
 $('#definition').innerHTML='<button id="unclip" class="favorite-star" aria-label="取消收藏表达" aria-pressed="true">'+favoriteIcon+'</button><blockquote>'+esc(c.text)+'</blockquote><small>'+esc(a.title)+' · 第 '+(c.first+1)+' 段</small>'+a.paragraphs.slice(c.first,c.last+1).map(p=>'<p>'+esc(p)+'</p>').join('')+'<button class="done" id="readSource">回到原文</button>';
 $('#card').showModal();
 $('#unclip').onclick=()=>{clips.splice(i,1);put('clips',clips);if(!clips.some(x=>x.articleId===a.id)){delete quoteArticles[a.id];put('quoteArticles',quoteArticles)}$('#card').close();render()};
 $('#readSource').onclick=()=>{$('#card').close();view='today';active=a;selected=true;render();requestAnimationFrame(()=>requestAnimationFrame(()=>focusSavedExpression(c,true)))}
}

refresh();setInterval(()=>{if(day!==datestr())refresh()},30000);
