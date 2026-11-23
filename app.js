const KEY="moe-vremya-events-v1";
const $=id=>document.getElementById(id);
let events=load(), newestFirst=true, toastTimer;
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function save(){localStorage.setItem(KEY,JSON.stringify(events))}
function pad(n){return String(n).padStart(2,"0")}
function dateLabel(ms){return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(ms))}
function partsBetween(start,end){
  let a=new Date(start), b=new Date(end), future=end<start;
  if(future)[a,b]=[b,a];
  let years=b.getFullYear()-a.getFullYear();
  let cursor=new Date(a);cursor.setFullYear(cursor.getFullYear()+years);
  if(cursor>b){years--;cursor=new Date(a);cursor.setFullYear(cursor.getFullYear()+years)}
  let months=(b.getFullYear()-cursor.getFullYear())*12+b.getMonth()-cursor.getMonth();
  let monthCursor=new Date(cursor);monthCursor.setMonth(monthCursor.getMonth()+months);
  if(monthCursor>b){months--;monthCursor=new Date(cursor);monthCursor.setMonth(monthCursor.getMonth()+months)}
  let rem=b.getTime()-monthCursor.getTime();
  const days=Math.floor(rem/86400000);rem-=days*86400000;
  const hours=Math.floor(rem/3600000);rem-=hours*3600000;
  const minutes=Math.floor(rem/60000);rem-=minutes*60000;
  const seconds=Math.floor(rem/1000);
  return {years,months,days,hours,minutes,seconds,future};
}
function render(){
  $("count").textContent=events.length;
  $("empty").hidden=events.length>0;
  const sorted=[...events].sort((a,b)=>(newestFirst?b.start-a.start:a.start-b.start));
  $("events").innerHTML=sorted.map(e=>{
    const p=partsBetween(e.start,Date.now());
    const totalDays=Math.floor(Math.abs(Date.now()-e.start)/86400000);
    const fmt=n=>String(n).padStart(2,"0");
    return `<article class="event-card" data-id="${e.id}">
      <div class="event-top"><div><div class="event-title">${escapeHtml(e.name)}</div><div class="event-date">${dateLabel(e.start)}</div></div><button class="delete" data-delete="${e.id}" aria-label="Удалить счётчик" title="Удалить">×</button></div>
      <div class="elapsed">${p.future?"До события":"Прошло"} ${p.years?`${p.years} г. `:""}${p.months?`${p.months} мес. `:""}${p.days} дн.</div>
      <div class="units">
        <div class="unit"><b>${p.years}</b><span>лет</span></div><div class="unit"><b>${p.months}</b><span>мес.</span></div><div class="unit"><b>${p.days}</b><span>дней</span></div><div class="unit"><b>${fmt(p.hours)}</b><span>часов</span></div><div class="unit"><b>${fmt(p.minutes)}</b><span>минут</span></div><div class="unit"><b>${fmt(p.seconds)}</b><span>секунд</span></div>
      </div><div class="event-foot"><span>${p.future?"Событие ещё впереди":"Всего дней: "+totalDays.toLocaleString("ru-RU")}</span><span>Обновляется каждую секунду</span></div>
    </article>`;
  }).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function notify(s){const t=$("toast");t.textContent=s;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}
$("eventForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("eventName").value.trim(),date=$("eventDate").value,time=$("eventTime").value;
  if(!name||!date||!time)return;
  const start=new Date(`${date}T${time}:00`).getTime();
  if(Number.isNaN(start)){notify("Проверь дату и время");return}
  events.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,start});
  save();$("eventName").value="";render();notify("Счётчик добавлен");
});
$("events").addEventListener("click",e=>{
  const b=e.target.closest("[data-delete]");if(!b)return;
  const item=events.find(x=>x.id===b.dataset.delete);
  if(!item||!confirm(`Удалить счётчик «${item.name}»?`))return;
  events=events.filter(x=>x.id!==item.id);save();render();notify("Счётчик удалён");
});
$("sortBtn").addEventListener("click",()=>{newestFirst=!newestFirst;$("sortBtn").textContent=newestFirst?"Сначала новые ↕":"Сначала старые ↕";render()});
$("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem("moe-vremya-theme",document.body.classList.contains("light")?"light":"dark")});
if(localStorage.getItem("moe-vremya-theme")==="light")document.body.classList.add("light");
const now=new Date();$("eventDate").value=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
render();setInterval(render,1000);
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
