
(async()=>{"use strict";
const KEY="neuron-memo-v021-state",DRAFT_KEY="suryunggil-commaeng-drafts-v1",SNAPSHOT_KEY="suryunggil-commaeng-snapshots-v1",DB_NAME="suryunggil-commaeng-db",DB_STORE="records",MAX_IMPORT_BYTES=20*1024*1024,MAX_NOTES=100000,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const e={list:$("#noteList"),count:$("#countText"),search:$("#searchInput"),sort:$("#sortSelect"),quick:$("#quickEditor"),layout:$("#notesLayout"),empty:$("#emptyState"),detail:$("#detail"),title:$("#titleInput"),created:$("#createdText"),updated:$("#updatedText"),timeline:$("#timeline"),append:$("#appendEditor"),status:$("#statusText"),editDlg:$("#editDialog"),editEditor:$("#editEditor"),histDlg:$("#historyDialog"),histList:$("#historyList"),toast:$("#toast"),review:$("#reviewGrid"),graph:$("#graph"),viewport:$("#graphViewport"),edges:$("#edges"),nodes:$("#nodes"),importFile:$("#importFile"),newNoteDlg:$("#newNoteDialog"),newNoteEditor:$("#newNoteEditor"),appendNoteDlg:$("#appendNoteDialog"),appendNoteEditor:$("#appendNoteEditor"),graphBox:$("#graphBox"),trashDlg:$("#trashDialog"),trashList:$("#trashList"),backupDlg:$("#backupDialog"),snapshotList:$("#snapshotList"),toastText:$("#toastText"),toastAction:$("#toastAction"),draftNew:$("#draftStatusNew"),draftAppend:$("#draftStatusAppend"),draftEdit:$("#draftStatusEdit"),newTitle:$("#newNoteTitle"),newCount:$("#newEditorCount"),appendCount:$("#appendEditorCount"),editCount:$("#editEditorCount"),searchScope:$("#searchScope"),loadMore:$("#loadMoreBtn"),graphSearch:$("#graphSearch"),graphMode:$("#graphMode"),graphLimit:$("#graphLimit"),graphStrength:$("#graphStrength"),graphInspector:$("#graphInspector"),reviewMode:$("#reviewMode"),reviewSummary:$("#reviewSummary"),storageEstimate:$("#storageEstimate")};let editing=null;
const uid=p=>p+"_"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random().toString(16).slice(2)),now=()=>new Date().toISOString(),esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#039;"}[c])),fmt=v=>new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(v)),short=v=>{const d=new Date(v),t=new Date();return d.toDateString()===t.toDateString()?new Intl.DateTimeFormat("ko-KR",{hour:"2-digit",minute:"2-digit",hour12:false}).format(d):new Intl.DateTimeFormat("ko-KR",{month:"2-digit",day:"2-digit"}).format(d)};

let dbPromise=null;
function openAppDB(){
  if(!('indexedDB' in window))return Promise.resolve(null);
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  }).catch(()=>null);
  return dbPromise;
}
async function dbGet(key){const db=await openAppDB();if(!db)return null;return new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readonly'),r=tx.objectStore(DB_STORE).get(key);r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>resolve(null)})}
async function dbSet(key,value){const db=await openAppDB();if(!db)throw new Error('IndexedDB unavailable');return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function loadStoredState(){const primary=await dbGet('state');if(primary)return primary;try{return JSON.parse(localStorage.getItem(KEY))}catch(_){return null}}
function safeLocalMirror(value){try{const text=JSON.stringify(value);if(text.length<3_500_000)localStorage.setItem(KEY,text);else localStorage.removeItem(KEY);return true}catch(_){return false}}

function seed(){const a=new Date(Date.now()-172800000).toISOString(),b=new Date(Date.now()-18000000).toISOString(),n={id:uid("note"),title:"수령길-컴맹 사용 안내",createdAt:a,updatedAt:b,entries:[{id:uid("entry"),content:"왼쪽 입력창에 생각나는 내용을 적고 '새 메모'를 누르면 저장돼.",createdAt:a,updatedAt:a,revisions:[]},{id:uid("entry"),content:"메모를 열고 아래 '이어서 기록하기'에 적으면 기존 내용 아래에 날짜와 함께 추가돼.",createdAt:b,updatedAt:b,revisions:[]}]};return{notes:[n],selected:n.id,view:"notes"}}
let state;try{state=(await loadStoredState())||seed()}catch(_){state=seed()}state.view="notes";state.schemaVersion=9;state.deletedNotes=Array.isArray(state.deletedNotes)?state.deletedNotes:[];state.noteLinks=Array.isArray(state.noteLinks)?state.noteLinks:[];state.trash=Array.isArray(state.trash)?state.trash:[];state.reviewShuffle=Number(state.reviewShuffle)||0;for(const note of state.notes){note.entries=Array.isArray(note.entries)?note.entries:[];note.lastViewedAt=note.lastViewedAt||note.createdAt||note.updatedAt||now();note.lastReviewedAt=note.lastReviewedAt||null;note.viewCount=Number(note.viewCount)||0}state.dataUpdatedAt=state.dataUpdatedAt||state.notes.reduce((m,n)=>!m||new Date(n.updatedAt)>new Date(m)?n.updatedAt:m,"")||now();
function htmlToText(v=""){const d=document.createElement("div");d.innerHTML=v;return d.textContent||d.innerText||""}
function sanitizeHtml(raw=""){
  const doc=new DOMParser().parseFromString(`<div>${raw}</div>`,"text/html"),root=doc.body.firstElementChild;
  const allowed=new Set(["DIV","P","BR","B","STRONG","U","S","STRIKE","FONT","UL","OL","LI","A","SPAN"]);
  function safeHref(value=""){
    try{
      const url=new URL(value,location.href);
      if(["http:","https:","mailto:"].includes(url.protocol))return value;
    }catch(_){}
    return "";
  }
  function walk(node){
    [...node.children].forEach(child=>{
      walk(child);
      if(!allowed.has(child.tagName)){child.replaceWith(...child.childNodes);return}
      if(child.tagName==="FONT"){
        const size=child.getAttribute("size");
        [...child.attributes].forEach(attr=>child.removeAttribute(attr.name));
        if(["2","3","5"].includes(size))child.setAttribute("size",size);
        return;
      }
      if(child.tagName==="A"){
        const href=safeHref(child.getAttribute("href")||"");
        [...child.attributes].forEach(attr=>child.removeAttribute(attr.name));
        if(href){
          child.setAttribute("href",href);
          child.setAttribute("target","_blank");
          child.setAttribute("rel","noopener noreferrer");
        }else child.replaceWith(...child.childNodes);
        return;
      }
      if(child.tagName==="DIV"&&child.classList.contains("task-line")){
        const checked=child.getAttribute("data-checked")==="true";
        [...child.attributes].forEach(attr=>child.removeAttribute(attr.name));
        child.className="task-line";
        child.setAttribute("data-checked",checked?"true":"false");
        return;
      }
      if(child.tagName==="SPAN"&&child.classList.contains("task-marker")){
        const checked=child.getAttribute("data-checked")==="true";
        [...child.attributes].forEach(attr=>child.removeAttribute(attr.name));
        child.className="task-marker";
        child.setAttribute("data-checked",checked?"true":"false");
        child.setAttribute("contenteditable","false");
        child.textContent=checked?"✓":"☐";
        return;
      }
      if(child.tagName==="SPAN"&&child.classList.contains("task-text")){
        [...child.attributes].forEach(attr=>child.removeAttribute(attr.name));
        child.className="task-text";
        return;
      }
      [...child.attributes].forEach(attr=>child.removeAttribute(attr.name));
    });
  }
  walk(root);
  return root.innerHTML;
}
function entryHtml(x){return x.format==="html"?sanitizeHtml(x.content):esc(x.content).replace(/\n/g,"<br>")}
function entryText(x){return x.format==="html"?htmlToText(x.content):String(x.content||"")}
function full(n){return [n.title,...n.entries.map(entryText)].join(" ")}function preview(n){return entryText(n.entries.at(-1)||{})}function titleFrom(v){const x=v.split(/\n/).map(s=>s.trim()).find(Boolean)||"새 메모";return x.length>42?x.slice(0,42)+"…":x}
let timer,dataDirty=false;
let cacheRevision=0;
const noteTextCache=new Map(),tokenCache=new Map();
function invalidateCaches(){cacheRevision++;noteTextCache.clear();tokenCache.clear()}
function markDirty(){state.dataUpdatedAt=now();dataDirty=true;invalidateCaches()}
async function persistState(){try{await dbSet('state',state);safeLocalMirror(state);return}catch(error){if(safeLocalMirror(state))return;throw error}}
function save(){
  e.status.textContent="저장 중...";
  clearTimeout(timer);
  timer=setTimeout(async()=>{
    try{await persistState();e.status.textContent="저장됨 · IndexedDB";updateTrashBadges();if(dataDirty){dataDirty=false;ensureDailySnapshot()}}
    catch(error){console.error(error);e.status.textContent="저장 실패";toast("저장 공간 오류가 발생했어.","JSON 백업",exportData)}
  },90);
}
function toast(message,actionLabel="",action=null){
  e.toastText.textContent=message;
  e.toastAction.classList.toggle("hidden",!actionLabel||!action);
  e.toastAction.textContent=actionLabel||"";
  e.toastAction.onclick=action?()=>{action();e.toast.classList.add("hidden")}:null;
  e.toast.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>e.toast.classList.add("hidden"),action?4200:1800);
}
const selected=()=>state.notes.find(n=>n.id===state.selected)||null;

let drafts;
try{drafts=JSON.parse(localStorage.getItem(DRAFT_KEY))||{newNote:null,append:{},edit:{}}}catch(_){drafts={newNote:null,append:{},edit:{}}}
drafts.append=drafts.append||{};
drafts.edit=drafts.edit||{};
let draftTimers=new Map();

function saveDraftStore(){
  localStorage.setItem(DRAFT_KEY,JSON.stringify(drafts));
}
function setDraftStatus(element,value){
  if(!element)return;
  element.textContent=value?.updatedAt?`임시 저장됨 ${short(value.updatedAt)}`:"임시 저장 대기";
}
function scheduleDraft(key,editor,statusElement){
  clearTimeout(draftTimers.get(key));
  draftTimers.set(key,setTimeout(()=>{
    const html=sanitizeHtml(editor.innerHTML);
    const text=htmlToText(html).trim();
    if(!text){
      clearDraft(key,statusElement,false);
      return;
    }
    const value={html,updatedAt:now()};
    if(key==="new"){value.title=e.newTitle?.value||"";drafts.newNote=value;}
    else{
      const [group,id]=key.split(":");
      drafts[group][id]=value;
    }
    saveDraftStore();
    setDraftStatus(statusElement,value);
  },350));
}
function getDraft(key){
  if(key==="new")return drafts.newNote;
  const [group,id]=key.split(":");
  return drafts[group]?.[id]||null;
}
function clearDraft(key,statusElement,showMessage=true){
  if(key==="new")drafts.newNote=null;
  else{
    const [group,id]=key.split(":");
    if(drafts[group])delete drafts[group][id];
  }
  saveDraftStore();
  setDraftStatus(statusElement,null);
  if(showMessage)toast("임시 저장 내용을 삭제했어.");
}

let snapshotCache=[];
try{snapshotCache=(await dbGet('snapshots'))||JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'[]')||[]}catch(_){snapshotCache=[]}
function getSnapshots(){return snapshotCache}
function setSnapshots(list){snapshotCache=list.slice(0,8);dbSet('snapshots',snapshotCache).catch(()=>{});try{const text=JSON.stringify(snapshotCache);if(text.length<2_000_000)localStorage.setItem(SNAPSHOT_KEY,text);else localStorage.removeItem(SNAPSHOT_KEY)}catch(_){}}
function cloneData(value){return typeof structuredClone==="function"?structuredClone(value):JSON.parse(JSON.stringify(value))}
function backupState(){
  return cloneData({
    schemaVersion:9,
    notes:state.notes,
    deletedNotes:state.deletedNotes||[],
    noteLinks:state.noteLinks||[],
    trash:state.trash||[],
    reviewShuffle:state.reviewShuffle||0,
    dataUpdatedAt:state.dataUpdatedAt||now()
  });
}
function createSnapshot(reason="수동 복구 지점",silent=false){
  const list=getSnapshots();
  const item={id:uid("snapshot"),createdAt:now(),reason,data:backupState()};
  list.unshift(item);
  setSnapshots(list);
  renderSnapshots();
  if(!silent)toast("로컬 복구 지점을 만들었어.");
  return item;
}
function ensureDailySnapshot(){
  const list=getSnapshots();
  const today=new Date().toISOString().slice(0,10);
  const hasToday=list.some(item=>item.reason==="자동 일일 보호"&&String(item.createdAt).slice(0,10)===today);
  if(!hasToday)createSnapshot("자동 일일 보호",true);
}
function restoreSnapshot(id){
  const item=getSnapshots().find(snapshot=>snapshot.id===id);
  if(!item)return;
  if(!confirm(`${fmt(item.createdAt)} 복구 지점으로 현재 데이터를 교체할까?\n현재 상태도 먼저 새 복구 지점으로 저장돼.`))return;
  createSnapshot("복구 직전 자동 보호",true);
  const data=cloneData(item.data||{});
  state.notes=data.notes||[];
  state.deletedNotes=data.deletedNotes||[];
  state.noteLinks=data.noteLinks||[];
  state.trash=data.trash||[];
  state.selected=state.notes[0]?.id||null;
  state.view="notes";
  state.dataUpdatedAt=now();
  render();
  markDirty();
  save();
  e.backupDlg.close();
  toast("복구 지점으로 되돌렸어.");
}
function deleteSnapshot(id){
  if(!confirm("이 로컬 복구 지점을 삭제할까?"))return;
  setSnapshots(getSnapshots().filter(item=>item.id!==id));
  renderSnapshots();
}
function renderSnapshots(){
  if(!e.snapshotList)return;
  const list=getSnapshots();
  e.snapshotList.innerHTML=list.length?list.map(item=>`
    <article class="snapshot-item">
      <div><h3>${esc(item.reason)}</h3><p>${fmt(item.createdAt)} · 메모 ${item.data?.notes?.length||0}개 · 휴지통 ${item.data?.trash?.length||0}개</p></div>
      <div class="snapshot-item-actions"><button class="classic" data-restore-snapshot="${item.id}" type="button">복구</button><button class="classic danger" data-delete-snapshot="${item.id}" type="button">삭제</button></div>
    </article>`).join(""):`<div class="trash-empty">아직 로컬 복구 지점이 없어.</div>`;
  $$("[data-restore-snapshot]").forEach(button=>button.onclick=()=>restoreSnapshot(button.dataset.restoreSnapshot));
  $$("[data-delete-snapshot]").forEach(button=>button.onclick=()=>deleteSnapshot(button.dataset.deleteSnapshot));
}

