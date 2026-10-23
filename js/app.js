const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',lib:'<path d="M4 4v16M9 4v16M14 5l6 15"/>',play:'<path fill="currentColor" d="M7 4l13 8-13 8z"/>',pause:'<path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z"/>',prev:'<path fill="currentColor" d="M6 4h2v16H6zM20 4v16L9 12z"/>',next:'<path fill="currentColor" d="M16 4h2v16h-2zM4 4v16l11-8z"/>',heart:'<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z"/>',shuf:'<path d="M3 6h4l10 12h4M3 18h4l3-4M14 10l3-4h4M18 3l3 3-3 3M18 15l3 3-3 3"/>',rep:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',vol:'<path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',mute:'<path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',q:'<path d="M3 6h14M3 12h14M3 18h8M18 15v6M15 18h6"/>',timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',eq:'<path d="M6 3v6M6 13v8M12 3v10M12 17v4M18 3v3M18 10v11M3 9h6M9 15h6M15 6h6"/>',down:'<path d="M5 9l7 7 7-7"/>',dots:'<path d="M12 5v.01M12 12v.01M12 19v.01" stroke-width="3"/>',plus:'<path d="M12 5v14M5 12h14"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',up:'<path d="M5 15l7-7 7 7"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',ul:'<path d="M12 16V5M7 9l5-4 5 4M5 20h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',sort:'<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',ind:'<path fill="currentColor" stroke="none" d="M5 12h3v8H5zM10.5 5h3v15h-3zM16 9h3v11h-3z"/>'};
const I=(n,f)=>`<svg viewBox="0 0 24 24" fill="${f?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[n]}</svg>`;

/* ---- storage (IndexedDB: songs + metadata) ---- */
const db=await new Promise((ok,no)=>{const r=indexedDB.open('moose',1);r.onupgradeneeded=()=>{r.result.createObjectStore('meta',{keyPath:'id'});r.result.createObjectStore('blobs')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=(s,m='readonly')=>db.transaction(s,m).objectStore(s),rq=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const put=m=>rq(tx('meta','readwrite').put(m)),getBlob=id=>rq(tx('blobs').get(id));

/* ---- generated covers ---- */
const hs=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)},hue=t=>hs(t)%360;
const cols=t=>[`hsl(${hue(t)} 75% 58%)`,`hsl(${(hue(t)+45)%360} 70% 30%)`],cov=t=>`linear-gradient(135deg,${cols(t)})`;
const artUrl=(t,n)=>new Promise(ok=>{const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,n,n);g.addColorStop(0,cols(t)[0]);g.addColorStop(1,cols(t)[1]);x.fillStyle=g;x.fillRect(0,0,n,n);c.toBlob(b=>ok(URL.createObjectURL(b)))});

/* ---- state ---- */
const A=new Audio(),S={songs:[],q:[],i:-1,tab:'home',mode:'all',sort:'added',chip:'Songs',shuf:+(localStorage.getItem('moose.shuf')||0),rep:+(localStorage.getItem('moose.rep')||0),src:'Library',grp:{},sl:0,vol:+(localStorage.getItem('moose.vol')??10)};
A.volume=S.vol/10;
const T={all:'Library',liked:'Liked songs',recent:'Recently added',most:'Most played'},SN={added:'Recently added',title:'Title',artist:'Artist'};
const cur=()=>S.songs.find(s=>s.id===S.q[S.i]),fmt=t=>isFinite(t)&&t>0?`${t/60|0}:${String(t%60|0).padStart(2,'0')}`:'0:00';
const toast=(m,ms=2200)=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),ms)};
/* back button closes the player / sheet instead of leaving the app */
const L=[];let skip=0;
const push=k=>{L.push(k);history.pushState(0,'')};
const hide=k=>{if(k=='s')$('#sheet').innerHTML='';else if(k=='p')$('#player').classList.remove('open')};
function shut(k){const i=L.lastIndexOf(k);if(i<0)return;L.splice(i,1);hide(k);skip++;history.back()}
addEventListener('popstate',()=>{if(skip){skip--;return}const k=L.pop();if(k)hide(k)});

