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
window.onYouTubeIframeAPIReady=()=>{ready=true;player=new YT.Player("yt",{height:1,width:1,videoId:"",playerVars:{playsinline:1,controls:0,rel:0},events:{
  onReady:()=>player.setVolume(80),
  onStateChange:e=>{
    $("#play").textContent=e.data===1?"❚❚":"▶";
    $("#musicPlayer").classList.toggle("isPlaying",e.data===1);
    if(e.data===0) handleEnded();
  }
}})};

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
  queue=list; index=i; renderQueue(); playTrack(i);
};
$$(".lang").forEach(b=>b.onclick=()=>{$$(".lang").forEach(x=>x.classList.remove("active"));b.classList.add("active");loadLanguage(b.dataset.lang)});
$(".searchLang").onclick=openModal;
loadLanguage("Punjabi");

let shuffle=false, repeat=false, muted=false, lastVolume=80;

function renderQueue(){
  const box=$("#queueList"); if(!box)return;
  box.innerHTML=queue.length?queue.map((x,i)=>`<button class="queueItem ${i===index?"current":""}" onclick="playTrack(${i})">
    <img src="${esc(x.cover||"assets/devcore-beats-logo.png")}"><span><b>${esc(x.title)}</b><small>${esc(x.singer||"Artist")}</small></span><em>${i+1}</em>
  </button>`).join(""):"<div class='emptyQueue'>Your queue is empty.</div>";
}
function handleEnded(){
  if(!queue.length)return;
  if(repeat){playTrack(index);return}
  if(shuffle){let n=queue.length>1?Math.floor(Math.random()*queue.length):index;while(queue.length>1&&n===index)n=Math.floor(Math.random()*queue.length);playTrack(n);return}
  if(index<queue.length-1)playTrack(index+1);
}
window.playTrack=i=>{
  if(!queue.length||!queue[i])return;
  index=i;const x=queue[i];
  $("#title").textContent=x.title;$("#artist").textContent=x.singer||"Artist / Singer";$("#coverImg").src=x.cover||"assets/devcore-beats-logo.png";
  renderQueue();
  if(!x.id){$("#current").textContent="0:00";$("#duration").textContent="--:--";$("#seek").value=0;$("#status")&&($("#status").textContent="Add a YouTube API key to play this track.");return}
  if(!ready){setTimeout(()=>playTrack(i),500);return}
  player.loadVideoById(x.id);player.playVideo();clearInterval(timer);
  timer=setInterval(()=>{if(player?.getCurrentTime){let c=player.getCurrentTime(),d=player.getDuration()||0;$("#current").textContent=fmt(c);$("#duration").textContent=fmt(d);$("#seek").value=d?c/d*100:0}},500);
};
const fmt=n=>{n=Math.floor(n||0);return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")};

$("#play").onclick=()=>{
  if(!queue.length)return openModal();
  if(!player||!ready)return;
  player.getPlayerState()===1?player.pauseVideo():player.playVideo();
};
$("#next").onclick=()=>{
  if(!queue.length)return;
  if(shuffle){handleEnded();return}
  playTrack(index<queue.length-1?index+1:repeat?0:index);
};
$("#prev").onclick=()=>{
  if(!queue.length)return;
  if(player&&ready&&player.getCurrentTime()>5){player.seekTo(0,true);return}
  playTrack(index>0?index-1:repeat?queue.length-1:0);
};
$("#seek").oninput=e=>player?.seekTo((player.getDuration()||0)*e.target.value/100,true);
$("#volume").oninput=e=>{
  const v=Number(e.target.value);lastVolume=v;muted=v===0;
  if(player?.setVolume)player.setVolume(v);
  $("#volumeIcon").textContent=v===0?"🔇":"🔊";
};
$("#volumeIcon").onclick=()=>{
  if(!player?.setVolume)return;
  if(muted){muted=false;$("#volume").value=lastVolume||80;player.unMute();player.setVolume(lastVolume||80);$("#volumeIcon").textContent="🔊"}
  else{lastVolume=Number($("#volume").value)||80;muted=true;player.mute();$("#volume").value=0;$("#volumeIcon").textContent="🔇"}
};
$("#shuffle").onclick=()=>{shuffle=!shuffle;$("#shuffle").classList.toggle("active",shuffle)};
$("#repeat").onclick=()=>{repeat=!repeat;$("#repeat").classList.toggle("active",repeat)};
$("#queueBtn").onclick=()=>{$("#queuePanel").classList.toggle("show");renderQueue()};
$("#closeQueue").onclick=()=>$("#queuePanel").classList.remove("show");
$("#heart").onclick=()=>$("#heart").textContent=$("#heart").textContent==="♡"?"♥":"♡";
$("#form").onsubmit=e=>{e.preventDefault();const q=$("#query").value.trim(),s=$("#source").value;s==="youtube"?searchYT(q):s==="spotify"?embedSpotify(q):embedSoundcloud(q)};
function embedSpotify(q){const u=q.includes("open.spotify.com")?q.replace("open.spotify.com/","open.spotify.com/embed/"):"https://open.spotify.com/embed/search/"+encodeURIComponent(q);$("#status").textContent="Spotify official embed.";$("#embed").innerHTML=`<iframe class="embed" height="152" src="${esc(u)}" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"></iframe>`}
function embedSoundcloud(q){const u=q.includes("soundcloud.com")?q:"https://soundcloud.com/search?q="+encodeURIComponent(q);$("#status").textContent="SoundCloud official widget.";$("#embed").innerHTML=`<iframe class="embed" height="166" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(u)}&color=%238c32ff&auto_play=false&hide_related=true"></iframe>`}
renderQueue();