async function refreshStorageInfo(){if(!e.storageEstimate)return;try{const estimate=await navigator.storage?.estimate?.(),used=estimate?.usage||0,quota=estimate?.quota||0,persisted=await navigator.storage?.persisted?.();e.storageEstimate.textContent=`사용 ${formatBytes(used)} / 한도 ${formatBytes(quota)} · 영구 저장 ${persisted?'허용됨':'미허용'}`}catch(_){e.storageEstimate.textContent='브라우저 저장 공간 정보를 확인할 수 없어.'}}
function formatBytes(value){if(!Number.isFinite(value)||value<=0)return '0B';const units=['B','KB','MB','GB'],index=Math.min(units.length-1,Math.floor(Math.log(value)/Math.log(1024)));return`${(value/1024**index).toFixed(index?1:0)}${units[index]}`}
async function requestPersistentStorage(){try{const granted=await navigator.storage?.persist?.();toast(granted?'영구 저장 권한이 허용됐어.':'브라우저가 영구 저장을 허용하지 않았어.');refreshStorageInfo()}catch(_){toast('영구 저장 요청을 지원하지 않는 브라우저야.')}}

function openBackup(){
  renderSnapshots();refreshStorageInfo();
  e.backupDlg.showModal();
}

function updateTrashBadges(){
  const count=(state.trash||[]).length;
  const side=$("#trashCountSide"),top=$("#trashCountTop");
  if(side)side.textContent=count;
  if(top)top.textContent=count;
}
function purgeExpiredTrash(){
  const limit=Date.now()-30*24*60*60*1000;
  const before=(state.trash||[]).length;
  state.trash=(state.trash||[]).filter(item=>new Date(item.deletedAt).getTime()>=limit);
  if(state.trash.length!==before){
    localStorage.setItem(KEY,JSON.stringify(state));
  }
}
function renderTrash(){
  const list=[...(state.trash||[])].sort((a,b)=>new Date(b.deletedAt)-new Date(a.deletedAt));
  e.trashList.innerHTML=list.length?list.map(item=>`
    <article class="trash-item">
      <div><h3>${esc(item.note?.title||"삭제된 메모")}</h3><p>삭제 ${fmt(item.deletedAt)} · ${esc(preview(item.note||{entries:[]})).slice(0,120)}</p></div>
      <div class="trash-item-actions"><button class="classic primary" data-restore-trash="${item.id}" type="button">복원</button><button class="classic danger" data-delete-trash="${item.id}" type="button">영구삭제</button></div>
    </article>`).join(""):`<div class="trash-empty">휴지통이 비어 있어.</div>`;
  $$("[data-restore-trash]").forEach(button=>button.onclick=()=>restoreTrashItem(button.dataset.restoreTrash));
  $$("[data-delete-trash]").forEach(button=>button.onclick=()=>permanentDeleteTrash(button.dataset.deleteTrash));
  updateTrashBadges();
}
function openTrash(){
  renderTrash();
  e.trashDlg.showModal();
}
function restoreTrashItem(id){
  const item=(state.trash||[]).find(value=>value.id===id);
  if(!item?.note)return;
  if(!state.notes.some(note=>note.id===item.note.id))state.notes.push(item.note);
  for(const saved of item.links||[]){
    if(!state.notes.some(note=>note.id===(saved.a===item.note.id?saved.b:saved.a)))continue;
    const existing=(state.noteLinks||[]).find(link=>link.a===saved.a&&link.b===saved.b);
    if(existing){existing.deletedAt=null;existing.updatedAt=now()}
    else state.noteLinks.push({...saved,deletedAt:null,updatedAt:now()});
  }
  state.deletedNotes=(state.deletedNotes||[]).filter(tomb=>tomb.id!==item.note.id);
  state.trash=state.trash.filter(value=>value.id!==id);
  state.selected=item.note.id;
  render();
  renderTrash();
  markDirty();
  save();
  toast("메모를 복원했어.");
}
function permanentDeleteTrash(id){
  const item=(state.trash||[]).find(value=>value.id===id);
  if(!item)return;
  if(!confirm(`"${item.note?.title||"삭제된 메모"}"를 영구 삭제할까?\n이 작업은 되돌릴 수 없어.`))return;
  createSnapshot("영구삭제 직전 보호",true);
  state.trash=state.trash.filter(value=>value.id!==id);
  renderTrash();
  markDirty();
  save();
  toast("영구 삭제했어.");
}
function emptyTrash(){
  if(!(state.trash||[]).length)return toast("휴지통이 이미 비어 있어.");
  if(!confirm(`휴지통의 메모 ${state.trash.length}개를 모두 영구 삭제할까?\n이 작업은 되돌릴 수 없어.`))return;
  createSnapshot("휴지통 비우기 직전 보호",true);
  state.trash=[];
  renderTrash();
  markDirty();
  save();
  toast("휴지통을 비웠어.");
}