/* ---- library actions ---- */
async function addFiles(fs){fs=fs.filter(f=>/^audio\//.test(f.type)||/\.(mp3|m4a|aac|wav|ogg|opus|flac)$/i.test(f.name));if(!fs.length)return toast('No audio files found');let n=0,d=0,full=0;const bad=[];
for(const[k,f]of fs.entries()){toast(`Adding ${k+1} of ${fs.length}...`,6e4);try{
const buf=f.size<=26214400?await f.arrayBuffer():await new Blob([String(f.size),f.slice(0,1<<20),f.slice(-(1<<20))]).arrayBuffer();
const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',buf))].map(b=>b.toString(16).padStart(2,'0')).join('');
if(S.songs.some(s=>s.id==h)){d++;continue}
const dur=await new Promise(ok=>{const a=new Audio(),u=URL.createObjectURL(f);a.preload='metadata';a.onloadedmetadata=()=>{ok(a.duration);URL.revokeObjectURL(u)};a.onerror=()=>{ok(NaN);URL.revokeObjectURL(u)};a.src=u});
if(isNaN(dur)){bad.push(f.name);continue}
const now=Date.now(),m={id:h,fileName:f.name,title:f.name.replace(/\.[^.]+$/,''),artist:'Unknown artist',album:'',duration:dur,size:f.size,mime:f.type,addedAt:now,updatedAt:now,lastPlayedAt:0,playCount:0,liked:false};
await rq(tx('blobs','readwrite').put(f,h));await put(m);S.songs.push(m);n++}catch(e){if(e.name=='QuotaExceededError')full=1;bad.push(f.name)}}
toast(`${n} added`+(d?`, ${d} duplicate skipped`:'')+(bad.length?`, ${bad.length} failed (${full?'storage full':bad[0]})`:''),4500);render(1)}
async function del(id){const c=cur()?.id;await rq(tx('meta','readwrite').delete(id));await rq(tx('blobs','readwrite').delete(id));S.songs=S.songs.filter(s=>s.id!=id);S.q=S.q.filter(x=>x!=id);S.i=S.q.indexOf(c);if(c==id){A.pause();A.removeAttribute('src');localStorage.removeItem('moose.last');shut('p');mini();rp()}render(1)}

/* ---- player engine ---- */
function playList(ids,id,src){S.q=ids.slice();S.src=src;playAt(S.q.indexOf(id))}
async function playAt(i){S.i=i;const s=cur();if(!s)return;try{const b=await getBlob(s.id);if(!b)throw 0;S.url&&URL.revokeObjectURL(S.url);S.url=URL.createObjectURL(b);A.src=S.url;await A.play();s.playCount++;s.lastPlayedAt=s.updatedAt=Date.now();put(s);sv()}catch(e){toast("Can't play this file")}ms();rp();mini();render(1)}
function next(auto){if(!S.q.length)return;let n;if(S.shuf&&S.q.length>1){do n=Math.random()*S.q.length|0;while(n==S.i)}else n=S.i+1;if(n>=S.q.length){if(S.rep==1||!auto)n=0;else{A.pause();return}}playAt(n)}
function prev(){if(A.currentTime>3||S.i<=0)A.currentTime=0;else playAt(S.i-1)}
const sv=()=>{if(cur())localStorage.setItem('moose.last',JSON.stringify({q:S.q,i:S.i,t:A.currentTime,src:S.src}))};
A.onended=()=>S.rep==2?(A.currentTime=0,A.play()):next(true);
A.onplay=A.onpause=()=>{if(A.paused)sv();if('mediaSession'in navigator)navigator.mediaSession.playbackState=A.paused?'paused':'playing';mini();const b=$('#ppb');if(b)b.innerHTML=I(A.paused?'play':'pause')};
A.ontimeupdate=()=>{upd();if(Date.now()-(S.sv||0)>3000){S.sv=Date.now();sv()}try{navigator.mediaSession.setPositionState({duration:A.duration,playbackRate:A.playbackRate,position:A.currentTime})}catch{}};
A.onloadedmetadata=upd;
function upd(){const d=A.duration||0,p=d?A.currentTime/d*100:0;document.querySelectorAll('.sl,#mini').forEach(e=>e.style.setProperty('--p',p+'%'));document.querySelectorAll('.cur').forEach(e=>e.textContent=fmt(A.currentTime));document.querySelectorAll('.tot').forEach(e=>e.textContent=fmt(d))}

async function restore(){try{const l=JSON.parse(localStorage.getItem('moose.last')||'null');if(!l)return;const ids=new Set(S.songs.map(s=>s.id)),id=l.q[l.i];S.q=l.q.filter(x=>ids.has(x));S.i=S.q.indexOf(id);S.src=l.src||'Library';const s=cur();if(!s)return;const b=await getBlob(s.id);if(!b)return;S.url=URL.createObjectURL(b);A.src=S.url;A.addEventListener('loadedmetadata',()=>{A.currentTime=l.t||0},{once:true});ms();rp();mini()}catch{}}
/* ---- notification / lock screen (Media Session) ---- */
async function ms(){if(!('mediaSession'in navigator))return;const s=cur();if(!s)return;S.au?.forEach(a=>URL.revokeObjectURL(a.src));S.au=await Promise.all([96,256,512].map(async n=>({src:await artUrl(s.id,n),sizes:`${n}x${n}`,type:'image/png'})));navigator.mediaSession.metadata=new MediaMetadata({title:s.title,artist:s.artist,album:s.album||'MOOSE',artwork:S.au})}
if('mediaSession'in navigator){const m=navigator.mediaSession,h=(a,f)=>{try{m.setActionHandler(a,f)}catch{}};h('play',()=>A.play());h('pause',()=>A.pause());h('previoustrack',prev);h('nexttrack',()=>next());h('seekto',d=>{A.currentTime=d.seekTime});h('seekbackward',d=>{A.currentTime=Math.max(0,A.currentTime-(d.seekOffset||10))});h('seekforward',d=>{A.currentTime+=d.seekOffset||10});h('stop',()=>{A.pause();A.currentTime=0})}

/* ---- volume + seek (pointer events) ---- */
const vb=()=>[...Array(10)].map((_,i)=>{const l=i<S.vol,t=i==S.vol-1,c=[242,104,58].map((a,k)=>Math.round(a+([255,208,138][k]-a)*i/9));return`<u class="${t?'top':''}" style="${l&&!t?`background:rgb(${c})`:''}"></u>`}).join('');
function setVol(l){if(l===S.vol)return;S.vol=l;A.volume=l/10;localStorage.setItem('moose.vol',l);navigator.vibrate?.(5);const b=$('#bars');if(b){b.innerHTML=vb();b.setAttribute('aria-valuenow',l);$('#sp').innerHTML=I(l?'vol':'mute')}}
const mv=(e,s)=>{const r=s.getBoundingClientRect();if(s.classList.contains('bars'))setVol(Math.round(Math.max(0,Math.min(1,(r.bottom-e.clientY)/r.height))*10));else if(A.duration)A.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*A.duration};
document.addEventListener('pointerdown',e=>{const s=e.target.closest('.sl,.bars');if(!s)return;s.setPointerCapture(e.pointerId);s._d=1;mv(e,s)});
document.addEventListener('pointermove',e=>{const s=e.target.closest('.sl,.bars');if(s?._d)mv(e,s)});
document.addEventListener('pointerup',e=>{const s=e.target.closest('.sl,.bars');if(s)s._d=0});

/* ---- screens ---- */
const row=g=>s=>{const n=cur()?.id===s.id;return`<div class="row${n?' now':''}" role="button" tabindex="0" data-id="${s.id}" data-g="${g}"><div class="cv" style="background:${cov(s.id)}"></div><div class="tx"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div>${n?I('ind'):`<em>${fmt(s.duration)}</em>`}<button class="rm" data-rm="${s.id}" aria-label="Remove song">${I('dots')}</button></div>`};
const empty=()=>`<div class="em">No songs yet.<br>Tap Add audio files to get started.<button class="pill" data-a="add">${I('plus')}Add audio files</button></div>`;
const list=()=>{let a=[...S.songs];if(S.mode=='liked')a=a.filter(s=>s.liked);if(S.mode=='most')return a.filter(s=>s.playCount).sort((x,y)=>y.playCount-x.playCount);const o=S.mode=='recent'?'added':S.sort;return a.sort(o=='title'?(x,y)=>x.title.localeCompare(y.title):o=='artist'?(x,y)=>x.artist.localeCompare(y.artist):(x,y)=>y.addedAt-x.addedAt)};
const home=()=>{const h=new Date().getHours(),c=S.songs.filter(s=>s.lastPlayedAt).sort((x,y)=>y.lastPlayedAt-x.lastPlayedAt).slice(0,8),r=[...S.songs].sort((x,y)=>y.addedAt-x.addedAt).slice(0,6);S.grp.c=c.map(s=>s.id);S.grp.r=r.map(s=>s.id);
return`<div class="top"><h1 class="logo">MOOSE<i></i></h1><div class="hs"><div class="sl sm" aria-label="Seek"></div><div class="tm"><span class="cur">0:00</span><span class="tot">0:00</span></div></div><button class="rd" data-a="set" aria-label="Settings">${I('gear')}</button></div>
<h2 class="gr">${h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':'Good evening'}</h2><p class="mu">Everything here plays from your phone, no internet needed.</p>
<div class="tiles">${[['liked','Liked songs','heart','#FF7A45,#C8431A'],['recent','Recently added','plus','#7B5CFF,#3A2C9E'],['most','Most played','eq','#22C3A0,#0E7A68'],['all','All songs','lib','#F8B93A,#C47A12']].map(t=>`<button class="tile" data-a="mode" data-m="${t[0]}"><span style="background:linear-gradient(135deg,${t[3]})">${I(t[2],t[0]=='liked')}</span>${t[1]}</button>`).join('')}</div>
${c.length?`<h3>Continue listening</h3><div class="hz">${c.map(s=>`<button class="card" data-id="${s.id}" data-g="c"><div class="cv" style="background:${cov(s.id)}"></div><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></button>`).join('')}</div>`:''}
<h3>Recently added</h3>${r.length?r.map(row('r')).join(''):empty()}`};
const lib=()=>{const l=list();S.grp.l=l.map(s=>s.id);return`<div class="lh"><h1>${T[S.mode]}</h1><button class="pill" data-a="add">${I('plus')}Add audio files</button></div>
<div class="chips">${['Songs','Albums','Artists','Folders'].map(c=>`<button class="chip${S.chip==c?' on':''}" data-a="chip" data-c="${c}">${c}</button>`).join('')}</div>
<div class="sr"><button class="srt" data-a="sort">${I('sort')}Sort: ${SN[S.sort]}</button><button class="pill2" data-a="all">${I('play')}Play all</button></div>
${S.chip!='Songs'?'<p class="em">Albums, artists and folders need ID3 tags and arrive in the next update.</p>':l.length?l.map(row('l')).join(''):empty()}`};
const search=()=>{const l=[...S.songs].sort((x,y)=>y.addedAt-x.addedAt);S.grp.l=l.map(s=>s.id);return`<h1>Search</h1><input id="q" type="search" placeholder="Songs or artists" aria-label="Search songs"><div id="res">${l.length?l.map(row('l')).join(''):empty()}</div>`};
function render(keep){const v=$('#view'),y=v.scrollTop;v.innerHTML=({home,search,lib})[S.tab]();v.scrollTop=keep?y:0;$('#nav').innerHTML=[['home','Home'],['search','Search'],['lib','Library']].map(([k,n])=>`<button class="${S.tab==k?'on':''}" data-a="tab" data-t="${k}" aria-label="${n}">${I(k)}<span>${n}</span></button>`).join('');mini();upd()}
function mini(){const s=cur(),m=$('#mini');m.hidden=!s;if(s)m.innerHTML=`<div class="cv" style="background:${cov(s.id)}"></div><div class="tx"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div><button class="pb" data-a="pp" aria-label="${A.paused?'Play':'Pause'}">${I(A.paused?'play':'pause')}</button>`}
function rp(){const s=cur(),p=$('#player');if(!s){p.innerHTML='';return}p.style.background=`linear-gradient(180deg,hsl(${hue(s.id)} 55% 26%) 0%,#0E0E12 62%)`;
S.grp.q=S.q;const nx=(S.rep==1?[...S.q.slice(S.i+1),...S.q]:S.q.slice(S.i+1)).slice(0,S.shuf?0:2).map(id=>S.songs.find(x=>x.id==id)).filter(Boolean),
up=`<div class="up"><div class="uh"><b>Up next</b><button data-a="q" aria-label="Open queue">Queue</button></div>${nx.length?nx.map(s=>`<div class="row" role="button" tabindex="0" data-id="${s.id}" data-g="q"><div class="cv" style="background:${cov(s.id)}"></div><div class="tx"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div></div>`).join(''):`<p class="mu">${S.shuf?'Shuffle is on':S.rep==2?'Repeating this song':'End of queue'}</p>`}</div>`;
p.innerHTML=`<div class="ph"><button data-a="close" aria-label="Close player">${I('down')}</button><div><small>PLAYING FROM</small><b>${esc(S.src)}</b></div><button data-a="more" aria-label="Remove this song">${I('dots')}</button></div>
<div class="big" style="background:${cov(s.id)}"><span class="mk">M.</span><div class="vol"><div class="bars" id="bars" role="slider" aria-label="Volume" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${S.vol}">${vb()}</div><span id="sp">${I(S.vol?'vol':'mute')}</span></div></div>
<div class="ti"><div><h1>${esc(s.title)}</h1><p>${esc(s.artist)}</p></div><button data-a="like" class="${s.liked?'on':''}" aria-label="Like">${I('heart',s.liked)}</button></div>
<div class="sl" aria-label="Seek"></div><div class="tm"><span class="cur">0:00</span><span class="tot">0:00</span></div>
<div class="ct"><button data-a="shuf" class="${S.shuf?'on':''}" aria-label="Shuffle">${I('shuf')}</button><button data-a="prev" aria-label="Previous">${I('prev')}</button><button class="pp" id="ppb" data-a="pp" aria-label="Play or pause">${I(A.paused?'play':'pause')}</button><button data-a="next" aria-label="Next">${I('next')}</button><button data-a="rep" class="${S.rep?'on':''}" aria-label="Repeat ${['off','all','one'][S.rep]}">${I('rep')}${S.rep==2?'1':''}</button></div>
<div class="ex"><button data-a="q">${I('q')}Queue</button><button data-a="sleep">${I('timer')}Sleep timer</button><button data-a="eq">${I('eq')}Equalizer</button></div>${up}`;upd()}
const sheet=h=>{if(!L.includes('s'))push('s');$('#sheet').innerHTML=`<div class="sb" data-a="sx"></div><div class="sc">${h}</div>`};
let ac,lo,hi,ei=0,st;
const keep=f=>{const y=$('#sheet .sc')?.scrollTop||0;f();const c=$('#sheet .sc');if(c)c.scrollTop=y};
const qh=()=>`<h3>Queue</h3>${S.q.length?S.q.map((id,n)=>{const s=S.songs.find(x=>x.id==id);return s?`<div class="row qr${n==S.i?' now':''}"><div class="tx" role="button" tabindex="0" data-a="qgo" data-n="${n}"><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div><button class="qb" data-a="qup" data-n="${n}" aria-label="Move up">${I('up')}</button><button class="qb" data-a="qdn" data-n="${n}" aria-label="Move down">${I('down')}</button><button class="qb" data-a="qrm" data-n="${n}" aria-label="Remove from queue">${I('x')}</button></div>`:''}).join(''):'<p class="em">Queue is empty</p>'}`;
function qmv(n,k){const m=n+k;if(m<0||m>=S.q.length)return;keep(()=>{[S.q[n],S.q[m]]=[S.q[m],S.q[n]];if(S.i==n)S.i=m;else if(S.i==m)S.i=n;sheet(qh())});rp()}
const Act={tab:d=>{S.tab=d.t;S.mode='all';S.chip='Songs';render()},mode:d=>{S.mode=d.m;S.tab='lib';S.chip='Songs';render()},add:()=>$('#file').click(),
open:()=>{if(cur()){rp();if(!L.includes('p'))push('p');$('#player').classList.add('open')}},close:()=>shut('p'),
pp:()=>A.paused?A.play():A.pause(),next:()=>next(),prev,like:async()=>{const s=cur();s.liked=!s.liked;s.updatedAt=Date.now();await put(s);rp();render(1)},
shuf:()=>{S.shuf^=1;localStorage.setItem('moose.shuf',S.shuf);rp()},rep:()=>{S.rep=(S.rep+1)%3;localStorage.setItem('moose.rep',S.rep);rp()},more:()=>cur()&&Act.askdel({i:cur().id}),
sort:()=>{S.sort={added:'title',title:'artist',artist:'added'}[S.sort];render()},chip:d=>{S.chip=d.c;render()},
all:()=>{const l=S.grp.l;if(l?.length)playList(l,l[0],T[S.mode])},sx:()=>shut('s'),
q:()=>sheet(qh()),qgo:async d=>{await playAt(+d.n);keep(()=>sheet(qh()))},qup:d=>qmv(+d.n,-1),qdn:d=>qmv(+d.n,1),
qrm:d=>{const n=+d.n;if(n==S.i)return toast("Can't remove the playing song");keep(()=>{S.q.splice(n,1);if(n<S.i)S.i--;sheet(qh())});rp()},
sleep:()=>{const m=[0,15,30,45,60][S.sl=(S.sl+1)%5];clearTimeout(st);if(m)st=setTimeout(()=>{A.pause();toast('Sleep timer ended')},m*6e4);toast(m?`Sleep timer: ${m} min`:'Sleep timer off')},
eq:()=>{const p=[['Flat',0,0],['Bass boost',9,0],['Treble boost',0,8]][ei=(ei+1)%3];if(!ac){ac=new AudioContext();const s=ac.createMediaElementSource(A);lo=ac.createBiquadFilter();lo.type='lowshelf';lo.frequency.value=200;hi=ac.createBiquadFilter();hi.type='highshelf';hi.frequency.value=4000;s.connect(lo);lo.connect(hi);hi.connect(ac.destination)}ac.resume();lo.gain.value=p[1];hi.gain.value=p[2];toast('Equalizer: '+p[0])},
menu:d=>{const s=S.songs.find(x=>x.id==d.i);if(s)sheet(`<h3>${esc(s.title)}</h3><button class="mi" data-a="addq" data-i="${s.id}">${I('q')}Play next</button><button class="mi" data-a="likeid" data-i="${s.id}">${I('heart',s.liked)}${s.liked?'Remove from liked':'Add to liked'}</button><button class="mi" data-a="edit" data-i="${s.id}">${I('edit')}Edit info</button><button class="mi dg" data-a="askdel" data-i="${s.id}">${I('x')}Remove from library</button>`)},
addq:d=>{shut('s');if(!S.q.length)return playList([d.i],d.i,'Library');S.q.splice(S.i+1,0,d.i);rp();toast('Will play next')},
likeid:async d=>{shut('s');const s=S.songs.find(x=>x.id==d.i);s.liked=!s.liked;s.updatedAt=Date.now();await put(s);render(1);if(cur()?.id==s.id)rp()},
askdel:d=>{const s=S.songs.find(x=>x.id==d.i);if(s)sheet(`<h3>Remove song?</h3><p class="mu">"${esc(s.title)}" will be deleted from MOOSE on this device.</p><div class="bt"><button class="pill2" data-a="sx">Cancel</button><button class="pill" data-a="dodel" data-i="${s.id}">Remove</button></div>`)},
dodel:d=>{shut('s');del(d.i)},
edit:d=>{const s=S.songs.find(x=>x.id==d.i);if(s)sheet(`<h3>Edit info</h3><label class="fl">Title<input id="et" value="${esc(s.title)}" maxlength="120"></label><label class="fl">Artist<input id="ea" value="${esc(s.artist)}" maxlength="120"></label><div class="bt"><button class="pill2" data-a="sx">Cancel</button><button class="pill" data-a="savein" data-i="${s.id}">Save</button></div>`)},
savein:async d=>{const s=S.songs.find(x=>x.id==d.i);if(!s)return;s.title=$('#et').value.trim()||s.title;s.artist=$('#ea').value.trim()||'Unknown artist';s.updatedAt=Date.now();await put(s);shut('s');render(1);if(cur()?.id==s.id){rp();ms();mini()}toast('Saved')},
set:()=>{sheet(`<div class="ab"><img src="./logo.png" alt="MOOSE logo"><h3>MOOSE</h3><p class="mu">Offline music player. Your songs stay on this device.</p><p class="mu">Version 4.0</p><p class="mu" id="su">Checking storage...</p></div><button class="mi" data-a="exp">${I('dl')}Export backup</button><button class="mi" data-a="imp">${I('ul')}Import backup</button><button class="mi dg" data-a="askclear">${I('x')}Clear library</button><p class="ab"><b>Made by Dipansh Rai</b></p>`);navigator.storage?.estimate?.().then(e=>{const u=$('#su');if(u)u.textContent=`Storage used: ${(e.usage/1048576).toFixed(0)} MB`+(e.quota?` of ${(e.quota/1073741824).toFixed(1)} GB`:'')})},
exp:()=>{const d={app:'MOOSE',version:4,exported:Date.now(),settings:{sort:S.sort,shuf:S.shuf,rep:S.rep},songs:S.songs.map(({id,fileName,title,artist,liked,playCount,lastPlayedAt,addedAt})=>({id,fileName,title,artist,liked,playCount,lastPlayedAt,addedAt}))},u=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='moose-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5e3);toast('Backup downloaded')},
imp:()=>$('#imp').click(),
askclear:()=>sheet(`<h3>Clear library?</h3><p class="mu">All ${S.songs.length} songs will be removed from MOOSE on this device. Your original files are not touched.</p><div class="bt"><button class="pill2" data-a="sx">Cancel</button><button class="pill" data-a="doclear">Clear</button></div>`),
doclear:async()=>{await rq(tx('meta','readwrite').clear());await rq(tx('blobs','readwrite').clear());S.songs=[];S.q=[];S.i=-1;A.pause();A.removeAttribute('src');localStorage.removeItem('moose.last');shut('s');shut('p');mini();rp();render();toast('Library cleared')}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a],[data-id],[data-rm]');if(!b)return;const d=b.dataset;if(d.rm)return Act.menu({i:d.rm});if(d.id){const l=S.grp[d.g]||[d.id];Act.sx();return playList(l,d.id,{c:'Continue listening',r:'Recently added',l:T[S.mode],q:S.src}[d.g]||'Library')}Act[d.a]?.(d)});
document.addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.matches('[role=button]'))e.target.click()});
document.addEventListener('input',e=>{if(e.target.id!='q')return;const q=e.target.value.toLowerCase(),l=S.songs.filter(s=>(s.title+' '+s.artist).toLowerCase().includes(q));S.grp.l=l.map(s=>s.id);$('#res').innerHTML=l.length?l.map(row('l')).join(''):'<p class="em">No matches</p>'});
$('#file').onchange=e=>{const f=[...e.target.files];e.target.value='';addFiles(f)};
$('#imp').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const d=JSON.parse(await f.text());if(d.app!='MOOSE'||!Array.isArray(d.songs))throw 0;let n=0;for(const x of d.songs){const s=S.songs.find(y=>y.id==x.id);if(!s)continue;Object.assign(s,{title:x.title??s.title,artist:x.artist??s.artist,liked:!!x.liked,playCount:x.playCount||0,lastPlayedAt:x.lastPlayedAt||0,updatedAt:Date.now()});await put(s);n++}const t=d.settings||{};if(t.sort in SN)S.sort=t.sort;if([0,1,2].includes(t.rep)){S.rep=t.rep;localStorage.setItem('moose.rep',t.rep)}if([0,1].includes(t.shuf)){S.shuf=t.shuf;localStorage.setItem('moose.shuf',t.shuf)}shut('s');render(1);toast(`Backup restored for ${n} of ${d.songs.length} songs`+(n<d.songs.length?'. Add the other songs, then import again.':''),5000)}catch{toast("That isn't a MOOSE backup file")}};
S.songs=await rq(tx('meta').getAll());await restore();render();navigator.storage?.persist?.();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
