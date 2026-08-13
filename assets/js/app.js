const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const cfg=window.DEVCORE_CONFIG||{};let player,ready=false,queue=[],index=0,timer;

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

const sc=document.createElement("script");sc.src="https://www.youtube.com/iframe_api";document.head.appendChild(sc);
window.onYouTubeIframeAPIReady=()=>{ready=true;player=new YT.Player("yt",{height:1,width:1,videoId:"",playerVars:{playsinline:1,controls:0},events:{onStateChange:e=>$("#play").textContent=e.data===1?"❚❚":"▶"}})};

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
 if(!cfg.YOUTUBE_API_KEY||cfg.YOUTUBE_API_KEY.includes("PASTE_")){
   $("#status").textContent="YouTube API key not configured.";
   $("#results").innerHTML="<div class='setup'>Add your YouTube Data API v3 key in config.js. Language Top 50/Latest sections will still show demo cards.</div>";
   return;
 }
 $("#status").textContent="Searching YouTube…";$("#results").innerHTML="";
 try{
  const u="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q="+encodeURIComponent(q)+"&key="+encodeURIComponent(cfg.YOUTUBE_API_KEY);
  const d=await fetch(u).then(r=>r.json());if(d.error)throw Error(d.error.message);
  queue=(d.items||[]).map(x=>({id:x.id.videoId,title:x.snippet.title,singer:x.snippet.channelTitle,cover:(x.snippet.thumbnails?.high||x.snippet.thumbnails?.medium||x.snippet.thumbnails?.default)?.url||"assets/devcore-beats-logo.png"}));
  $("#status").textContent=queue.length+" results";
  $("#results").innerHTML=queue.map((x,i)=>`<div class="result"><img class="resultCover" src="${esc(x.cover)}"><div><b>${esc(x.title)}</b><small>🎤 ${esc(x.singer)}</small></div><button onclick="playTrack(${i})">Play</button></div>`).join("");
 }catch(e){$("#status").textContent="Search failed: "+e.message}
}
window.playTrack=i=>{
 index=i;const x=queue[i];
 $("#title").textContent=x.title;$("#artist").textContent=x.singer||"Artist / Singer";$("#coverImg").src=x.cover||"assets/devcore-beats-logo.png";
 if(!x.id)return;
 if(!ready){setTimeout(()=>playTrack(i),500);return}
 player.loadVideoById(x.id);player.playVideo();clearInterval(timer);
 timer=setInterval(()=>{if(player?.getCurrentTime){let c=player.getCurrentTime(),d=player.getDuration()||0;$("#current").textContent=fmt(c);$("#duration").textContent=fmt(d);$("#seek").value=d?c/d*100:0}},500);
};
const fmt=n=>{n=Math.floor(n||0);return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")};
$("#play").onclick=()=>{if(!queue.length)return openModal();player.getPlayerState()===1?player.pauseVideo():player.playVideo()};
$("#next").onclick=()=>queue.length&&playTrack((index+1)%queue.length);
$("#prev").onclick=()=>queue.length&&playTrack((index-1+queue.length)%queue.length);
$("#seek").oninput=e=>player?.seekTo((player.getDuration()||0)*e.target.value/100,true);
$("#heart").onclick=()=>$("#heart").textContent=$("#heart").textContent==="♡"?"♥":"♡";
$("#form").onsubmit=e=>{e.preventDefault();const q=$("#query").value.trim(),s=$("#source").value;s==="youtube"?searchYT(q):s==="spotify"?embedSpotify(q):embedSoundcloud(q)};
function embedSpotify(q){const u=q.includes("open.spotify.com")?q.replace("open.spotify.com/","open.spotify.com/embed/"):"https://open.spotify.com/embed/search/"+encodeURIComponent(q);$("#status").textContent="Spotify official embed.";$("#embed").innerHTML=`<iframe class="embed" height="152" src="${esc(u)}" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"></iframe>`}
function embedSoundcloud(q){const u=q.includes("soundcloud.com")?q:"https://soundcloud.com/search?q="+encodeURIComponent(q);$("#status").textContent="SoundCloud official widget.";$("#embed").innerHTML=`<iframe class="embed" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&color=%238c32ff&auto_play=false&hide_related=true"></iframe>`}