let listLimit=160,searchTimer=0;
function cachedNoteText(note){const key=`${note.id}|${note.updatedAt}|${note.title}`;const old=noteTextCache.get(note.id);if(old?.key===key)return old;const body=note.entries.map(entryText).join('\n');const value={key,title:String(note.title||''),body,all:`${note.title||''}\n${body}`.toLowerCase()};noteTextCache.set(note.id,value);return value}
function parseSearchQuery(raw=''){const matches=raw.match(/"[^"]+"|\S+/g)||[],query={terms:[],after:null,before:null,on:null};for(const rawToken of matches.slice(0,16)){const token=rawToken.replace(/^"|"$/g,'').trim();if(/^이후:\d{4}-\d{2}-\d{2}$/.test(token))query.after=token.slice(3);else if(/^이전:\d{4}-\d{2}-\d{2}$/.test(token))query.before=token.slice(3);else if(/^날짜:\d{4}-\d{2}-\d{2}$/.test(token))query.on=token.slice(3);else if(token)query.terms.push(token.toLowerCase())}return query}
function activeLinkDegree(){const degree=new Map();for(const link of activeManualLinks()){degree.set(link.a,(degree.get(link.a)||0)+1);degree.set(link.b,(degree.get(link.b)||0)+1)}return degree}
function incompleteTaskCount(note){return note.entries.reduce((sum,entry)=>sum+(String(entry.content||'').match(/class=["']task-line["'][^>]*data-checked=["']false["']/g)||[]).length,0)}
function filtered(){
  const query=parseSearchQuery(e.search.value),terms=query.terms,scope=e.searchScope.value,degree=scope==='linked'?activeLinkDegree():null,cutoff=Date.now()-30*86400000;
  let notes=state.notes.filter(note=>{
    if(scope==='linked'&&!(degree.get(note.id)>0))return false;
    if(scope==='tasks'&&incompleteTaskCount(note)===0)return false;
    if(scope==='recent30'&&new Date(note.updatedAt).getTime()<cutoff)return false;
    const day=String(note.updatedAt||note.createdAt).slice(0,10);if(query.on&&day!==query.on)return false;if(query.after&&day<query.after)return false;if(query.before&&day>query.before)return false;
    if(!terms.length)return true;
    const cached=cachedNoteText(note),hay=scope==='title'?cached.title.toLowerCase():scope==='body'?cached.body.toLowerCase():cached.all;
    return terms.every(term=>hay.includes(term));
  });
  const sort=e.sort.value;
  notes.sort((a,b)=>sort==='old'?new Date(a.createdAt)-new Date(b.createdAt):sort==='created'?new Date(b.createdAt)-new Date(a.createdAt):sort==='title'?String(a.title).localeCompare(String(b.title),'ko'):new Date(b.updatedAt)-new Date(a.updatedAt));
  return{notes,terms};
}
function highlightPlain(text,terms){let output=esc(text);for(const term of terms.slice(0,6)){const safe=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(!safe)continue;output=output.replace(new RegExp(`(${safe})`,'gi'),'<mark class="search-mark">$1</mark>')}return output}
function renderList(){
  const result=filtered(),all=result.notes,visible=all.slice(0,listLimit),degree=activeLinkDegree();
  e.count.textContent=`표시 ${visible.length.toLocaleString()} / 결과 ${all.length.toLocaleString()} / 전체 ${state.notes.length.toLocaleString()}`;
  e.loadMore.classList.toggle('hidden',visible.length>=all.length);e.loadMore.textContent=`더 보기 (${Math.min(160,all.length-visible.length)}개)`;
  e.list.innerHTML=visible.length?visible.map(note=>{const tasks=incompleteTaskCount(note),links=degree.get(note.id)||0;return `<button class="note-row ${note.id===state.selected?'selected':''}" data-note="${note.id}"><span class="note-icon">▤</span><span class="note-main"><span class="note-title">${highlightPlain(note.title,result.terms)}</span><span class="note-preview">${highlightPlain(preview(note),result.terms)}</span><span class="note-badges">${links?`<span class="note-badge link">연결 ${links}</span>`:''}${tasks?`<span class="note-badge task">미완료 ${tasks}</span>`:''}${note.entries.length>1?`<span class="note-badge">기록 ${note.entries.length}</span>`:''}</span></span><span class="note-dates"><span>기록 ${short(note.createdAt)}</span><span>수정 ${short(note.updatedAt)}</span></span></button>`}).join(''):`<div class="empty"><div class="big">⌕</div><strong>검색 결과가 없어.</strong><span>검색 범위나 단어를 바꿔봐.</span></div>`;
  $$('[data-note]').forEach(button=>button.onclick=()=>selectNote(button.dataset.note));
}

function renderDetail(){
  const n=selected();
  if(!n){e.empty.classList.remove("hidden");e.detail.classList.add("hidden");return}
  e.empty.classList.add("hidden");e.detail.classList.remove("hidden");
  e.title.value=n.title;e.created.textContent=fmt(n.createdAt);e.updated.textContent=fmt(n.updatedAt);
  e.timeline.innerHTML=n.entries.map((x,i)=>{
    const plain=entryText(x),long=plain.length>420||plain.split(/\n/).length>11;
    return `<section class="entry ${long?"is-collapsed":""}" data-entry-card="${x.id}">
      <header class="entry-head"><span>${i===0?"최초 기록":i+1+"번째 기록"} · ${fmt(x.createdAt)}</span>
      <span class="entry-actions">${long?`<button class="tiny entry-toggle" data-toggle-entry="${x.id}">펼치기</button>`:""}<button class="tiny edit" data-entry="${x.id}">수정</button>${x.revisions?.length?`<button class="tiny hist" data-entry="${x.id}">이력 ${x.revisions.length}</button>`:""}</span></header>
      <div class="entry-body" data-entry-body="${x.id}">${entryHtml(x)}</div>${x.updatedAt!==x.createdAt?`<div class="entry-modified">이 기록의 최종 수정: ${fmt(x.updatedAt)}</div>`:""}</section>`
  }).join("");
  $$(".edit").forEach(b=>b.onclick=()=>openEdit(b.dataset.entry));
  $$(".hist").forEach(b=>b.onclick=()=>openHistory(b.dataset.entry));
  $$("[data-entry-body]").forEach(body=>bindTaskToggle(body,()=>{
    const note=selected(),entry=note?.entries.find(item=>item.id===body.dataset.entryBody);
    if(!note||!entry)return;
    entry.content=sanitizeHtml(body.innerHTML);entry.format="html";entry.updatedAt=now();note.updatedAt=entry.updatedAt;
    e.updated.textContent=fmt(note.updatedAt);markDirty();save();
  }));
  $$("[data-toggle-entry]").forEach(b=>b.onclick=()=>{const card=$(`[data-entry-card="${b.dataset.toggleEntry}"]`);if(!card)return;const expanded=card.classList.toggle("expanded");card.classList.toggle("is-collapsed",!expanded);b.textContent=expanded?"접기":"펼치기"});
}

function dailyHash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function reviewDegreeMap(){const degree=activeLinkDegree(),sample=[...state.notes].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,400);for(const link of autoNoteLinks(sample,2.4)){degree.set(link.a,(degree.get(link.a)||0)+1);degree.set(link.b,(degree.get(link.b)||0)+1)}return degree}
function markReviewed(id){const note=state.notes.find(item=>item.id===id);if(!note)return;note.lastReviewedAt=now();markDirty();save();renderReview();toast('오늘 다시 본 것으로 기록했어.')}
function reviewCard(title,items,description){return `<article class="review-card"><div class="review-card-head"><div><h2>${esc(title)}</h2><p>${esc(description)}</p></div><strong>${items.length}</strong></div><div class="review-items">${items.length?items.map(note=>`<button class="review-item" data-review="${note.id}"><span class="review-item-main"><span class="review-item-title">${esc(note.title)}</span><span class="review-item-preview">${esc(preview(note))}</span></span><span class="review-item-date">${short(note.updatedAt)}</span></button>`).join(''):`<span class="review-item">해당 메모가 없어.</span>`}</div></article>`}
function renderReview(){
  const nowMs=Date.now(),mode=e.reviewMode?.value||'all',degree=reviewDegreeMap(),today=new Date().toISOString().slice(0,10),seed=dailyHash(`${today}|${state.reviewShuffle}`);
  const scoreDaily=note=>{const reviewed=note.lastReviewedAt?new Date(note.lastReviewedAt).getTime():0,viewed=new Date(note.lastViewedAt||note.createdAt).getTime(),age=Math.min(365,(nowMs-viewed)/86400000),never=reviewed?0:80,hash=(dailyHash(note.id)^seed)%100;return never+age+hash/10-incompleteTaskCount(note)*-3};
  const daily=[...state.notes].sort((a,b)=>scoreDaily(b)-scoreDaily(a)).slice(0,5);
  const stale=[...state.notes].filter(n=>nowMs-new Date(n.lastViewedAt||n.createdAt)>14*86400000).sort((a,b)=>new Date(a.lastViewedAt||a.createdAt)-new Date(b.lastViewedAt||b.createdAt)).slice(0,8);
  const tasks=[...state.notes].filter(n=>incompleteTaskCount(n)>0).sort((a,b)=>incompleteTaskCount(b)-incompleteTaskCount(a)).slice(0,8);
  const connected=[...state.notes].filter(n=>(degree.get(n.id)||0)>0).sort((a,b)=>(degree.get(b.id)||0)-(degree.get(a.id)||0)).slice(0,8);
  const growing=[...state.notes].filter(n=>n.entries.length>1).sort((a,b)=>b.entries.length-a.entries.length).slice(0,8);
  const anniversary=[...state.notes].filter(n=>{const days=Math.round((nowMs-new Date(n.createdAt))/86400000);return [30,90,180,365].some(target=>Math.abs(days-target)<=3)}).slice(0,8);
  e.reviewSummary.innerHTML=`<div class="review-stat"><strong>${daily.length}</strong><span>오늘의 메모</span></div><div class="review-stat"><strong>${stale.length}</strong><span>14일 이상 안 봄</span></div><div class="review-stat"><strong>${tasks.reduce((s,n)=>s+incompleteTaskCount(n),0)}</strong><span>미완료 체크</span></div><div class="review-stat"><strong>${connected.length}</strong><span>연결 중심 메모</span></div>`;
  const cards={daily:reviewCard('오늘 다시 볼 메모',daily,'매일 바뀌는 5개 메모야.'),stale:reviewCard('오래 안 본 메모',stale,'14일 이상 열지 않았던 메모야.'),tasks:reviewCard('남은 체크 항목',tasks,'완료하지 않은 체크가 있는 메모야.'),connected:reviewCard('연결 중심 메모',connected,'다른 생각과 많이 연결된 메모야.'),growing:reviewCard('계속 자란 메모',growing,'이어쓰기 기록이 많은 메모야.'),anniversary:reviewCard('그때의 오늘',anniversary,'약 30·90·180·365일 전에 시작한 메모야.')};
  e.review.innerHTML=mode==='all'?cards.daily+cards.stale+cards.tasks+cards.connected+cards.growing+cards.anniversary:cards[mode]||cards.daily;
  $$('[data-review]').forEach(button=>button.onclick=()=>{markReviewed(button.dataset.review);switchView('notes');selectNote(button.dataset.review,'review')});
}


function graphTokens(note){
  const cached=tokenCache.get(note.id),key=`${note.updatedAt}|${note.title}`;if(cached?.key===key)return cached.tokens;
  const stop=new Set(['그리고','그런데','그래서','그러면','이거','저거','그거','하는','해서','있어','있다','없는','같은','정도','메모','기록','오늘','내일','이번','정말','그냥','나중','계속','수정','최종','처음','다시','합니다','있는','으로','에서','에게','위해','대한']);
  const tokens=[...new Set((cachedNoteText(note).all.match(/[가-힣a-z0-9#_-]{2,}/g)||[]).map(v=>v.replace(/^#/,'')).filter(v=>v.length>=2&&!stop.has(v)&&!/^\d+$/.test(v)))].slice(0,70);
  tokenCache.set(note.id,{key,tokens});return tokens;
}
function buildGraphIndex(notes){
  const sets=new Map(),inverted=new Map();for(const note of notes){const set=new Set(graphTokens(note));sets.set(note.id,set);for(const token of set){if(!inverted.has(token))inverted.set(token,[]);inverted.get(token).push(note.id)}}
  const pairs=new Map();for(const [token,ids] of inverted){if(ids.length<2||ids.length>Math.max(16,Math.floor(notes.length*.35)))continue;const idf=Math.log((notes.length+1)/(ids.length+.5))+1;const cap=Math.min(ids.length,24);for(let i=0;i<cap;i++)for(let j=i+1;j<cap;j++){const key=linkKey(ids[i],ids[j]),item=pairs.get(key)||{a:ids[i],b:ids[j],score:0,shared:[]};item.score+=idf;if(item.shared.length<5)item.shared.push(token);pairs.set(key,item)}}
  return{sets,inverted,pairs};
}
function autoNoteLinks(notes,threshold=2.0){
  const {pairs}=buildGraphIndex(notes),candidates=[...pairs.values()].filter(item=>item.score>=threshold).sort((a,b)=>b.score-a.score),degree=new Map(),picked=[],maxLinks=Math.min(220,Math.max(20,notes.length*2));
  for(const item of candidates){if((degree.get(item.a)||0)>=4||(degree.get(item.b)||0)>=4)continue;picked.push({...item,type:'auto'});degree.set(item.a,(degree.get(item.a)||0)+1);degree.set(item.b,(degree.get(item.b)||0)+1);if(picked.length>=maxLinks)break}return picked;
}
function activeManualLinks(){const ids=new Set(state.notes.map(n=>n.id));return(state.noteLinks||[]).filter(link=>!link.deletedAt&&ids.has(link.a)&&ids.has(link.b))}
function linkKey(a,b){return[a,b].sort().join('|')}
function graphSelectedNotes(){
  const limit=Math.max(20,Math.min(120,Number(e.graphLimit?.value)||70)),query=(e.graphSearch?.value||'').trim().toLowerCase(),mode=e.graphMode?.value||'recent',manualDegree=activeLinkDegree();let notes=state.notes.filter(n=>!query||cachedNoteText(n).all.includes(query));
  if(mode==='connected')notes.sort((a,b)=>(manualDegree.get(b.id)||0)-(manualDegree.get(a.id)||0)||new Date(b.updatedAt)-new Date(a.updatedAt));else notes.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  return notes.slice(0,limit);
}
function topicNodesFor(notes,index){return[...index.inverted.entries()].filter(([,ids])=>ids.length>=2&&ids.length<=Math.max(14,Math.floor(notes.length*.32))).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'ko')).slice(0,18).map(([label,ids])=>({label,ids}))}
function curvePath(a,b,bend=0){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,px=-dy/len,py=dx/len,cx=mx+px*bend,cy=my+py*bend;return`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
function forceLayout(nodes,links){
  const map=new Map(nodes.map(node=>[node.key,node]));
  const iterations=nodes.length>100?34:nodes.length>65?48:72;
  for(let iter=0;iter<iterations;iter++){
    const fx=new Map(nodes.map(node=>[node.key,0]));
    const fy=new Map(nodes.map(node=>[node.key,0]));
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y;
        const d2=Math.max(1000,dx*dx+dy*dy),distance=Math.sqrt(d2);
        const force=(nodes.length>90?3500:5600)/d2,ux=dx/distance,uy=dy/distance;
        fx.set(a.key,fx.get(a.key)+ux*force);fy.set(a.key,fy.get(a.key)+uy*force);
        fx.set(b.key,fx.get(b.key)-ux*force);fy.set(b.key,fy.get(b.key)-uy*force);
      }
    }
    for(const link of links){
      const a=map.get(link.aKey),b=map.get(link.bKey);if(!a||!b)continue;
      const dx=b.x-a.x,dy=b.y-a.y,distance=Math.max(1,Math.hypot(dx,dy));
      const target=link.type==='manual'?135:link.type==='auto'?180:150;
      const spring=link.type==='manual'?0.034:link.type==='auto'?0.019:0.014;
      const force=(distance-target)*spring,ux=dx/distance,uy=dy/distance;
      fx.set(a.key,fx.get(a.key)+ux*force);fy.set(a.key,fy.get(a.key)+uy*force);
      fx.set(b.key,fx.get(b.key)-ux*force);fy.set(b.key,fy.get(b.key)-uy*force);
    }
    for(const node of nodes){
      const centerPull=node.type==='topic'?0.012:0.005;
      fx.set(node.key,fx.get(node.key)+(500-node.x)*centerPull);
      fy.set(node.key,fy.get(node.key)+(330-node.y)*centerPull);
      node.x=Math.max(90,Math.min(910,node.x+Math.max(-8,Math.min(8,fx.get(node.key)))));
      node.y=Math.max(80,Math.min(620,node.y+Math.max(-8,Math.min(8,fy.get(node.key)))));
    }
  }
}
function highlightGraph(key){const related=new Set([key]);$$('.edge[data-a][data-b]').forEach(edge=>{const hot=edge.dataset.a===key||edge.dataset.b===key;edge.classList.toggle('hot',hot);edge.classList.toggle('dim',!hot);if(hot){related.add(edge.dataset.a);related.add(edge.dataset.b)}});$$('.gnode[data-node-key]').forEach(node=>{const hot=related.has(node.dataset.nodeKey);node.classList.toggle('hot',hot);node.classList.toggle('dim',!hot)});e.graphBox.classList.add('inspecting')}
function clearGraphHighlight(){e.graphBox?.classList.remove('inspecting');$$('.edge,.gnode').forEach(item=>item.classList.remove('hot','dim'))}
let graphBounds={minX:350,maxX:650,minY:250,maxY:450},graphSelectedNoteId=null,lastGraphAutoLinks=[],lastGraphManualLinks=[];
function relationFor(noteId){const related=[];for(const link of lastGraphManualLinks){if(link.a===noteId||link.b===noteId)related.push({other:link.a===noteId?link.b:link.a,type:'manual',reason:'직접 연결',link})}for(const link of lastGraphAutoLinks){if(link.a===noteId||link.b===noteId)related.push({other:link.a===noteId?link.b:link.a,type:'auto',reason:`공통 단어: ${link.shared.join(', ')}`,link})}return related}
function removeManualLink(a,b){const link=(state.noteLinks||[]).find(item=>linkKey(item.a,item.b)===linkKey(a,b)&&!item.deletedAt);if(!link)return;link.deletedAt=now();link.updatedAt=link.deletedAt;markDirty();save();renderGraph();toast('직접 연결을 해제했어.')}
function renderGraphInspector(noteId){graphSelectedNoteId=noteId;const note=state.notes.find(n=>n.id===noteId);if(!note){e.graphInspector.innerHTML='<div class="graph-inspector-empty"><strong>메모를 선택해.</strong><span>관련 메모와 연결 이유가 여기에 표시돼.</span></div>';return}const related=relationFor(noteId).sort((a,b)=>a.type==='manual'?-1:b.type==='manual'?1:0);e.graphInspector.innerHTML=`<h2>${esc(note.title)}</h2><p>${esc(preview(note))}</p><div class="graph-inspector-meta"><span class="note-badge">기록 ${note.entries.length}</span><span class="note-badge link">연결 ${related.length}</span>${incompleteTaskCount(note)?`<span class="note-badge task">미완료 ${incompleteTaskCount(note)}</span>`:''}</div><div class="graph-inspector-actions"><button class="classic primary" id="graphOpenNote">메모 열기</button><button class="classic" id="graphManageLinks">직접 연결 관리</button></div><h3>관련 메모</h3><div class="graph-related">${related.length?related.map(item=>{const other=state.notes.find(n=>n.id===item.other);return other?`<article class="graph-relation"><div class="graph-relation-head"><strong>${esc(other.title)}</strong>${item.type==='manual'?`<button class="tiny danger" data-remove-manual="${item.link.a}|${item.link.b}">해제</button>`:''}</div><small>${esc(item.reason)}</small></article>`:''}).join(''):'<div class="trash-empty">현재 표시 범위에서 연결된 메모가 없어.</div>'}</div>`;$('#graphOpenNote').onclick=()=>{switchView('notes');selectNote(noteId)};$('#graphManageLinks').onclick=()=>{state.selected=noteId;openLinkDialog()};$$('[data-remove-manual]').forEach(button=>button.onclick=()=>{const [a,b]=button.dataset.removeManual.split('|');removeManualLink(a,b)})}
function renderGraph(){
  const notes=graphSelectedNotes(),index=buildGraphIndex(notes),topics=topicNodesFor(notes,index),nodes=[];topics.forEach((topic,i)=>{const angle=Math.PI*2*i/Math.max(topics.length,1)-Math.PI/2,r=topics.length<=5?145:200;nodes.push({key:`topic:${topic.label}`,label:topic.label,x:500+Math.cos(angle)*r,y:330+Math.sin(angle)*r,w:105,h:40,type:'topic'})});notes.forEach((note,i)=>{const angle=Math.PI*2*i/Math.max(notes.length,1)-Math.PI/2,r=notes.length<=12?245:300;nodes.push({key:`note:${note.id}`,noteId:note.id,label:note.title.length>19?note.title.slice(0,19)+'…':note.title,x:500+Math.cos(angle)*r,y:330+Math.sin(angle)*r,w:176,h:44,type:'note'})});
  const links=[];for(const topic of topics)for(const noteId of topic.ids)if(notes.some(n=>n.id===noteId))links.push({aKey:`topic:${topic.label}`,bKey:`note:${noteId}`,type:'topic',score:1,shared:[topic.label]});const noteIds=new Set(notes.map(n=>n.id));lastGraphManualLinks=activeManualLinks().filter(link=>noteIds.has(link.a)&&noteIds.has(link.b));const manual=lastGraphManualLinks.map(link=>({a:link.a,b:link.b,aKey:`note:${link.a}`,bKey:`note:${link.b}`,type:'manual',score:9,shared:[]})),manualKeys=new Set(manual.map(link=>linkKey(link.a,link.b))),threshold=e.graphStrength?.value==='strong'?3.4:e.graphStrength?.value==='loose'?1.35:2.15;lastGraphAutoLinks=autoNoteLinks(notes,threshold).filter(link=>!manualKeys.has(linkKey(link.a,link.b)));const auto=lastGraphAutoLinks.map(link=>({...link,aKey:`note:${link.a}`,bKey:`note:${link.b}`}));links.push(...auto,...manual);forceLayout(nodes,links);const map=new Map(nodes.map(n=>[n.key,n]));e.edges.innerHTML=links.map((link,i)=>{const a=map.get(link.aKey),b=map.get(link.bKey);if(!a||!b)return'';const bend=link.type==='manual'?(i%2?18:-18):link.type==='auto'?(i%2?10:-10):0,cls=link.type==='manual'?'manual-edge':link.type==='auto'?'auto-edge':'topic-edge',title=link.type==='manual'?'직접 연결':link.type==='auto'?`공통: ${link.shared.join(', ')}`:`실제 주제: ${link.shared[0]}`;return `<path class="edge ${cls}" data-a="${esc(link.aKey)}" data-b="${esc(link.bKey)}" data-title="${esc(title)}" d="${curvePath(a,b,bend)}"><title>${esc(title)}</title></path>`}).join('');e.nodes.innerHTML=nodes.map(node=>`<g class="gnode ${node.type} ${node.noteId===graphSelectedNoteId?'selected':''}" data-node-key="${esc(node.key)}" transform="translate(${(node.x-node.w/2).toFixed(1)} ${(node.y-node.h/2).toFixed(1)})" ${node.noteId?`data-gnote="${node.noteId}"`:''}><rect width="${node.w}" height="${node.h}" rx="${node.type==='topic'?12:4}"></rect><text x="${node.w/2}" y="${node.h/2+4}">${esc(node.label)}</text></g>`).join('');$$('[data-gnote]').forEach(node=>{node.onclick=()=>handleGraphNoteClick(node,node.dataset.gnote);node.ondblclick=()=>{switchView('notes');selectNote(node.dataset.gnote)}});$$('.gnode[data-node-key]').forEach(node=>{node.onmouseenter=()=>highlightGraph(node.dataset.nodeKey);node.onmouseleave=clearGraphHighlight});$$('.edge').forEach(edge=>edge.onclick=event=>{event.stopPropagation();$$('.edge').forEach(x=>x.classList.remove('selected'));edge.classList.add('selected');e.graphInspector.innerHTML=`<h2>연결 정보</h2><p>${esc(edge.dataset.title)}</p><div class="graph-inspector-actions"><button class="classic" id="edgeClear">선택 해제</button></div>`;$('#edgeClear').onclick=()=>{edge.classList.remove('selected');renderGraphInspector(graphSelectedNoteId)}});$('#graphStats').textContent=`표시 ${notes.length} · 자동 ${auto.length} · 직접 ${manual.length} · 주제 ${topics.length}`;if(nodes.length)graphBounds={minX:Math.min(...nodes.map(n=>n.x-n.w/2)),maxX:Math.max(...nodes.map(n=>n.x+n.w/2)),minY:Math.min(...nodes.map(n=>n.y-n.h/2)),maxY:Math.max(...nodes.map(n=>n.y+n.h/2))};else graphBounds={minX:350,maxX:650,minY:250,maxY:450};renderGraphInspector(graphSelectedNoteId&&noteIds.has(graphSelectedNoteId)?graphSelectedNoteId:null)}

let gt={x:0,y:0,s:1};
let drag=null;
const graphPointers=new Map();
let pinch=null;
let suppressGraphClickUntil=0;

function clampGraphTransform(){
  const marginX=90,marginY=70;
  const scaledW=(graphBounds.maxX-graphBounds.minX)*gt.s;
  const scaledH=(graphBounds.maxY-graphBounds.minY)*gt.s;

  if(scaledW<1000-marginX*2){
    const center=(graphBounds.minX+graphBounds.maxX)/2;
    gt.x=500-center*gt.s;
  }else{
    const minX=marginX-graphBounds.maxX*gt.s;
    const maxX=1000-marginX-graphBounds.minX*gt.s;
    gt.x=Math.max(minX,Math.min(maxX,gt.x));
  }

  if(scaledH<700-marginY*2){
    const center=(graphBounds.minY+graphBounds.maxY)/2;
    gt.y=350-center*gt.s;
  }else{
    const minY=marginY-graphBounds.maxY*gt.s;
    const maxY=700-marginY-graphBounds.minY*gt.s;
    gt.y=Math.max(minY,Math.min(maxY,gt.y));
  }
}
function applyGraph(){
  clampGraphTransform();
  e.viewport.setAttribute("transform",`translate(${gt.x.toFixed(2)} ${gt.y.toFixed(2)}) scale(${gt.s.toFixed(4)})`);
}
function clientToGraphPoint(clientX,clientY){
  const rect=e.graph.getBoundingClientRect();
  if(!rect.width||!rect.height)return{x:500,y:350};
  return{
    x:(clientX-rect.left)*1000/rect.width,
    y:(clientY-rect.top)*700/rect.height
  };
}
function zoomGraphAt(clientX,clientY,nextScale){
  const point=clientToGraphPoint(clientX,clientY);
  const worldX=(point.x-gt.x)/gt.s;
  const worldY=(point.y-gt.y)/gt.s;
  gt.s=Math.max(.45,Math.min(2.8,nextScale));
  gt.x=point.x-worldX*gt.s;
  gt.y=point.y-worldY*gt.s;
  applyGraph();
}
function fitGraph(){
  const width=Math.max(1,graphBounds.maxX-graphBounds.minX);
  const height=Math.max(1,graphBounds.maxY-graphBounds.minY);
  const centerX=(graphBounds.minX+graphBounds.maxX)/2;
  const centerY=(graphBounds.minY+graphBounds.maxY)/2;
  const mobile=window.innerWidth<=760;
  const padX=mobile?150:190;
  const padY=mobile?150:180;
  const scale=Math.max(.48,Math.min(1.35,Math.min((1000-padX)/width,(700-padY)/height)));
  gt={s:scale,x:500-centerX*scale,y:350-centerY*scale};
  applyGraph();
}


let graphLinkMode=false,graphLinkSource=null;
function clearGraphLinkSelection(){$$(".gnode").forEach(n=>n.classList.remove("graph-link-source"))}
function setGraphLinkMode(on){
  graphLinkMode=!!on;graphLinkSource=null;clearGraphLinkSelection();
  e.graphBox?.classList.toggle("link-mode",graphLinkMode);
  $("#graphLinkModeBtn").textContent=graphLinkMode?"연결 취소":"직접 연결";
  $("#graphLinkBanner").textContent="첫 번째 메모를 클릭한 뒤 → 연결할 두 번째 메모를 클릭해."
}
function handleGraphNoteClick(g,noteId){
  if(Date.now()<suppressGraphClickUntil)return;
  if(!graphLinkMode){graphSelectedNoteId=noteId;$$('.gnode').forEach(node=>node.classList.toggle('selected',node.dataset.gnote===noteId));renderGraphInspector(noteId);highlightGraph(`note:${noteId}`);return}
  if(!graphLinkSource){
    graphLinkSource=noteId;clearGraphLinkSelection();g.classList.add("graph-link-source");
    $("#graphLinkBanner").textContent="첫 번째 메모 선택 완료. 이제 연결할 두 번째 메모를 클릭해.";
    return
  }
  if(graphLinkSource===noteId){graphLinkSource=null;clearGraphLinkSelection();return}
  const pair=[graphLinkSource,noteId].sort(),a=pair[0],b=pair[1],t=now();
  let link=(state.noteLinks||[]).find(l=>l.a===a&&l.b===b);
  if(link){link.deletedAt=null;link.updatedAt=t}else state.noteLinks.push({id:uid("link"),a,b,createdAt:t,updatedAt:t,deletedAt:null});
  markDirty();save();toast("두 메모를 직접 연결했어.");setGraphLinkMode(false);renderGraph();requestAnimationFrame(fitGraph)
}
let linkDialogSelection=new Set();
function renderLinkCandidates(){
  const note=selected();if(!note)return;const query=($("#linkSearch").value||"").trim().toLowerCase();
  const matches=state.notes.filter(item=>item.id!==note.id&&(!query||cachedNoteText(item).all.includes(query))).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  const visible=matches.slice(0,200),list=$("#linkList");$("#linkResultCount").textContent=`표시 ${visible.length} / 결과 ${matches.length}`;
  list.innerHTML=visible.length?visible.map(item=>`<label class="link-row"><input type="checkbox" data-link-note="${item.id}" ${linkDialogSelection.has(item.id)?"checked":""}><span><strong>${esc(item.title)}</strong><span>${esc(preview(item))}</span></span></label>`).join(""):`<div class="link-empty">연결할 다른 메모가 없어.</div>`;
  $$('[data-link-note]').forEach(box=>box.onchange=()=>{if(box.checked)linkDialogSelection.add(box.dataset.linkNote);else linkDialogSelection.delete(box.dataset.linkNote)});
}
function openLinkDialog(){
  const note=selected();if(!note)return;linkDialogSelection=new Set(activeManualLinks().filter(link=>link.a===note.id||link.b===note.id).map(link=>link.a===note.id?link.b:link.a));
  $("#linkSearch").value="";renderLinkCandidates();$("#linkDialog").showModal();setTimeout(()=>$("#linkSearch").focus(),20);
}
function saveManualLinks(){
  const note=selected();if(!note)return;const t=now();
  for(const other of state.notes.filter(item=>item.id!==note.id)){
    const pair=[note.id,other.id].sort(),a=pair[0],b=pair[1];let link=(state.noteLinks||[]).find(item=>item.a===a&&item.b===b);const want=linkDialogSelection.has(other.id),active=link&&!link.deletedAt;
    if(want&&!active){if(link){link.deletedAt=null;link.updatedAt=t}else state.noteLinks.push({id:uid("link"),a,b,createdAt:t,updatedAt:t,deletedAt:null})}
    else if(!want&&active){link.deletedAt=t;link.updatedAt=t}
  }
  $("#linkDialog").close();if(state.view==='graph')renderGraph();markDirty();save();toast("메모 연결을 저장했어.");
}
function render(){renderList();renderDetail();if(state.view==='review')renderReview();if(state.view==='graph')renderGraph();updateTrashBadges();switchView(state.view,false)}function selectNote(id,source='normal'){const note=state.notes.find(n=>n.id===id);state.selected=id;if(note){note.lastViewedAt=now();note.viewCount=(Number(note.viewCount)||0)+1;if(source==='review')note.lastReviewedAt=now()}renderList();renderDetail();if(innerWidth<=760){e.layout.classList.add("detail-open");document.body.classList.add("mobile-detail")}save()}
function editorHtml(ed){return sanitizeHtml(ed.innerHTML)}function editorText(ed){return htmlToText(ed.innerHTML).trim()}

function openNewNoteWindow(){
  const draft=getDraft("new");
  e.newNoteEditor.innerHTML=draft?.html||"";
  e.newTitle.value=draft?.title||"";
  updateEditorCount(e.newNoteEditor,e.newCount);
  setDraftStatus(e.draftNew,draft);
  e.newNoteDlg.showModal();
  setTimeout(()=>e.newNoteEditor.focus(),30);
  if(draft)toast("작성 중이던 새 메모를 복구했어.");
}
function createFromWindow(){
  const plain=editorText(e.newNoteEditor);if(!plain)return toast("내용을 입력해.");
  const t=now(),n={id:uid("note"),title:e.newTitle.value.trim()||titleFrom(plain),createdAt:t,updatedAt:t,entries:[{id:uid("entry"),content:editorHtml(e.newNoteEditor),format:"html",createdAt:t,updatedAt:t,revisions:[]}]};
  state.notes.unshift(n);state.selected=n.id;e.newNoteEditor.innerHTML="";e.newTitle.value="";updateEditorCount(e.newNoteEditor,e.newCount);clearDraft("new",e.draftNew,false);e.newNoteDlg.close();render();if(innerWidth<=760){e.layout.classList.add("detail-open");document.body.classList.add("mobile-detail")}markDirty();save();toast("새 메모를 저장했어.");
}
function openAppendWindow(){
  const n=selected();if(!n)return;
  const key=`append:${n.id}`,draft=getDraft(key);
  $("#appendWindowTitle").textContent=`${n.title} · 이어서 기록`;
  e.appendNoteEditor.innerHTML=draft?.html||"";
  updateEditorCount(e.appendNoteEditor,e.appendCount);
  setDraftStatus(e.draftAppend,draft);
  e.appendNoteDlg.showModal();
  setTimeout(()=>e.appendNoteEditor.focus(),30);
  if(draft)toast("작성 중이던 이어쓰기를 복구했어.");
}
function appendFromWindow(){
  const n=selected(),plain=editorText(e.appendNoteEditor);if(!n)return;if(!plain)return toast("이어 쓸 내용을 입력해.");
  const t=now(),key=`append:${n.id}`;n.entries.push({id:uid("entry"),content:editorHtml(e.appendNoteEditor),format:"html",createdAt:t,updatedAt:t,revisions:[]});n.updatedAt=t;
  e.appendNoteEditor.innerHTML="";updateEditorCount(e.appendNoteEditor,e.appendCount);clearDraft(key,e.draftAppend,false);e.appendNoteDlg.close();render();markDirty();save();e.timeline.scrollTop=e.timeline.scrollHeight;toast("기록을 이어서 추가했어.");
}
function create(){const plain=editorText(e.quick);if(!plain)return toast("내용을 입력해.");const t=now(),n={id:uid("note"),title:titleFrom(plain),createdAt:t,updatedAt:t,entries:[{id:uid("entry"),content:editorHtml(e.quick),format:"html",createdAt:t,updatedAt:t,revisions:[]}]};state.notes.unshift(n);state.selected=n.id;e.quick.innerHTML="";render();if(innerWidth<=760){e.layout.classList.add("detail-open");document.body.classList.add("mobile-detail")}markDirty();save();toast("새 메모를 저장했어.")}
function append(){const n=selected(),plain=editorText(e.append);if(!n)return;if(!plain)return toast("이어 쓸 내용을 입력해.");const t=now();n.entries.push({id:uid("entry"),content:editorHtml(e.append),format:"html",createdAt:t,updatedAt:t,revisions:[]});n.updatedAt=t;e.append.innerHTML="";render();markDirty();save();e.timeline.scrollTop=e.timeline.scrollHeight;toast("기록을 이어서 추가했어.")}
function rename(){const n=selected();if(!n)return;const v=e.title.value.trim();if(!v){e.title.value=n.title;return}if(v!==n.title){n.title=v;n.updatedAt=now();renderList();if(state.view==='review')renderReview();if(state.view==='graph')renderGraph();e.updated.textContent=fmt(n.updatedAt);markDirty();save();toast("제목을 수정했어.")}}
function openEdit(id){const n=selected(),x=n?.entries.find(a=>a.id===id);if(!x)return;editing=id;const draft=getDraft(`edit:${id}`);e.editEditor.innerHTML=draft?.html||entryHtml(x);updateEditorCount(e.editEditor,e.editCount);setDraftStatus(e.draftEdit,draft);e.editDlg.querySelector(".dlg-title strong").textContent=`${n.title} · 기록 수정`;e.editDlg.showModal();setTimeout(()=>e.editEditor.focus(),30);if(draft)toast("작성 중이던 수정 내용을 복구했어.")}function saveEdit(ev){ev.preventDefault();const n=selected(),x=n?.entries.find(a=>a.id===editing),plain=editorText(e.editEditor);if(!x||!plain)return toast("수정 내용을 입력해.");const html=editorHtml(e.editEditor),oldPlain=entryText(x),newPlain=htmlToText(html);if(newPlain===oldPlain&&x.format==="html"){e.editDlg.close();return}const t=now();x.revisions=x.revisions||[];x.revisions.unshift({id:uid("rev"),content:x.content,format:x.format||"plain",replacedAt:t});x.content=html;x.format="html";x.updatedAt=t;n.updatedAt=t;clearDraft(`edit:${editing}`,e.draftEdit,false);e.editDlg.close();render();markDirty();save();toast("수정 전 내용도 이력에 보관했어.")}
function openHistory(id){const x=selected()?.entries.find(a=>a.id===id);if(!x)return;e.histList.innerHTML=x.revisions?.length?x.revisions.map((r,i)=>`<article class="history-item"><div class="history-date">${i+1}번째 이전 내용 · ${fmt(r.replacedAt)}</div><div class="history-body">${r.format==="html"?sanitizeHtml(r.content):esc(r.content).replace(/\n/g,"<br>")}</div></article>`).join(""):"<p>수정 이력이 없어.</p>";e.histDlg.showModal()}
function remove(){
  const note=selected();if(!note)return;
  if(!confirm(`"${note.title}" 메모를 휴지통으로 이동할까?`))return;
  const deletedAt=now();
  createSnapshot("삭제 직전 보호",true);
  const savedLinks=(state.noteLinks||[]).filter(link=>(link.a===note.id||link.b===note.id)&&!link.deletedAt).map(link=>({...link}));
  const trashItem={id:uid("trash"),note:JSON.parse(JSON.stringify(note)),links:savedLinks,deletedAt};
  state.trash.unshift(trashItem);
  const tomb=(state.deletedNotes||[]).find(item=>item.id===note.id);
  if(tomb)tomb.deletedAt=deletedAt;else state.deletedNotes.push({id:note.id,deletedAt});
  (state.noteLinks||[]).forEach(link=>{if((link.a===note.id||link.b===note.id)&&!link.deletedAt){link.deletedAt=deletedAt;link.updatedAt=deletedAt}});
  state.notes=state.notes.filter(item=>item.id!==note.id);
  state.selected=state.notes[0]?.id||null;
  e.layout.classList.remove("detail-open");
  render();
  markDirty();
  save();
  toast("메모를 휴지통으로 이동했어.","되돌리기",()=>restoreTrashItem(trashItem.id));
}
function switchView(v,p=true){state.view=v;$$('[data-panel]').forEach(x=>x.classList.toggle('active',x.dataset.panel===v));$$('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v));if(v==='graph'){renderGraph();requestAnimationFrame(fitGraph)}if(v==='review')renderReview();if(p)save()}
function downloadText(filename,text,type="text/plain"){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),anchor=document.createElement("a");
  anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url);
}
function exportData(){
  downloadText(`suryunggil-commaeng-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(backupState(),null,2),"application/json");
  toast("JSON 전체 백업을 저장했어.");
}
function exportMarkdown(){
  const lines=["# 수령길-컴맹 메모 백업","",`백업 시각: ${fmt(now())}`,""];
  for(const note of [...state.notes].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))){
    lines.push(`## ${note.title}`,"",`- 최초 기록: ${fmt(note.createdAt)}`,`- 최종 수정: ${fmt(note.updatedAt)}`,"");
    note.entries.forEach((entry,index)=>{
      lines.push(`### ${index===0?"최초 기록":`${index+1}번째 기록`} · ${fmt(entry.createdAt)}`,"",entryText(entry),"");
    });
  }
  downloadText(`suryunggil-commaeng-${new Date().toISOString().slice(0,10)}.md`,lines.join("\n"),"text/markdown");
  toast("Markdown 백업을 저장했어.");
}

function safeIso(value,fallback=Date.now()){const date=new Date(value||fallback);if(Number.isNaN(date.getTime()))return new Date(fallback).toISOString();return date.toISOString()}
function normalizeImportedNote(raw,seen){
  if(!raw||typeof raw!=="object")return null;let id=String(raw.id||uid("note"));if(seen.has(id))id=uid("note");seen.add(id);
  const entries=(Array.isArray(raw.entries)?raw.entries:[]).slice(0,10000).map(entry=>{const content=entry?.format==="html"?sanitizeHtml(String(entry?.content||"")):esc(String(entry?.content||"")).replace(/\n/g,"<br>");return{id:String(entry?.id||uid("entry")),content,format:"html",createdAt:safeIso(entry?.createdAt||raw.createdAt),updatedAt:safeIso(entry?.updatedAt||entry?.createdAt),revisions:(Array.isArray(entry?.revisions)?entry.revisions:[]).slice(0,200).map(revision=>({id:String(revision?.id||uid("rev")),content:revision?.format==="html"?sanitizeHtml(String(revision?.content||"")):esc(String(revision?.content||"")).replace(/\n/g,"<br>"),format:"html",replacedAt:safeIso(revision?.replacedAt)}))}});
  if(!entries.length)return null;return{id,title:String(raw.title||titleFrom(entries.map(entryText).join(" "))).slice(0,160),createdAt:safeIso(raw.createdAt),updatedAt:safeIso(raw.updatedAt||raw.createdAt),lastViewedAt:safeIso(raw.lastViewedAt||raw.createdAt),lastReviewedAt:raw.lastReviewedAt?safeIso(raw.lastReviewedAt):null,viewCount:Math.max(0,Number(raw.viewCount)||0),entries};
}
function normalizeImportedData(data){
  if(!data||!Array.isArray(data.notes))throw new Error("notes missing");if(data.notes.length>MAX_NOTES)throw new Error("too many notes");const seen=new Set(),notes=data.notes.map(raw=>normalizeImportedNote(raw,seen)).filter(Boolean),ids=new Set(notes.map(note=>note.id)),pairSeen=new Set();
  const noteLinks=(Array.isArray(data.noteLinks)?data.noteLinks:[]).filter(link=>link&&ids.has(String(link.a))&&ids.has(String(link.b))&&String(link.a)!==String(link.b)).slice(0,200000).map(link=>({id:String(link.id||uid("link")),a:String(link.a),b:String(link.b),createdAt:safeIso(link.createdAt),updatedAt:safeIso(link.updatedAt||link.createdAt),deletedAt:link.deletedAt?safeIso(link.deletedAt):null})).filter(link=>{const key=linkKey(link.a,link.b);if(pairSeen.has(key))return false;pairSeen.add(key);return true});
  const trashSeen=new Set(ids),trash=(Array.isArray(data.trash)?data.trash:[]).slice(0,10000).map(item=>{const note=normalizeImportedNote(item?.note,trashSeen);return note?{id:String(item.id||uid("trash")),note,links:[],deletedAt:safeIso(item.deletedAt)}:null}).filter(Boolean);
  return{schemaVersion:9,notes,noteLinks,deletedNotes:trash.map(item=>({id:item.note.id,deletedAt:item.deletedAt})),trash,selected:notes[0]?.id||null,view:"notes",reviewShuffle:Math.max(0,Number(data.reviewShuffle)||0),dataUpdatedAt:now()};
}

async function importData(file){
  if(!file)return;
  if(file.size>MAX_IMPORT_BYTES){toast('백업 파일은 20MB 이하만 가져올 수 있어.');e.importFile.value='';return}
  try{const raw=JSON.parse(await file.text()),data=normalizeImportedData(raw);if(!confirm(`정상 메모 ${data.notes.length.toLocaleString()}개를 가져오면 현재 데이터가 교체돼.
현재 상태는 먼저 복구 지점으로 저장돼. 계속할까?`))return;createSnapshot('가져오기 직전 보호',true);state=data;await persistState();render();e.backupDlg.close();toast('검증된 백업 데이터를 가져왔어.')}catch(error){console.error(error);toast('유효하고 안전한 수령길-컴맹 JSON 파일이 아니야.')}finally{e.importFile.value=''}
}

function updateEditorCount(editor,countElement){
  if(!editor||!countElement)return;
  const text=htmlToText(editor.innerHTML).trim();
  const characters=[...text].length;
  const words=text?text.split(/\s+/).filter(Boolean).length:0;
  countElement.textContent=`${characters.toLocaleString()}자 · ${words.toLocaleString()}단어`;
}
function normalizeLink(raw=""){
  const value=raw.trim();
  if(!value)return "";
  if(/^mailto:/i.test(value))return value;
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return `mailto:${value}`;
  if(/^https?:\/\//i.test(value))return value;
  return `https://${value}`;
}
function insertLink(target){
  target.focus();
  const selection=window.getSelection();
  const selectedText=selection?.toString().trim()||"";
  const raw=prompt("연결할 주소를 입력해.",selectedText&&/^https?:/i.test(selectedText)?selectedText:"");
  if(!raw)return;
  const href=normalizeLink(raw);
  if(!href)return;
  if(selectedText)document.execCommand("createLink",false,href);
  else document.execCommand("insertHTML",false,`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a>`);
  target.dispatchEvent(new Event("input",{bubbles:true}));
}
function insertTaskLine(target){
  target.focus();
  document.execCommand("insertHTML",false,'<div class="task-line" data-checked="false"><span class="task-marker" data-checked="false" contenteditable="false">☐</span><span class="task-text">&nbsp;할 일</span></div><div><br></div>');
  target.dispatchEvent(new Event("input",{bubbles:true}));
}
function bindTaskToggle(container,onChange){
  if(!container||container.dataset.taskBound==="1")return;
  container.dataset.taskBound="1";
  container.addEventListener("click",event=>{
    const marker=event.target.closest(".task-marker");
    if(!marker||!container.contains(marker))return;
    event.preventDefault();
    event.stopPropagation();
    const line=marker.closest(".task-line");
    if(!line)return;
    const checked=line.dataset.checked!=="true";
    line.dataset.checked=checked?"true":"false";
    marker.dataset.checked=checked?"true":"false";
    marker.textContent=checked?"✓":"☐";
    onChange?.(line,checked);
  });
}
function insertSanitizedPaste(target,event){
  event.preventDefault();
  const html=event.clipboardData?.getData("text/html")||"";
  const text=event.clipboardData?.getData("text/plain")||"";
  if(html)document.execCommand("insertHTML",false,sanitizeHtml(html));
  else document.execCommand("insertText",false,text);
  target.dispatchEvent(new Event("input",{bubbles:true}));
}
function refreshToolbarState(toolbar){
  if(!toolbar)return;
  toolbar.querySelectorAll("[data-cmd]").forEach(button=>{
    const command=button.dataset.cmd;
    if(!["bold","underline","strikeThrough","insertUnorderedList","insertOrderedList"].includes(command))return;
    let active=false;
    try{active=document.queryCommandState(command)}catch(_){}
    button.classList.toggle("active",active);
  });
}
function handleEditorShortcut(editor,event){
  if(!(event.ctrlKey||event.metaKey))return;
  const key=event.key.toLowerCase();
  if(key==="b"){event.preventDefault();document.execCommand("bold")}
  else if(key==="u"){event.preventDefault();document.execCommand("underline")}
  else if(key==="k"){event.preventDefault();insertLink(editor)}
  else if(event.shiftKey&&key==="x"){event.preventDefault();document.execCommand("strikeThrough")}
  else return;
  editor.dispatchEvent(new Event("input",{bubbles:true}));
}
function setupEditorSurface(editor,countElement){
  if(!editor)return;
  updateEditorCount(editor,countElement);
  bindTaskToggle(editor,()=>editor.dispatchEvent(new Event("input",{bubbles:true})));
  editor.addEventListener("paste",event=>insertSanitizedPaste(editor,event));
  editor.addEventListener("keydown",event=>handleEditorShortcut(editor,event));
  editor.addEventListener("input",()=>updateEditorCount(editor,countElement));
}

function setupToolbar(){
  $$("[data-toolbar-for]").forEach(toolbar=>{
    const target=$("#"+toolbar.dataset.toolbarFor);
    toolbar.querySelectorAll("[data-cmd]").forEach(button=>button.addEventListener("mousedown",event=>{
      event.preventDefault();
      target.focus();
      document.execCommand(button.dataset.cmd,false,null);
      target.dispatchEvent(new Event("input",{bubbles:true}));
      refreshToolbarState(toolbar);
    }));
    toolbar.querySelector('[data-action="link"]')?.addEventListener("mousedown",event=>{
      event.preventDefault();
      insertLink(target);
    });
    toolbar.querySelector('[data-action="task"]')?.addEventListener("mousedown",event=>{
      event.preventDefault();
      insertTaskLine(target);
    });
    const size=toolbar.querySelector("[data-size]");
    size?.addEventListener("change",()=>{
      target.focus();
      document.execCommand("fontSize",false,size.value);
      target.dispatchEvent(new Event("input",{bubbles:true}));
    });
    target.addEventListener("keyup",()=>refreshToolbarState(toolbar));
    target.addEventListener("mouseup",()=>refreshToolbarState(toolbar));
    target.addEventListener("focus",()=>refreshToolbarState(toolbar));
  });
  setupEditorSurface(e.newNoteEditor,e.newCount);
  setupEditorSurface(e.appendNoteEditor,e.appendCount);
  setupEditorSurface(e.editEditor,e.editCount);
}

e.graph.addEventListener('wheel',event=>{
  event.preventDefault();
  const factor=event.deltaY>0?.90:1.10;
  zoomGraphAt(event.clientX,event.clientY,gt.s*factor);
},{passive:false});

e.graph.addEventListener('pointerdown',event=>{
  event.preventDefault();
  graphPointers.set(event.pointerId,{x:event.clientX,y:event.clientY,target:event.target});
  try{e.graph.setPointerCapture(event.pointerId)}catch(_){}

  if(graphPointers.size===2){
    const points=[...graphPointers.values()];
    const first=clientToGraphPoint(points[0].x,points[0].y);
    const second=clientToGraphPoint(points[1].x,points[1].y);
    const middle={x:(first.x+second.x)/2,y:(first.y+second.y)/2};
    const distance=Math.max(8,Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y));
    pinch={
      startDist:distance,
      startScale:gt.s,
      worldX:(middle.x-gt.x)/gt.s,
      worldY:(middle.y-gt.y)/gt.s
    };
    drag=null;
    suppressGraphClickUntil=Date.now()+350;
    return;
  }

  if(event.target.closest('.gnode')){
    drag=null;
    return;
  }

  clearGraphHighlight();
  const point=clientToGraphPoint(event.clientX,event.clientY);
  drag={
    pointerId:event.pointerId,
    startX:point.x,
    startY:point.y,
    tx:gt.x,
    ty:gt.y
  };
});

e.graph.addEventListener('pointermove',event=>{
  if(!graphPointers.has(event.pointerId))return;
  event.preventDefault();
  graphPointers.set(event.pointerId,{x:event.clientX,y:event.clientY,target:event.target});

  if(graphPointers.size>=2&&pinch){
    const points=[...graphPointers.values()].slice(0,2);
    const first=clientToGraphPoint(points[0].x,points[0].y);
    const second=clientToGraphPoint(points[1].x,points[1].y);
    const currentDistance=Math.max(8,Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y));
    const middle={x:(first.x+second.x)/2,y:(first.y+second.y)/2};
    const scale=Math.max(.45,Math.min(2.8,pinch.startScale*(currentDistance/pinch.startDist)));
    gt.s=scale;
    gt.x=middle.x-pinch.worldX*scale;
    gt.y=middle.y-pinch.worldY*scale;
    applyGraph();
    suppressGraphClickUntil=Date.now()+350;
    return;
  }

  if(!drag||drag.pointerId!==event.pointerId)return;
  const point=clientToGraphPoint(event.clientX,event.clientY);
  const dx=point.x-drag.startX;
  const dy=point.y-drag.startY;
  if(Math.abs(dx)+Math.abs(dy)>3)suppressGraphClickUntil=Date.now()+250;
  gt.x=drag.tx+dx;
  gt.y=drag.ty+dy;
  applyGraph();
},{passive:false});

function endGraphPointer(event){
  graphPointers.delete(event.pointerId);
  try{e.graph.releasePointerCapture(event.pointerId)}catch(_){}
  if(graphPointers.size<2)pinch=null;
  if(drag?.pointerId===event.pointerId)drag=null;
}
['pointerup','pointercancel','lostpointercapture'].forEach(type=>{
  e.graph.addEventListener(type,endGraphPointer);
});


e.newNoteEditor.addEventListener("input",()=>scheduleDraft("new",e.newNoteEditor,e.draftNew));
e.newTitle.addEventListener("input",()=>scheduleDraft("new",e.newNoteEditor,e.draftNew));
e.appendNoteEditor.addEventListener("input",()=>{const note=selected();if(note)scheduleDraft(`append:${note.id}`,e.appendNoteEditor,e.draftAppend)});
e.editEditor.addEventListener("input",()=>{if(editing)scheduleDraft(`edit:${editing}`,e.editEditor,e.draftEdit)});

$("#clearNewDraft").onclick=()=>{e.newNoteEditor.innerHTML="";e.newTitle.value="";updateEditorCount(e.newNoteEditor,e.newCount);clearDraft("new",e.draftNew)};
$("#clearAppendDraft").onclick=()=>{const note=selected();e.appendNoteEditor.innerHTML="";if(note)clearDraft(`append:${note.id}`,e.draftAppend)};
$("#clearEditDraft").onclick=()=>{if(!editing)return;e.editEditor.innerHTML=entryHtml(selected()?.entries.find(entry=>entry.id===editing)||{content:""});clearDraft(`edit:${editing}`,e.draftEdit)};

$("#trashBtn").onclick=openTrash;
$("#trashTopBtn").onclick=openTrash;
$("#trashClose").onclick=()=>e.trashDlg.close();
$("#trashCloseX").onclick=()=>e.trashDlg.close();
$("#emptyTrash").onclick=emptyTrash;

$("#backupBtn").onclick=openBackup;
$("#backupTop").onclick=openBackup;
$("#backupClose").onclick=()=>e.backupDlg.close();
$("#backupCloseX").onclick=()=>e.backupDlg.close();
$("#exportJsonBtn").onclick=exportData;
$("#exportMarkdownBtn").onclick=exportMarkdown;
$("#importBackupBtn").onclick=()=>e.importFile.click();
$("#createSnapshotBtn").onclick=()=>createSnapshot("수동 복구 지점");

$('#newBtn').onclick=openNewNoteWindow;$('#quickEditorWrap').onclick=openNewNoteWindow;$('#appendBtn').onclick=openAppendWindow;$('#appendEditorWrap').onclick=openAppendWindow;$('#newNoteSave').onclick=createFromWindow;$('#newNoteCancel').onclick=()=>e.newNoteDlg.close();$('#newNoteCloseX').onclick=()=>e.newNoteDlg.close();e.newNoteEditor.addEventListener('keydown',a=>{if((a.ctrlKey||a.metaKey)&&a.key==='Enter'){a.preventDefault();createFromWindow()}});$('#appendNoteSave').onclick=appendFromWindow;$('#appendNoteCancel').onclick=()=>e.appendNoteDlg.close();$('#appendNoteCloseX').onclick=()=>e.appendNoteDlg.close();e.appendNoteEditor.addEventListener('keydown',a=>{if((a.ctrlKey||a.metaKey)&&a.key==='Enter'){a.preventDefault();appendFromWindow()}});e.title.onchange=rename;e.title.onblur=rename;e.search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{listLimit=160;renderList()},100)};e.searchScope.onchange=()=>{listLimit=160;renderList()};e.sort.onchange=()=>{listLimit=160;renderList()};$('#searchClear').onclick=()=>{e.search.value='';e.searchScope.value='all';listLimit=160;renderList()};e.loadMore.onclick=()=>{listLimit+=160;renderList()};$('#deleteBtn').onclick=remove;$('#backBtn').onclick=()=>{e.layout.classList.remove('detail-open');document.body.classList.remove('mobile-detail')};$('#saveEdit').onclick=saveEdit;e.editEditor.addEventListener('keydown',a=>{if((a.ctrlKey||a.metaKey)&&a.key==='Enter'){a.preventDefault();saveEdit(a)}});$('#linkBtn').onclick=openLinkDialog;$('#linkSearch').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderLinkCandidates,100)};$('#linkClose').onclick=()=>$('#linkDialog').close();$('#linkCloseX').onclick=()=>$('#linkDialog').close();$('#linkSave').onclick=saveManualLinks;e.importFile.onchange=()=>importData(e.importFile.files?.[0]);
[e.newNoteEditor,e.appendNoteEditor,e.editEditor].forEach(editor=>{
  editor.addEventListener("click",event=>{
    const link=event.target.closest("a");
    if(link)event.preventDefault();
  });
});

