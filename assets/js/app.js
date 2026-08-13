(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const cfg=window.DEVCORE_CONFIG||{};
let player=null, ready=false, queue=[], index=0, timer=null;
const demo=[
 {id:'dQw4w9WgXcQ',title:'Demo Track — YouTube Playback',singer:'YouTube',cover:'assets/devcore-beats-logo.png'},
 {id:'9bZkp7q19f0',title:'Demo Track 2 — YouTube Playback',singer:'YouTube',cover:'assets/devcore-beats-logo.png'},
 {id:'kJQP7kiw5Fk',title:'Demo Track 3 — YouTube Playback',singer:'YouTube',cover:'assets/devcore-beats-logo.png'}
];
const languages={Punjabi:['Punjabi Top 50','Punjabi latest songs'],Haryanvi:['Haryanvi Top 50','Haryanvi latest songs'],Bhojpuri:['Bhojpuri Top 50','Bhojpuri latest songs'],Hindi:['Hindi Top 50','Hindi latest songs']};
const moods=[['Viral Hits',"Today's top tracks",'♫'],['Chill Vibes','Relax & unwind','☁'],['Workout','High energy beats','⚡'],['Late Night','Smooth late night vibes','☾'],['Pop Anthems','Ultimate pop hits','✦'],['Rock Classics','Timeless rock legends','🎸']];
const cards=$('#cards'); if(cards) cards.innerHTML=moods.map((m,i)=>`<article class="card"><div class="art a${i}">${m[2]}</div><div class="cardText"><b>${m[0]}</b><small>${m[1]} • ${35+i*5} songs</small></div><button type="button" data-mood="${i}">▶</button></article>`).join('');
function openModal(){const m=$('#modal');if(m)m.classList.add('show');setTimeout(()=>$('#query')?.focus(),50)}
function closeModal(){ $('#modal')?.classList.remove('show') }
$('#searchOpen')?.addEventListener('click',openModal);$('#startBtn')?.addEventListener('click',openModal);$('#viewAll')?.addEventListener('click',openModal);$('#menuBtn')?.addEventListener('click',openModal);$('#close')?.addEventListener('click',closeModal);
document.addEventListener('click',e=>{const b=e.target.closest('[data-mood]');if(b){openModal();$('#query').value=moods[+b.dataset.mood][0];searchYT(moods[+b.dataset.mood][0]);}});
window.onYouTubeIframeAPIReady=function(){
 ready=true;
 player=new YT.Player('yt',{height:'315',width:'560',videoId:'',playerVars:{playsinline:1,controls:0,rel:0},events:{onReady:()=>{ready=true;},onStateChange:e=>{const p=$('#play');if(p)p.textContent=e.data===1?'❚❚':'▶';if(e.data===0&&queue.length)next();}}});
};
const api=document.createElement('script');api.src='https://www.youtube.com/iframe_api';document.head.appendChild(api);
function esc(x){return String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function fmt(n){n=Math.floor(n||0);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
function renderSongs(list,grid){const box=$(grid);if(!box)return;box.innerHTML=list.map((x,i)=>`<article class="songCard" data-i="${i}"><img src="${esc(x.cover)}" alt=""><button class="songPlay" type="button">▶</button><div class="songInfo"><b>${esc(x.title)}</b><small>🎤 ${esc(x.singer)}</small></div></article>`).join('');box.querySelectorAll('.songCard').forEach(c=>c.addEventListener('click',()=>{queue=list;playTrack(+c.dataset.i);}));}
function fallbackSongs(lang){return demo.map((x,i)=>({...x,title:`${lang} • ${i+1} • ${x.title}`}));}
async function fetchSongs(query){
 const k=String(cfg.YOUTUBE_API_KEY||'').trim();
 if(!k||k.includes('PASTE_')) return fallbackSongs(query.split(' ')[0]);
 const u='https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q='+encodeURIComponent(query)+'&key='+encodeURIComponent(k);
 const r=await fetch(u);const d=await r.json();if(!r.ok||d.error)throw Error(d.error?.message||'YouTube API error');
 return (d.items||[]).filter(x=>x.id?.videoId).map(x=>({id:x.id.videoId,title:x.snippet.title,singer:x.snippet.channelTitle,cover:(x.snippet.thumbnails?.high||x.snippet.thumbnails?.medium||x.snippet.thumbnails?.default)?.url||'assets/devcore-beats-logo.png'}));
}
async function loadLanguage(lang){$('#chartLabel')&&(($('#chartLabel').textContent=lang.toUpperCase()));$('#latestLabel')&&(($('#latestLabel').textContent=lang.toUpperCase()+' • LATEST'));try{const top=await fetchSongs(languages[lang][0]),latest=await fetchSongs(languages[lang][1]);window.topSongs=top;window.latestSongs=latest;renderSongs(top,'#top50Grid');renderSongs(latest,'#latestGrid');}catch(e){window.topSongs=fallbackSongs(lang);window.latestSongs=fallbackSongs(lang);renderSongs(window.topSongs,'#top50Grid');renderSongs(window.latestSongs,'#latestGrid');}}
$$('.lang').forEach(b=>b.addEventListener('click',()=>{$$('.lang').forEach(x=>x.classList.remove('active'));b.classList.add('active');loadLanguage(b.dataset.lang);}));
async function searchYT(q){
 const status=$('#status'),results=$('#results');if(status)status.textContent='Searching YouTube…';if(results)results.innerHTML='';
 const k=String(cfg.YOUTUBE_API_KEY||'').trim();
 if(!k||k.includes('PASTE_')){queue=fallbackSongs(q);if(status)status.textContent='Demo playback — add a YouTube API key for live song search.';if(results)results.innerHTML=queue.map((x,i)=>`<div class="result"><img class="resultCover" src="${esc(x.cover)}"><div><b>${esc(x.title)}</b><small>🎤 ${esc(x.singer)}</small></div><button type="button" data-result="${i}">Play</button></div>`).join('');results?.querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',()=>playTrack(+b.dataset.result)));return;}
 try{const list=await fetchSongs(q);queue=list;if(status)status.textContent=list.length+' results';if(results)results.innerHTML=list.map((x,i)=>`<div class="result"><img class="resultCover" src="${esc(x.cover)}"><div><b>${esc(x.title)}</b><small>🎤 ${esc(x.singer)}</small></div><button type="button" data-result="${i}">Play</button></div>`).join('');results?.querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',()=>playTrack(+b.dataset.result)));}catch(e){if(status)status.textContent='Search failed: '+e.message;}
}
function playTrack(i){if(!queue[i])return;index=i;const x=queue[i];$('#title')&&($('#title').textContent=x.title);$('#artist')&&($('#artist').textContent=x.singer||'Artist / Singer');$('#coverImg')&&($('#coverImg').src=x.cover||'assets/devcore-beats-logo.png');if(!ready||!player){setTimeout(()=>playTrack(i),300);return;}player.loadVideoById(x.id);player.playVideo();clearInterval(timer);timer=setInterval(()=>{if(player?.getCurrentTime){const c=player.getCurrentTime(),d=player.getDuration()||0;$('#current')&&($('#current').textContent=fmt(c));$('#duration')&&($('#duration').textContent=fmt(d));$('#seek')&&($('#seek').value=d?c/d*100:0);}},500);}
function next(){if(queue.length)playTrack((index+1)%queue.length)}function prev(){if(queue.length)playTrack((index-1+queue.length)%queue.length)}
$('#play')?.addEventListener('click',()=>{if(!queue.length){openModal();return;}if(!ready||!player)return;if(player.getPlayerState()===1)player.pauseVideo();else player.playVideo();});$('#next')?.addEventListener('click',next);$('#prev')?.addEventListener('click',prev);$('#seek')?.addEventListener('input',e=>player?.seekTo((player.getDuration()||0)*e.target.value/100,true));$('#heart')?.addEventListener('click',e=>e.currentTarget.textContent=e.currentTarget.textContent==='♡'?'♥':'♡');
$('#form')?.addEventListener('submit',e=>{e.preventDefault();const q=$('#query')?.value.trim();const s=$('#source')?.value;if(!q)return;s==='youtube'?searchYT(q):s==='spotify'?embedSpotify(q):embedSoundcloud(q);});
function embedSpotify(q){const u=q.includes('open.spotify.com')?q.replace('open.spotify.com/','open.spotify.com/embed/'):'https://open.spotify.com/embed/search/'+encodeURIComponent(q);$('#status').textContent='Spotify official embed.';$('#embed').innerHTML=`<iframe class="embed" height="152" src="${esc(u)}" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"></iframe>`;}
function embedSoundcloud(q){const u=q.includes('soundcloud.com')?q:'https://soundcloud.com/search?q='+encodeURIComponent(q);$('#status').textContent='SoundCloud official widget.';$('#embed').innerHTML=`<iframe class="embed" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&auto_play=false&hide_related=true"></iframe>`;}
loadLanguage('Punjabi');
})();
