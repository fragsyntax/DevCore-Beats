const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const cfg=window.DEVCORE_CONFIG||{};let queue=[],index=0,timer;

const languages={
 Punjabi:["Punjabi Top 50","Punjabi latest songs","Punjabi"],
 Haryanvi:["Haryanvi Top 50","Haryanvi latest songs","Haryanvi"],
 Bhojpuri:["Bhojpuri Top 50","Bhojpuri latest songs","Bhojpuri"],
 Hindi:["Hindi Top 50","Hindi latest songs","Hindi"]
};

const moods=[["Viral Hits","Today's top tracks","♫"],["Chill Vibes","Relax & unwind","☁"],["Workout","High energy beats","⚡"],["Late Night","Smooth late night vibes","☾"],["Pop Anthems","Ultimate pop hits","✦"],["Rock Classics","Timeless rock legends","🎸"]];
$("#cards").innerHTML=moods.map((m,i)=>`<article class="card"><div class="art a${i}">${m[2]}</div><div class="cardText"><b>${m[0]}</b><small>${m[1]} • ${35+i*5} songs</small></div><button onclick="mood(${i})">▶</button></article>`).join("");

function openModal(){ $("#modal").classList.add("show");$("#query").focus() }
function closeModal(){ $("#modal").classList.remove("show") }
$("#searchOpen").onclick=openModal;$("#startBtn").onclick=openModal;$("#viewAll").onclick=openModal;$("#menuBtn").onclick=openModal;$("#close").onclick=closeModal;

window.mood=i=>{openModal();$("#query").value=moods[i][0];searchYT(moods[i][0])};

let player=null,ready=false,ytLoading=false,ytQueue=[];
function initYT(){
  if(window.YT && window.YT.Player){
    if(player) return;
    player=new YT.Player("yt",{height:315,width:"100%",videoId:"",playerVars:{playsinline:1,controls:1,rel:0},events:{
      onReady:()=>{ready=true; if(ytQueue.length){const id=ytQueue.shift();player.loadVideoById(id);}},
      onStateChange:e=>{$("#play").textContent=e.data===1?"❚❚":"▶"}
    }}); return;
  }
  if(ytLoading) return;
  ytLoading=true;
  const sc=document.createElement("script");sc.src="https://www.youtube.com/iframe_api";document.head.appendChild(sc);
}
window.onYouTubeIframeAPIReady=()=>{initYT()};
initYT();