let graphTimer=0;const refreshGraph=()=>{clearTimeout(graphTimer);graphTimer=setTimeout(()=>{renderGraph();requestAnimationFrame(fitGraph)},100)};e.graphSearch.oninput=refreshGraph;e.graphMode.onchange=refreshGraph;e.graphLimit.onchange=refreshGraph;e.graphStrength.onchange=refreshGraph;$('#graphLinkModeBtn').onclick=()=>setGraphLinkMode(!graphLinkMode);$('#resetGraph').onclick=fitGraph;$('#reviewShuffle').onclick=()=>{state.reviewShuffle=(Number(state.reviewShuffle)||0)+1;renderReview();markDirty();save()};e.reviewMode.onchange=renderReview;$('#persistStorageBtn').onclick=requestPersistentStorage;$$('[data-view]').forEach(b=>b.onclick=()=>{e.layout.classList.remove('detail-open');document.body.classList.remove('mobile-detail');switchView(b.dataset.view)});$('#menuFile').onclick=()=>toast('왼쪽 아래에서 백업을 내보내거나 가져올 수 있어.');$('#menuView').onclick=()=>toast('메모·생각 연결·다시보기를 선택해.');$('#menuHelp').onclick=()=>toast('굵게·밑줄·취소선·목록·체크 항목·링크·Undo/Redo를 지원해.');let resizeTimer=0;
addEventListener('resize',()=>{
  if(innerWidth>760){e.layout.classList.remove('detail-open');document.body.classList.remove('mobile-detail')};
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    syncViewportHeight(false);
    if(state.view==='graph')fitGraph();
  },140);
});
let viewportRAF=0;
let lastStableHeight=0;
function syncViewportHeight(force=false){
  cancelAnimationFrame(viewportRAF);
  viewportRAF=requestAnimationFrame(()=>{
    const viewport=window.visualViewport;
    const height=Math.round(viewport?viewport.height:window.innerHeight);
    if(!force&&Math.abs(height-lastStableHeight)<3)return;
    lastStableHeight=height;
    document.documentElement.style.setProperty('--stable-vh',`${height}px`);
  });
}
syncViewportHeight(true);
window.visualViewport?.addEventListener('resize',()=>syncViewportHeight(false));
window.addEventListener('orientationchange',()=>{
  setTimeout(()=>{
    syncViewportHeight(true);
    if(state.view==='graph'){
      renderGraph();
      requestAnimationFrame(fitGraph);
    }
  },220);
});
purgeExpiredTrash();setupToolbar();render();save();ensureDailySnapshot();refreshStorageInfo();
})();
