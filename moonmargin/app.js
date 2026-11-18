const favoriteIcon='<svg class="star-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="star-body" d="M15.39,6.21 Q16.00,4.90 16.61,6.21 L18.68,10.66 Q19.29,11.97 20.73,12.15 L25.59,12.74 Q27.03,12.92 25.97,13.90 L22.39,17.24 Q21.33,18.23 21.60,19.65 L22.54,24.46 Q22.82,25.88 21.55,25.18 L17.27,22.80 Q16.00,22.10 14.73,22.80 L10.45,25.18 Q9.18,25.88 9.46,24.46 L10.40,19.65 Q10.67,18.23 9.61,17.24 L6.03,13.90 Q4.97,12.92 6.41,12.74 L11.27,12.15 Q12.71,11.97 13.32,10.66 L15.39,6.21 Z"/><path class="star-spark" d="M27 3v4m-2-2h4M3 25v3m-1.5-1.5h3"/></svg>';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(k,def){try{return JSON.parse(localStorage.getItem('mm-'+k))??def}catch{return def}}
function put(k,v){localStorage.setItem('mm-'+k,JSON.stringify(v))}
let saved=load('saved',{}),done=load('done',{}),daily=load('daily',{}),scale=load('scale',20),view='today',filter='全部',active,day,selected=false;
const all=()=>Object.values(Object.fromEntries([...ARTICLES,...Object.values(daily),...Object.values(saved),...Object.values(quoteArticles)].map(a=>[a.id,a])));
function datestr(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())}
function initial(){const n=Math.floor((Date.parse(day)-Date.parse('2026-11-18'))/86400000);return daily[day]||ARTICLES[((n%ARTICLES.length)+ARTICLES.length)%ARTICLES.length]}
function words(p){return esc(p).replace(/[A-Za-z]+(?:[’'][A-Za-z]+)*/g,w=>'<span role="button" tabindex="0" class="word '+(active.focus?.includes(w.toLowerCase())?'focus':'')+'" data-word="'+w+'">'+w+'</span>')}
function item(a){return '<button class="item" data-open="'+esc(a.id)+'"><strong>'+esc(a.title)+'</strong><small>'+esc(a.level)+' · '+esc(a.topic)+'</small></button>'}
function render(animate=false){
 clearChoice();
 document.documentElement.style.setProperty('--read',scale+'px');$('#today').className=view==='today'?'active':'';$('#saved').className=view==='saved'?'active':'';
 const heading='<div class="heading"><h1>'+(view==='saved'?'我的收藏':'今日阅读')+'</h1><span class="date">'+new Date(day+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}).toUpperCase()+'</span></div>';
 if(view==='saved'){renderLibrary(heading);return}
 const a=active,n=Object.keys(done).length,length=a.paragraphs.join(' ').split(/\s+/).length;
 $('#main').innerHTML=heading+'<div class="grid"><section><div class="hero"><div class="heroText"><span class="ey">✧ &nbsp; '+(a.id===initial().id?'THE DAILY READ':'READING ARCHIVE')+'</span><h2>'+esc(a.title)+'</h2><div class="meta"><span class="tag">'+esc(a.level)+'</span><span>'+esc(a.topic)+'</span><span>· '+Math.max(1,Math.ceil(length/120))+' min</span></div></div><img src="moon.jpg" alt="版画风的月夜山峦"></div><article class="panel paper"><div class="bar"><h3>阅读正文</h3><div class="actions"><button id="size" title="调整正文字号">Aa</button><button id="bookmark" aria-label="收藏文章" aria-pressed="'+Boolean(saved[a.id])+'">'+favoriteIcon+(saved[a.id]?' 已收藏':' 收藏')+'</button></div></div><p class="hint">轻点单词查义，长按或拖选文字收藏表达</p><div class="text" lang="en">'+a.paragraphs.map(p=>'<p>'+words(p)+'</p>').join('')+'</div>'+(a.source?'<p><a href="'+esc(a.source)+'" target="_blank" rel="noopener">Wikipedia · 原文及作者</a> · CC BY-SA 4.0</p>':'')+'<button class="done" id="finish" '+(done[a.id]?'disabled':'')+'>'+(done[a.id]?'✓ 已读完 · 星星已入罐':'✧ 读完了，收下一颗星')+'</button></article></section><aside><section class="panel jarpanel"><h3>✧ &nbsp;我的星星罐</h3><div class="jarArt" aria-hidden="true"><i class="spark" style="top:18px;left:13px">✧</i><i class="spark" style="right:6px;top:57px">✦</i><i class="spark" style="left:17px;top:91px;font-size:13px">✧</i><div class="glass"><div class="stars '+(animate?'drop':'')+'">'+('★'.repeat(Math.min(n,15)))+'</div></div></div><span class="count">'+n+'</span> 颗星星<p>每读完一篇，收集一颗星星</p></section><section class="panel side"><h3>更多阅读</h3><select id="filter" aria-label="文章难度">'+['全部',...new Set(all().map(v=>v.level))].map(v=>'<option '+(v===filter?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'+ (all().filter(b=>b.id!==a.id&&(filter==='全部'||b.level===filter)).map(item).join('')||'<p>该难度暂无其他文章</p>')+'</section></aside></div>';
 $('#size').onclick=()=>{scale=scale>=24?18:scale+2;put('scale',scale);render()};$('#bookmark').onclick=()=>{if(saved[a.id])delete saved[a.id];else saved[a.id]=a;put('saved',saved);render()};$('#finish').onclick=()=>{if(done[a.id])return;done[a.id]=true;put('done',done);render();dropStar()};$('#filter').onchange=e=>{filter=e.target.value;render()}
}
let lookup=0;
async function showWord(raw){const id=++lookup,w=raw.toLowerCase(),d=WORDS[w];const p=active.paragraphs.find(s=>s.toLowerCase().match(new RegExp('\\b'+w+'\\b')))||'';const sentence=p.match(/[^.!?]+[.!?]?/g)?.find(s=>s.toLowerCase().includes(w))?.trim()||p;
const body=(def)=>{if(id!==lookup)return;$('#definition').innerHTML='<span class="ey">WORD CARD</span><h2>'+esc(raw)+'</h2>'+def+'<hr><small>文中例句</small><p lang="en">'+esc(sentence)+'</p>'};if(!$('#card').open)$('#card').showModal();if(d){body('<p>'+esc(d.pos||'')+' '+esc(d.ipa||'')+'</p><strong>'+esc(d.zh)+'</strong>'+[['构词与词源',d.formation],['词族',d.family],['搭配',d.collocation],['例句',d.example]].filter(x=>x[1]).map(([k,v])=>'<p><small>'+k+'</small><br>'+esc(v)+'</p>').join(''));return}
body('<p>正在查词…</p>');try{const res=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(w),{signal:AbortSignal.timeout(5500)});const data=await res.json();const m=data[0].meanings[0];body('<p>'+esc(m.partOfSpeech)+'</p><strong>'+esc(m.definitions[0].definition)+'</strong>')}catch{body('<p><a target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/english-chinese-simplified/'+encodeURIComponent(w)+'">查看剑桥英汉词典 ↗</a></p>')}}
$('#close').onclick=()=>$('#card').close();$('#card').onclick=e=>{if(e.target===$('#card'))$('#card').close()};$('#main').onclick=e=>{let el=e.target.closest('[data-open],[data-word]');if(!el)return;if(el.dataset.word){if(!window.getSelection()?.isCollapsed)return;showWord(el.dataset.word);}else{active=all().find(a=>a.id===el.dataset.open);selected=true;view='today';render();window.scrollTo(0,0)}};
$('#main').onkeydown=e=>{if(e.target.dataset.word&&['Enter',' '].includes(e.key)){e.preventDefault();showWord(e.target.dataset.word)}};
$('#saved').innerHTML=favoriteIcon+' 收藏库';$('#saved').onclick=()=>{view=view==='saved'?'today':'saved';render()};$('#today').onclick=()=>{view='today';selected=false;active=initial();render()};
async function refresh(){day=datestr();active=initial();render();if(daily[day])return;const key=day;
try{const path=key.replaceAll('-','/');let res=await fetch('./feed/'+path+'.json',{signal:AbortSignal.timeout(6000)});if(!res.ok)res=await fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/featured/'+path,{signal:AbortSignal.timeout(6000)});const j=(await res.json()).tfa;if(!j?.extract)return;daily[key]={id:'wiki-'+j.title,title:j.titles.normalized,topic:'Wikipedia',level:'进阶',paragraphs:[j.extract],focus:[],source:'https://en.wikipedia.org/wiki/'+encodeURIComponent(j.title)};put('daily',daily);if(!selected&&key===day){active=initial();render()}}catch{}}
const clips=load('clips',[]), quoteArticles=load('quoteArticles',{});
let choice=null, section='clips';
const picker=document.createElement('button');
picker.className='clipPicker';picker.hidden=true;picker.textContent='☆ 收藏选中表达';
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
 choice={articleId:active.id,first,last,start:before.toString().length,text};
 picker.hidden=false;
});
picker.onpointerdown=e=>e.preventDefault();
picker.onclick=()=>{
 if(!choice)return;
 const record={...choice};
 if(!clips.some(c=>c.articleId===record.articleId&&c.first===record.first&&c.start===record.start&&c.text===record.text)){
 quoteArticles[active.id]=active;put('quoteArticles',quoteArticles);
 clips.unshift(record);put('clips',clips)}
 getSelection().removeAllRanges();clearChoice();notice('已收藏到「句子与表达」')
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
 const articles=Object.values(saved).reverse();
 const cards=section==='clips'?clips.map((c,i)=>'<button class="shelfCard" data-clip="'+i+'"><strong lang="en">'+esc(c.text)+'</strong><small>'+esc(quoteArticles[c.articleId]?.title)+'</small></button>').join(''):articles.map(a=>'<button class="shelfCard" data-open="'+esc(a.id)+'"><strong>'+esc(a.title)+'</strong><small>'+esc(a.topic)+' · '+esc(a.level)+'</small></button>').join('');
 $('#main').innerHTML=heading+'<div class="shelf"><aside class="panel"><h3>★ 收藏库</h3>'+[['clips','句子与表达',clips.length],['articles','文章',articles.length]].map(([key,name,n])=>'<button data-section="'+key+'" aria-pressed="'+(section===key)+'">'+name+' <small>'+n+'</small></button>').join('')+'</aside><section><h3>'+(section==='clips'?'句子与表达':'收藏文章')+'</h3><div class="shelfGrid">'+(cards||(section==='clips'?'在正文中选中一句话或一个短语，再点「收藏选中表达」。':'在阅读正文上方点 ☆ 收藏文章。'))+'</div></section></div>';
 document.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>{section=b.dataset.section;render()});
 document.querySelectorAll('[data-clip]').forEach(b=>b.onclick=()=>clipDetail(Number(b.dataset.clip)))
}
function clipDetail(i){
 const c=clips[i],a=quoteArticles[c.articleId];if(!a)return;
 $('#definition').innerHTML='<button id="unclip" aria-label="取消收藏表达" aria-pressed="true">★ 已收藏</button><blockquote>'+esc(c.text)+'</blockquote><small>'+esc(a.title)+' · 第 '+(c.first+1)+' 段</small>'+a.paragraphs.slice(c.first,c.last+1).map(p=>'<p>'+esc(p)+'</p>').join('')+'<button class="done" id="readSource">回到原文</button>';
 $('#card').showModal();
 $('#unclip').onclick=()=>{clips.splice(i,1);put('clips',clips);if(!clips.some(x=>x.articleId===a.id)){delete quoteArticles[a.id];put('quoteArticles',quoteArticles)}$('#card').close();render()};
 $('#readSource').onclick=()=>{$('#card').close();view='today';active=a;selected=true;render();$('.text').children[c.first]?.scrollIntoView({block:'center'})}
}

refresh();setInterval(()=>{if(day!==datestr())refresh()},30000);