const esc=x=>String(x||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function renderSongs(list,grid){
  $(grid).innerHTML=list.map((x,i)=>`<article class="songCard" onclick="playItem(${i},'${grid}')">
    <img src="${esc(x.cover)}" alt="${esc(x.title)} cover">
    <button class="songPlay">▶</button>
    <div class="songInfo"><b>${esc(x.title)}</b><small>🎤 ${esc(x.singer)}</small></div>
  </article>`).join("");
}
function fallbackSongs(lang){
  return Array.from({length:10},(_,i)=>({
    id:"",title:`${lang} Top Song ${String(i+1).padStart(2,"0")}`,singer:`${lang} Artist`,cover:"assets/devcore-beats-logo.png"
  }));
}
async function fetchSongs(query){
  if(!cfg.YOUTUBE_API_KEY||cfg.YOUTUBE_API_KEY.includes("PASTE_")) return fallbackSongs(query.split(" ")[0]);
  try{
    const u="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q="+encodeURIComponent(query)+"&key="+encodeURIComponent(cfg.YOUTUBE_API_KEY);
    const d=await fetch(u).then(r=>r.json());if(d.error)throw Error(d.error.message);
    return (d.items||[]).map(x=>({id:x.id.videoId,title:x.snippet.title,singer:x.snippet.channelTitle,cover:(x.snippet.thumbnails?.high||x.snippet.thumbnails?.medium||x.snippet.thumbnails?.default)?.url||"assets/devcore-beats-logo.png"}));
  }catch(e){return fallbackSongs(query.split(" ")[0])}
}
async function loadLanguage(lang){
  $("#chartLabel").textContent=lang.toUpperCase();
  $("#latestLabel").textContent=lang.toUpperCase()+" • LATEST";
  const top=await fetchSongs(`${lang} top 50 songs`);
  const latest=await fetchSongs(`${lang} latest songs`);
  window.topSongs=top;window.latestSongs=latest;
  renderSongs(top,"#top50Grid");renderSongs(latest,"#latestGrid");
}
window.playItem=(i,grid)=>{
  const list=grid==="#top50Grid"?window.topSongs:window.latestSongs;
  queue=list;playTrack(i);
};
$$(".lang").forEach(b=>b.onclick=()=>{$$(".lang").forEach(x=>x.classList.remove("active"));b.classList.add("active");loadLanguage(b.dataset.lang)});
$(".searchLang").onclick=openModal;
loadLanguage("Punjabi");

async function searchYT(q){
  q=(q||"").trim();
  if(!q)return;
  const key=(cfg.YOUTUBE_API_KEY||"").trim();
  if(!key || key.includes("PASTE_")){
    $("#status").innerHTML='YouTube search needs your API key in <b>config.js</b>. <a href="https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'" target="_blank" rel="noopener">Search this song on YouTube ↗</a>';
    $("#results").innerHTML="";
    return;
  }
  $("#status").textContent="Searching YouTube…";$("#results").innerHTML="";
  try{
    const u="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q="+encodeURIComponent(q)+"&key="+encodeURIComponent(key);
    const r=await fetch(u); const d=await r.json();
    if(!r.ok || d.error) throw Error(d.error?.message||("HTTP "+r.status));
    queue=(d.items||[]).filter(x=>x.id?.videoId).map(x=>({id:x.id.videoId,title:x.snippet.title,singer:x.snippet.channelTitle,cover:x.snippet.thumbnails?.high?.url||x.snippet.thumbnails?.medium?.url||x.snippet.thumbnails?.default?.url||"assets/devcore-beats-logo.png"}));
    $("#status").textContent=queue.length?queue.length+" results":"No songs found";
    $("#results").innerHTML=queue.map((x,i)=>`<div class="result"><img class="resultCover" src="${esc(x.cover)}"><div><b>${esc(x.title)}</b><small>🎤 ${esc(x.singer)}</small></div><button type="button" data-play="${i}">▶ Play</button></div>`).join("");
    $$("#results [data-play]").forEach(b=>b.onclick=()=>playTrack(+b.dataset.play));
  }catch(e){
    $("#status").textContent="Search failed: "+e.message;
  }
}
window.playTrack=i=>{
  const x=queue[i]; if(!x)return;
  index=i; $("#title").textContent=x.title; $("#artist").textContent=x.singer||"Artist / Singer"; $("#coverImg").src=x.cover||"assets/devcore-beats-logo.png";
  if(!x.id)return;
  if(!ready){ytQueue=[x.id];initYT();return;}
  player.loadVideoById({videoId:x.id,startSeconds:0});
  player.playVideo();
  clearInterval(timer);
  timer=setInterval(()=>{try{let c=player.getCurrentTime(),d=player.getDuration()||0;$("#current").textContent=fmt(c);$("#duration").textContent=fmt(d);$("#seek").value=d?c/d*100:0}catch{}} ,500);
};

function embedSpotify(q){const u=q.includes("open.spotify.com")?q.replace("open.spotify.com/","open.spotify.com/embed/"):"https://open.spotify.com/embed/search/"+encodeURIComponent(q);$("#status").textContent="Spotify official embed.";$("#embed").innerHTML=`<iframe class="embed" height="152" src="${esc(u)}" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"></iframe>`}
function embedSoundcloud(q){const u=q.includes("soundcloud.com")?q:"https://soundcloud.com/search?q="+encodeURIComponent(q);$("#status").textContent="SoundCloud official widget.";$("#embed").innerHTML=`<iframe class="embed" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&color=%238c32ff&auto_play=false&hide_related=true"></iframe>`}


/* DevCore Beats: final interaction wiring */
function bindDevCoreControls(){
  const form=document.querySelector('#form');
  const source=document.querySelector('#source');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const q=(document.querySelector('#query')?.value||'').trim();
      if(!q)return;
      if(source?.value==='spotify') return embedSpotify(q);
      if(source?.value==='soundcloud') return embedSoundcloud(q);
      searchYT(q);
    });
  }
  const play=document.querySelector('#play');
  if(play) play.onclick=()=>{
    if(!player || !ready){ if(queue.length) playTrack(index); return; }
    try{
      const st=player.getPlayerState();
      if(st===1) player.pauseVideo(); else player.playVideo();
    }catch(e){}
  };
  const prev=document.querySelector('#prev');
  if(prev) prev.onclick=()=>{if(queue.length)playTrack((index-1+queue.length)%queue.length)};
  const next=document.querySelector('#next');
  if(next) next.onclick=()=>{if(queue.length)playTrack((index+1)%queue.length)};
  const seek=document.querySelector('#seek');
  if(seek) seek.addEventListener('input',()=>{
    if(player && ready){const d=player.getDuration()||0; player.seekTo(d*(Number(seek.value)/100),true)}
  });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindDevCoreControls); else bindDevCoreControls();
