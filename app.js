/**
 * app.js — 개인 아카이브 웹페이지 (Firebase Firestore + Storage 연동)
 *
 * 목차
 *  1.  Firebase 초기화
 *  2.  시드 데이터
 *  3.  유틸리티
 *  4.  Firestore CRUD 헬퍼
 *  5.  Storage 업로드 헬퍼
 *  6.  관리자 인증 + 편집 모드
 *  7.  테마
 *  8.  스크롤 진행도 + 리빌
 *  9.  네비게이션
 * 10.  BGM 플레이어
 * 11.  최근 업데이트 ticker
 * 12.  폴더 열기/닫기
 * 13.  영상 렌더링 + YouTube 링크
 * 14.  글쓰기 렌더링 + 모달
 * 15.  독서 기록 — 책장 + 모달
 * 16.  독서 통계 바 차트
 * 17.  📷 사진 기능 (직접 업로드 + 갤러리)
 * 18.  프로필 + SNS 편집
 * 19.  검색
 * 20.  초기화
 */

/* ═══════════════════════════════════════════════════
   1. Firebase 초기화
════════════════════════════════════════════════════ */

import { initializeApp }    from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject }
  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCoGIQVNaIrRRBUM1wzy3A74UGp59jQOQU",
  authDomain:        "yuni-archive.firebaseapp.com",
  projectId:         "yuni-archive",
  storageBucket:     "yuni-archive.firebasestorage.app",
  messagingSenderId: "1082487282227",
  appId:             "1:1082487282227:web:a39e154e7f79a037586146"
};

const firebaseApp = initializeApp(firebaseConfig);
const db          = getFirestore(firebaseApp);
const storage     = getStorage(firebaseApp);

/* ═══════════════════════════════════════════════════
   2. 시드 데이터
════════════════════════════════════════════════════ */

const SEED_VIDEOS = [
  { id:'v1', title:'교토에서 보낸 3일 — 골목골목 여행기', date:'2025.05.18', category:'vlog', emoji:'🏯', gradient:'linear-gradient(135deg,#fde68a,#f59e0b)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'혼자 떠난 교토 여행. 새벽 5시 금각사부터 야시장까지.', tags:['여행','교토','일본','브이로그'] },
  { id:'v2', title:'나만의 독서 루틴 — 한 달에 책 5권 읽는 법', date:'2025.04.30', category:'study', emoji:'📖', gradient:'linear-gradient(135deg,#a78bfa,#7c3aed)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'바쁜 직장인도 실천할 수 있는 독서 습관.', tags:['독서','루틴','자기계발'] },
  { id:'v3', title:'성수동 카페 투어 — 숨겨진 공간들', date:'2025.04.12', category:'vlog', emoji:'☕', gradient:'linear-gradient(135deg,#6ee7b7,#059669)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'성수동 메인 스트리트를 벗어나 발견한 진짜 숨은 카페들.', tags:['카페','성수동','서울'] },
  { id:'v4', title:'「채식주의자」 북리뷰', date:'2025.03.28', category:'review', emoji:'🌿', gradient:'linear-gradient(135deg,#f9a8d4,#ec4899)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'노벨문학상 발표 이후 다시 읽은 채식주의자.', tags:['북리뷰','한강','소설'] },
  { id:'v5', title:'나의 애플 생태계 셋업 투어 2025', date:'2025.03.10', category:'review', emoji:'🖥️', gradient:'linear-gradient(135deg,#bfdbfe,#3b82f6)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'M3 MacBook Air, iPad Pro, AirPods Max 실사용 후기.', tags:['애플','테크','셋업'] },
  { id:'v6', title:'제주 한달살기 브이로그 Ep.1', date:'2025.02.14', category:'vlog', emoji:'🌊', gradient:'linear-gradient(135deg,#fed7aa,#ea580c)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'제주에서 한 달을 보낸 이야기.', tags:['제주','한달살기','브이로그'] },
];

const SEED_WRITINGS = [
  { id:'w1', title:'서울의 카페를 전부 가봤다 — 는 거짓말이고', date:'2025.05.24', category:'essay', tags:['에세이','카페','서울'], excerpt:'카페가 이렇게 많은 도시에 살고 있으면서 왜 나는 항상 같은 자리에 앉아 같은 아메리카노를 시킬까.', body:'<p>카페가 이렇게 많은 도시에 살고 있으면서 왜 나는 항상 같은 자리에 앉아 같은 아메리카노를 시킬까.</p><p>익숙한 카페로 돌아가는 건 사실 일종의 의식이다.</p>' },
  { id:'w2', title:'혼자 있는 능력에 대하여', date:'2025.05.10', category:'essay', tags:['에세이','고독','일상'], excerpt:'혼자 있는 것을 즐기는 사람과, 혼자 있을 수밖에 없는 사람은 겉으로는 같아 보인다.', body:'<p>혼자 있는 것과 고립은 종이 한 장 차이다. 그 경계를 의식적으로 인식하는 것이 어쩌면 진짜 능력일지도.</p>' },
  { id:'w3', title:'교토 여행에서 배운 것들', date:'2025.04.20', category:'review', tags:['후기','여행','교토'], excerpt:'5박 6일이라는 짧지 않은 시간 동안 교토에 있었다.', body:'<p>교토는 서두르면 손해보는 도시다. 이 여행에서 배운 것은 결국 느리게 보는 것의 가치였다.</p>' },
  { id:'w4', title:'올해의 책 5권을 고른다면', date:'2025.03.30', category:'review', tags:['후기','독서','추천'], excerpt:'삶에 대해 다르게 생각하게 만든 책 5권.', body:'<p>채식주의자, 아무것도 하지 않는 시간의 힘, 82년생 김지영, 데미안, 아몬드.</p>' },
  { id:'w5', title:'4월의 단상들', date:'2025.04.05', category:'daily', tags:['일상','일기','봄'], excerpt:'올해 봄은 왜인지 조금 달랐다.', body:'<p>4월 8일. 벚꽃이 폈다. 4월 30일. 이 달은 꽤 괜찮았다.</p>' },
  { id:'w6', title:'계획 없이 사는 것에 대한 변명', date:'2025.02.25', category:'essay', tags:['에세이','생각','삶'], excerpt:'5년 계획을 물어보는 사람들에게 나는 아직도 제대로 된 대답을 못한다.', body:'<p>계획 없이 산다는 것은 목표가 없다는 게 아니다. 지금 이 순간이 좋은 방향으로 흐르고 있다는 감각을 신뢰하는 것.</p>' },
];

const SEED_BOOKS = [
  { id:'b1',  title:'채식주의자',                  author:'한강',        date:'2025.05.20', stars:5, color:'#2d6a4f', width:24, quote:'인간이라는 사실이, 이렇게 수치스러울 수 없었다.',              memo:'두 번째로 읽었다. 예술이라는 이름으로 포장된 욕망에 대해 생각하게 된다.' },
  { id:'b2',  title:'82년생 김지영',                author:'조남주',      date:'2025.05.05', stars:4, color:'#e07a5f', width:20, quote:'그래도 나는 내 딸이 자유롭게 꿈꾸고 선택하는 사람으로 자라길 바랐다.', memo:'픽션인데 픽션이 아닌 이야기.' },
  { id:'b3',  title:'아몬드',                       author:'손원평',      date:'2025.04.28', stars:5, color:'#c77dff', width:22, quote:'괴물이 되는 건 쉽다. 사람이 되는 건 어렵다.',                 memo:'감정이 무엇인지 생각하게 만드는 책.' },
  { id:'b4',  title:'데미안',                       author:'헤르만 헤세', date:'2025.04.15', stars:4, color:'#457b9d', width:18, quote:'새는 알을 깨고 나온다. 알은 새의 세계다.',                    memo:'스무 살과 서른이 넘어서 읽는 것이 이렇게 다를 수 있다.' },
  { id:'b5',  title:'아무것도 하지 않는 시간의 힘', author:'울리히 슈나벨', date:'2025.04.02', stars:4, color:'#2a9d8f', width:26, quote:'진정한 휴식은 자신에게 온전히 집중하는 것이다.',            memo:'멈추는 것도 능력이라는 걸 믿게 됐다.' },
  { id:'b6',  title:'우리가 빛의 속도로 갈 수 없다면', author:'김초엽',  date:'2025.03.25', stars:5, color:'#6a4c93', width:21, quote:'그 모든 것들이 사라진 후에도 우리는 남겨진 곳에서 살아간다.', memo:'SF인데 가장 인간적인 단편집.' },
  { id:'b7',  title:'군주론',                       author:'마키아벨리',  date:'2025.03.12', stars:3, color:'#8d6a4b', width:19, quote:'끝이 수단을 정당화한다.',                                   memo:'불편하지만 무시할 수 없는 통찰.' },
  { id:'b8',  title:'파친코',                       author:'이민진',      date:'2025.02.28', stars:5, color:'#e63946', width:28, quote:'역사는 우리를 저버렸다. 하지만 그래도 상관없다.',             memo:'4대에 걸친 가족 이야기. 한국인이라 더 아팠다.' },
  { id:'b9',  title:'아직도 가야 할 길',            author:'M. 스캇 펙',  date:'2025.02.10', stars:4, color:'#3a5a40', width:20, quote:'삶은 고통이다. 이것을 이해하면 우리는 초월할 수 있다.',       memo:'사랑과 의지에 대한 정의가 인상적이었다.' },
  { id:'b10', title:'트렌드 코리아 2025',           author:'김난도 외',   date:'2025.01.30', stars:3, color:'#f4a261', width:25, quote:'트렌드는 예측이 아니라 읽는 것이다.',                        memo:'옴니보어 소비자 키워드가 가장 와닿았다.' },
  { id:'b11', title:'작별하지 않는다',              author:'한강',        date:'2025.01.18', stars:5, color:'#264653', width:23, quote:'우리는 어떻게 애도해야 하는가.',                            memo:'읽는 내내 숨을 참고 있는 기분이었다.' },
  { id:'b12', title:'이것이 모두 이상하다',         author:'이슬아',      date:'2025.01.05', stars:4, color:'#d62828', width:17, quote:'이상한 것들을 이상하다고 말할 수 있는 용기.',               memo:'문장이 쨍하고 솔직해서 좋다.' },
];

const SEED_MONTHLY = [
  { id:'m1', month:'1월', count:4 }, { id:'m2', month:'2월', count:3 },
  { id:'m3', month:'3월', count:5 }, { id:'m4', month:'4월', count:6 },
  { id:'m5', month:'5월', count:6 },
];

const DEFAULT_PROFILE = { name:'김아라', nameEn:'Ara Kim', bio:'글 쓰고 책 읽고 영상 만드는 사람 ✦ 기록으로 존재를 증명하는 중', statusEmoji:'📖', statusMsg:'요즘은 「채식주의자」 를 다시 읽고 있어요', statusBadge:'독서 중' };
const DEFAULT_SNS     = { instagram:'https://instagram.com', youtube:'https://youtube.com', brunch:'https://brunch.co.kr', github:'https://github.com' };

const BGM_TRACKS = [
  { title:'Clair de Lune',           artist:'Claude Debussy',  duration:'5:24' },
  { title:'Gymnopédie No.1',         artist:'Erik Satie',       duration:'3:12' },
  { title:'Experience',              artist:'Ludovico Einaudi', duration:'5:14' },
  { title:'River Flows in You',      artist:'Yiruma',           duration:'3:48' },
  { title:"Comptine d'un autre été", artist:'Yann Tiersen',     duration:'2:58' },
];

/* ═══════════════════════════════════════════════════
   3. 유틸리티
════════════════════════════════════════════════════ */

function renderStars(n) { return '★'.repeat(n)+'☆'.repeat(5-n); }
function renderTags(tags,cls) { return tags.map(t=>`<span class="${cls}">${t}</span>`).join(''); }
function show(el) { el.classList.add('open'); }
function hide(el) { el.classList.remove('open'); }
function uid()   { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function toast(msg, type='success') {
  const t=document.createElement('div');
  t.className=`toast toast-${type}`; t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },2400);
}

function showLoading(msg='불러오는 중...') {
  let el=document.getElementById('loadingOverlay');
  if(!el){ el=document.createElement('div'); el.id='loadingOverlay'; el.innerHTML=`<div class="loading-inner"><div class="loading-spinner"></div><p>${msg}</p></div>`; document.body.appendChild(el); }
  el.classList.add('open');
}
function hideLoading() { document.getElementById('loadingOverlay')?.classList.remove('open'); }

/* ═══════════════════════════════════════════════════
   4. Firestore CRUD 헬퍼
════════════════════════════════════════════════════ */

async function dbGetAll(col) {
  const snap=await getDocs(collection(db,col));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
async function dbSet(col,id,data) {
  const {id:_,...rest}=data;
  await setDoc(doc(db,col,id),rest);
}
async function dbDelete(col,id) { await deleteDoc(doc(db,col,id)); }
async function seedIfEmpty(col,seed) {
  const snap=await getDocs(collection(db,col));
  if(!snap.empty) return;
  const batch=writeBatch(db);
  seed.forEach(item=>{ const{id,...rest}=item; batch.set(doc(db,col,id),rest); });
  await batch.commit();
}

/* ═══════════════════════════════════════════════════
   5. Storage 업로드 헬퍼
════════════════════════════════════════════════════ */

/**
 * 파일을 Firebase Storage에 업로드하고 다운로드 URL 반환
 * @param {File}   file      - 업로드할 파일
 * @param {string} folder    - 저장 폴더 ('photos' | 'gallery' | 'profile')
 * @param {Function} onProgress - 진행률 콜백 (0~100)
 */
function uploadFile(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const filename  = `${folder}/${uid()}_${file.name}`;
    const storageRef = ref(storage, filename);
    const task      = uploadBytesResumable(storageRef, file);

    task.on('state_changed',
      snap => { onProgress && onProgress(Math.round(snap.bytesTransferred/snap.totalBytes*100)); },
      reject,
      async () => { resolve({ url: await getDownloadURL(task.snapshot.ref), path: filename }); }
    );
  });
}

/* ── 업로드 진행률 모달 ── */
function showUploadProgress(filename) {
  document.getElementById('uploadProgressModal')?.remove();
  const el = document.createElement('div');
  el.id = 'uploadProgressModal';
  el.className = 'upload-progress-modal';
  el.innerHTML = `
    <div class="upload-progress-inner">
      <p class="upload-filename">📤 ${filename}</p>
      <div class="upload-bar-wrap"><div class="upload-bar" id="uploadBar"></div></div>
      <p class="upload-pct" id="uploadPct">0%</p>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('open'));
}

function updateUploadProgress(pct) {
  const bar = document.getElementById('uploadBar');
  const txt = document.getElementById('uploadPct');
  if(bar) bar.style.width = pct+'%';
  if(txt) txt.textContent = pct+'%';
}

function hideUploadProgress() {
  const el = document.getElementById('uploadProgressModal');
  if(el){ el.classList.remove('open'); setTimeout(()=>el.remove(),300); }
}

/* ── 파일 선택 input 생성 헬퍼 ── */
function pickImageFile(callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', ()=>{ if(input.files[0]) callback(input.files[0]); input.remove(); });
  input.click();
}

/* ═══════════════════════════════════════════════════
   6. 관리자 인증 + 편집 모드
════════════════════════════════════════════════════ */

// ★ 비밀번호를 여기서 변경하세요
const ADMIN_PASSWORD = '1234';

let isAdminMode = false;

const lockBtn = document.createElement('button');
lockBtn.className = 'icon-btn admin-lock-btn';
lockBtn.setAttribute('aria-label','관리자 모드');
lockBtn.innerHTML = `
  <svg class="lock-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  <svg class="lock-open"   width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
document.querySelector('.nav-actions').prepend(lockBtn);

function setAdminMode(on) {
  isAdminMode = on;
  document.body.classList.toggle('admin-mode', on);
  lockBtn.querySelector('.lock-closed').style.display = on?'none':'block';
  lockBtn.querySelector('.lock-open'  ).style.display = on?'block':'none';
  lockBtn.style.color = on ? 'var(--accent)' : '';
  adminToolbar.classList.toggle('open', on);
  toast(on ? '✏️ 편집 모드 활성화' : '🔒 편집 모드 종료');
}

lockBtn.addEventListener('click', ()=>{
  if(isAdminMode){ setAdminMode(false); return; }
  const pw=prompt('🔐 관리자 비밀번호를 입력하세요');
  if(pw===null) return;
  pw===ADMIN_PASSWORD ? setAdminMode(true) : toast('❌ 비밀번호가 틀렸습니다','error');
});

/* ── 관리자 툴바 ── */
const adminToolbar = document.createElement('div');
adminToolbar.className = 'admin-toolbar';
adminToolbar.innerHTML = `
  <span class="admin-toolbar-label">✏️ 편집 모드</span>
  <div class="admin-toolbar-btns">
    <button class="adm-btn adm-btn-profile" id="admEditProfile">👤 프로필 수정</button>
    <button class="adm-btn adm-btn-profile" id="admEditSns">🔗 SNS 수정</button>
    <button class="adm-btn" id="admAddVideo">＋ 영상</button>
    <button class="adm-btn" id="admAddWriting">＋ 글</button>
    <button class="adm-btn" id="admAddBook">＋ 책</button>
    <button class="adm-btn" id="admAddPhoto">＋ 사진</button>
    <button class="adm-btn" id="admAddGallery">＋ 갤러리 사진</button>
  </div>`;
document.body.appendChild(adminToolbar);

/* ── 편집 모달 공통 ── */
function openEditModal(title, fields, onSave) {
  document.getElementById('editModal')?.remove();
  const modal=document.createElement('div');
  modal.id='editModal'; modal.className='modal-overlay open';
  const fieldsHtml=fields.map(f=>{
    let input='';
    if(f.type==='textarea') input=`<textarea class="edit-input edit-textarea" data-key="${f.key}" rows="4">${f.value??''}</textarea>`;
    else if(f.type==='select') input=`<select class="edit-input" data-key="${f.key}">${f.options.map(o=>`<option value="${o}"${o===f.value?' selected':''}>${o}</option>`).join('')}</select>`;
    else if(f.type==='number') input=`<input type="number" class="edit-input" data-key="${f.key}" value="${f.value??''}" min="${f.min??0}" max="${f.max??999}">`;
    else input=`<input type="text" class="edit-input" data-key="${f.key}" value="${f.value??''}" placeholder="${f.placeholder??''}">`;
    return `<div class="edit-field"><label class="edit-label">${f.label}</label>${input}</div>`;
  }).join('');
  modal.innerHTML=`
    <div class="modal edit-modal">
      <button class="modal-close" id="editModalClose">✕</button>
      <h3 class="edit-modal-title">${title}</h3>
      <div class="edit-fields">${fieldsHtml}</div>
      <div class="edit-modal-footer">
        <button class="edit-cancel-btn" id="editCancel">취소</button>
        <button class="edit-save-btn" id="editConfirm">저장</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow='hidden';
  const closeEdit=()=>{ modal.remove(); document.body.style.overflow=''; };
  modal.querySelector('#editModalClose').addEventListener('click',closeEdit);
  modal.querySelector('#editCancel').addEventListener('click',closeEdit);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeEdit(); });
  modal.querySelector('#editConfirm').addEventListener('click',()=>{
    const result={};
    modal.querySelectorAll('[data-key]').forEach(el=>{ result[el.dataset.key]=el.value; });
    onSave(result); closeEdit();
  });
}

/* ── 영상 편집/삭제 ── */
async function deleteVideo(id) {
  if(!confirm('이 영상을 삭제할까요?')) return;
  await dbDelete('videos',id); VIDEO_DATA=VIDEO_DATA.filter(v=>v.id!==id);
  toast('🗑️ 삭제 완료'); renderVideos();
}
function editVideo(v) {
  openEditModal('📹 영상 수정',[
    {label:'제목',key:'title',type:'text',value:v.title},
    {label:'날짜',key:'date',type:'text',value:v.date,placeholder:'YYYY.MM.DD'},
    {label:'YouTube URL',key:'youtubeUrl',type:'text',value:v.youtubeUrl,placeholder:'https://youtu.be/...'},
    {label:'카테고리',key:'category',type:'select',value:v.category,options:['vlog','study','review']},
    {label:'이모지',key:'emoji',type:'text',value:v.emoji},
    {label:'설명',key:'desc',type:'textarea',value:v.desc},
    {label:'태그 (쉼표 구분)',key:'tags',type:'text',value:v.tags.join(', ')},
  ], async r=>{
    Object.assign(v,{title:r.title,date:r.date,youtubeUrl:r.youtubeUrl,category:r.category,emoji:r.emoji,desc:r.desc,tags:r.tags.split(',').map(t=>t.trim()).filter(Boolean)});
    await dbSet('videos',v.id,v); toast('💾 저장 완료'); renderVideos();
  });
}
document.getElementById('admAddVideo').addEventListener('click',()=>{
  const nv={id:'v'+uid(),title:'새 영상',date:'',category:'vlog',emoji:'🎬',gradient:'linear-gradient(135deg,#a0aec0,#718096)',youtubeUrl:'',desc:'',tags:[]};
  VIDEO_DATA.unshift(nv); editVideo(nv);
});

/* ── 글 편집/삭제 ── */
async function deleteWriting(id) {
  if(!confirm('이 글을 삭제할까요?')) return;
  await dbDelete('writings',id); WRITING_DATA=WRITING_DATA.filter(w=>w.id!==id);
  toast('🗑️ 삭제 완료'); renderWritings();
}
function editWriting(w) {
  openEditModal('✍️ 글 수정',[
    {label:'제목',key:'title',type:'text',value:w.title},
    {label:'날짜',key:'date',type:'text',value:w.date,placeholder:'YYYY.MM.DD'},
    {label:'카테고리',key:'category',type:'select',value:w.category,options:['essay','review','daily']},
    {label:'태그 (쉼표 구분)',key:'tags',type:'text',value:w.tags.join(', ')},
    {label:'요약',key:'excerpt',type:'textarea',value:w.excerpt},
    {label:'본문 (HTML 가능)',key:'body',type:'textarea',value:w.body},
  ], async r=>{
    Object.assign(w,{title:r.title,date:r.date,category:r.category,tags:r.tags.split(',').map(t=>t.trim()).filter(Boolean),excerpt:r.excerpt,body:r.body});
    await dbSet('writings',w.id,w); toast('💾 저장 완료'); renderWritings();
  });
}
document.getElementById('admAddWriting').addEventListener('click',()=>{
  const nw={id:'w'+uid(),title:'새 글',date:'',category:'essay',tags:[],excerpt:'',body:'<p>내용을 입력하세요.</p>'};
  WRITING_DATA.unshift(nw); editWriting(nw);
});

/* ── 책 편집/삭제 ── */
async function deleteBook(id) {
  if(!confirm('이 책을 삭제할까요?')) return;
  await dbDelete('books',id); BOOK_DATA=BOOK_DATA.filter(b=>b.id!==id);
  toast('🗑️ 삭제 완료'); renderBookshelf();
}
function editBook(b) {
  openEditModal('📚 책 수정',[
    {label:'제목',key:'title',type:'text',value:b.title},
    {label:'저자',key:'author',type:'text',value:b.author},
    {label:'완독일',key:'date',type:'text',value:b.date,placeholder:'YYYY.MM.DD'},
    {label:'별점 (1~5)',key:'stars',type:'number',value:b.stars,min:1,max:5},
    {label:'책등 색상 (HEX)',key:'color',type:'text',value:b.color,placeholder:'#2d6a4f'},
    {label:'한줄평',key:'quote',type:'textarea',value:b.quote},
    {label:'독서 메모',key:'memo',type:'textarea',value:b.memo},
  ], async r=>{
    Object.assign(b,{title:r.title,author:r.author,date:r.date,stars:Math.min(5,Math.max(1,parseInt(r.stars)||1)),color:r.color||'#888',quote:r.quote,memo:r.memo});
    await dbSet('books',b.id,b); toast('💾 저장 완료'); renderBookshelf();
  });
}
document.getElementById('admAddBook').addEventListener('click',()=>{
  const colors=['#e07a5f','#3d405b','#81b29a','#f2cc8f','#457b9d','#6a4c93'];
  const nb={id:'b'+uid(),title:'새 책',author:'',date:'',stars:4,color:colors[Math.floor(Math.random()*colors.length)],width:20,quote:'',memo:''};
  BOOK_DATA.push(nb); editBook(nb);
});

/* ═══════════════════════════════════════════════════
   7. 테마
════════════════════════════════════════════════════ */

const themeToggle=document.getElementById('themeToggle');
const html=document.documentElement;
let currentTheme=localStorage.getItem('archive_theme')||'light';
html.setAttribute('data-theme',currentTheme);
themeToggle.addEventListener('click',()=>{
  currentTheme=currentTheme==='light'?'dark':'light';
  html.setAttribute('data-theme',currentTheme);
  localStorage.setItem('archive_theme',currentTheme);
});

/* ═══════════════════════════════════════════════════
   8. 스크롤 진행도 + 리빌
════════════════════════════════════════════════════ */

const scrollProgress=document.getElementById('scrollProgress');
function updateScrollProgress(){
  const pct=window.scrollY/(document.documentElement.scrollHeight-window.innerHeight)*100;
  scrollProgress.style.width=(pct||0)+'%';
}
const revealObserver=new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{ if(e.isIntersecting){ setTimeout(()=>e.target.classList.add('revealed'),i*80); revealObserver.unobserve(e.target); } });
},{threshold:0.1});
document.querySelectorAll('[data-reveal]').forEach(el=>revealObserver.observe(el));
window.addEventListener('scroll',updateScrollProgress,{passive:true});

/* ═══════════════════════════════════════════════════
   9. 네비게이션
════════════════════════════════════════════════════ */

const topNav=document.getElementById('topNav');
window.addEventListener('scroll',()=>{ topNav.style.boxShadow=window.scrollY>10?'var(--shadow-md)':'none'; },{passive:true});

/* ═══════════════════════════════════════════════════
   10. BGM 플레이어
════════════════════════════════════════════════════ */

const playBtn=document.getElementById('playBtn'), prevBtn=document.getElementById('prevBtn'), nextBtn=document.getElementById('nextBtn');
const playerDisc=document.getElementById('playerDisc'), playerTitle=document.getElementById('playerTitle'), playerArtist=document.getElementById('playerArtist');
const progressFill=document.getElementById('progressFill'), currentTimeEl=document.getElementById('currentTime'), totalTimeEl=document.getElementById('totalTime');
let isPlaying=false,trackIdx=0,progress=0,progressTimer=null;
function loadTrack(i){ const t=BGM_TRACKS[i]; playerTitle.textContent=t.title; playerArtist.textContent=t.artist; totalTimeEl.textContent=t.duration; progress=0; progressFill.style.width='0%'; currentTimeEl.textContent='0:00'; }
function startProgress(){ clearInterval(progressTimer); const[m,s]=BGM_TRACKS[trackIdx].duration.split(':').map(Number),total=m*60+s; progressTimer=setInterval(()=>{ progress+=(1/total)*100; if(progress>=100){progress=0;nextTrack();return;} progressFill.style.width=progress+'%'; const e=Math.floor((progress/100)*total); currentTimeEl.textContent=`${Math.floor(e/60)}:${(e%60).toString().padStart(2,'0')}`; },1000); }
function stopProgress(){ clearInterval(progressTimer); }
function nextTrack(){ trackIdx=(trackIdx+1)%BGM_TRACKS.length; loadTrack(trackIdx); if(isPlaying)startProgress(); }
function prevTrack(){ trackIdx=(trackIdx-1+BGM_TRACKS.length)%BGM_TRACKS.length; loadTrack(trackIdx); if(isPlaying)startProgress(); }
playBtn.addEventListener('click',()=>{ isPlaying=!isPlaying; playBtn.querySelector('.play-icon').style.display=isPlaying?'none':'block'; playBtn.querySelector('.pause-icon').style.display=isPlaying?'block':'none'; playerDisc.classList.toggle('spinning',isPlaying); isPlaying?startProgress():stopProgress(); });
nextBtn.addEventListener('click',nextTrack); prevBtn.addEventListener('click',prevTrack); loadTrack(0);

/* ═══════════════════════════════════════════════════
   11. 최근 업데이트 ticker
════════════════════════════════════════════════════ */

const ticker=document.getElementById('recentTicker');
ticker.innerHTML+=ticker.innerHTML;

/* ═══════════════════════════════════════════════════
   12. 폴더 열기/닫기
════════════════════════════════════════════════════ */

const folderPanels={ video:document.getElementById('panelVideo'), writing:document.getElementById('panelWriting'), photos:document.getElementById('panelPhotos') };
function togglePanel(type){ const panel=folderPanels[type]; if(!panel)return; const isOpen=panel.classList.contains('open'); Object.values(folderPanels).forEach(p=>hide(p)); if(!isOpen){show(panel);panel.scrollIntoView({behavior:'smooth',block:'start'});} }
document.getElementById('folderVideo').addEventListener('click',()=>togglePanel('video'));
document.getElementById('folderWrite').addEventListener('click',()=>togglePanel('writing'));
document.getElementById('folderPhotos').addEventListener('click',()=>togglePanel('photos'));
document.getElementById('folderBooks').addEventListener('click',()=>{ document.getElementById('bookshelf').scrollIntoView({behavior:'smooth',block:'start'}); });
document.querySelectorAll('.panel-close').forEach(btn=>{ btn.addEventListener('click',()=>{ const type=btn.dataset.close; if(folderPanels[type])hide(folderPanels[type]); }); });

/* ═══════════════════════════════════════════════════
   13. 영상 렌더링
════════════════════════════════════════════════════ */

const videoGrid=document.getElementById('videoGrid');
function createVideoCard(v){ return `<div class="video-card" data-id="${v.id}" data-category="${v.category}"><div class="admin-item-btns"><button class="admin-edit-btn" data-vid="${v.id}">✏️</button><button class="admin-del-btn" data-vid="${v.id}">🗑️</button></div><a href="${v.youtubeUrl||'#'}" target="_blank" rel="noopener" class="video-card-link"><div class="video-thumb"><div class="video-thumb-bg" style="background:${v.gradient}"><span style="font-size:3rem">${v.emoji}</span></div><div class="video-play-overlay"><div class="play-circle">▶</div></div><div class="yt-badge">▶ YouTube</div></div><div class="video-info"><p class="video-title">${v.title}</p><div class="video-meta"><span class="video-date">${v.date}</span><span class="video-tag">${v.category}</span></div></div></a></div>`; }
function renderVideos(filter='all'){ const filtered=filter==='all'?VIDEO_DATA:VIDEO_DATA.filter(v=>v.category===filter); videoGrid.innerHTML=filtered.map(createVideoCard).join(''); videoGrid.querySelectorAll('.admin-edit-btn').forEach(btn=>{ btn.addEventListener('click',e=>{ e.stopPropagation();e.preventDefault(); const v=VIDEO_DATA.find(x=>x.id===btn.dataset.vid); if(v)editVideo(v); }); }); videoGrid.querySelectorAll('.admin-del-btn').forEach(btn=>{ btn.addEventListener('click',e=>{ e.stopPropagation();e.preventDefault(); deleteVideo(btn.dataset.vid); }); }); }
document.querySelectorAll('#panelVideo .filter-btn').forEach(btn=>{ btn.addEventListener('click',()=>{ document.querySelectorAll('#panelVideo .filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderVideos(btn.dataset.filter); }); });

/* ═══════════════════════════════════════════════════
   14. 글쓰기 렌더링 + 모달
════════════════════════════════════════════════════ */

const writingList=document.getElementById('writingList'), writingModal=document.getElementById('writingModal');
function createWritingItem(w){ return `<div class="writing-item" data-id="${w.id}" data-category="${w.category}"><div class="admin-item-btns"><button class="admin-edit-btn" data-wid="${w.id}">✏️</button><button class="admin-del-btn" data-wid="${w.id}">🗑️</button></div><span class="writing-item-date">${w.date}</span><div class="writing-item-content"><p class="writing-item-title">${w.title}</p><p class="writing-item-excerpt">${w.excerpt}</p><div class="writing-tags">${renderTags(w.tags,'writing-tag')}</div></div></div>`; }
function renderWritings(filter='all'){ const filtered=filter==='all'?WRITING_DATA:WRITING_DATA.filter(w=>w.category===filter); writingList.innerHTML=filtered.map(createWritingItem).join(''); writingList.querySelectorAll('.writing-item').forEach(item=>{ item.addEventListener('click',e=>{ if(e.target.closest('.admin-item-btns'))return; openWritingModal(item.dataset.id); }); }); writingList.querySelectorAll('.admin-edit-btn').forEach(btn=>{ btn.addEventListener('click',e=>{ e.stopPropagation(); const w=WRITING_DATA.find(x=>x.id===btn.dataset.wid); if(w)editWriting(w); }); }); writingList.querySelectorAll('.admin-del-btn').forEach(btn=>{ btn.addEventListener('click',e=>{ e.stopPropagation(); deleteWriting(btn.dataset.wid); }); }); }
function openWritingModal(id){ const w=WRITING_DATA.find(x=>x.id===id); if(!w)return; document.getElementById('writingModalTitle').textContent=w.title; document.getElementById('writingModalDate').textContent=w.date; document.getElementById('writingModalBody').innerHTML=w.body; document.getElementById('writingModalTags').innerHTML=renderTags(w.tags,'writing-tag'); show(writingModal); document.body.style.overflow='hidden'; }
document.getElementById('writingModalClose').addEventListener('click',()=>{ hide(writingModal); document.body.style.overflow=''; });
writingModal.addEventListener('click',e=>{ if(e.target===writingModal){hide(writingModal);document.body.style.overflow='';} });
document.querySelectorAll('#panelWriting .filter-btn').forEach(btn=>{ btn.addEventListener('click',()=>{ document.querySelectorAll('#panelWriting .filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderWritings(btn.dataset.filter); }); });

/* ═══════════════════════════════════════════════════
   15. 독서 기록 — 책장 + 모달
════════════════════════════════════════════════════ */

const bookshelfEl=document.getElementById('bookshelf-display'), bookModal=document.getElementById('bookModal');
function createBookSpine(b){ return `<div class="book-spine" data-id="${b.id}" style="background:${b.color};width:${b.width}px;"><span class="book-spine-title">${b.title}</span></div>`; }
function renderBookshelf(){ let html=''; for(let i=0;i<BOOK_DATA.length;i+=8){ html+=`<div class="shelf-row">${BOOK_DATA.slice(i,i+8).map(createBookSpine).join('')}</div>`; } bookshelfEl.innerHTML=html; bookshelfEl.querySelectorAll('.book-spine').forEach(spine=>{ spine.addEventListener('click',()=>{ if(isAdminMode) showBookAdminMenu(BOOK_DATA.find(x=>x.id===spine.dataset.id),spine); else openBookModal(spine.dataset.id); }); }); }
function showBookAdminMenu(b,anchor){ document.querySelector('.book-admin-menu')?.remove(); const menu=document.createElement('div'); menu.className='book-admin-menu'; menu.innerHTML=`<button data-action="edit">✏️ 수정</button><button data-action="del">🗑️ 삭제</button><button data-action="cancel">취소</button>`; const rect=anchor.getBoundingClientRect(); menu.style.cssText=`position:fixed;top:${rect.bottom+8}px;left:${rect.left}px;z-index:2000;`; document.body.appendChild(menu); menu.addEventListener('click',e=>{ const action=e.target.dataset.action; menu.remove(); if(action==='edit')editBook(b); if(action==='del')deleteBook(b.id); }); setTimeout(()=>{ document.addEventListener('click',()=>menu.remove(),{once:true}); },0); }
function openBookModal(id){ const b=BOOK_DATA.find(x=>x.id===id); if(!b)return; const coverEl=document.getElementById('bookModalCover'); coverEl.style.background=`linear-gradient(135deg,${b.color},color-mix(in srgb,${b.color} 70%,#000))`; coverEl.innerHTML=`<div style="text-align:center;color:rgba(255,255,255,.9);padding:20px;"><div style="font-size:2.5rem;margin-bottom:12px;">📖</div><p style="font-size:.8rem;line-height:1.4;font-family:'Noto Serif KR',serif;">${b.title}</p><p style="font-size:.65rem;opacity:.7;margin-top:6px;">${b.author}</p></div>`; document.getElementById('bookModalTitle').textContent=b.title; document.getElementById('bookModalAuthor').textContent=b.author; document.getElementById('bookModalStars').textContent=renderStars(b.stars); document.getElementById('bookModalDate').textContent='📅 '+b.date+' 완독'; document.getElementById('bookModalQuote').textContent=`"${b.quote}"`; document.getElementById('bookModalMemo').textContent=b.memo; show(bookModal); document.body.style.overflow='hidden'; }
document.getElementById('bookModalClose').addEventListener('click',()=>{ hide(bookModal); document.body.style.overflow=''; });
bookModal.addEventListener('click',e=>{ if(e.target===bookModal){hide(bookModal);document.body.style.overflow='';} });

/* ═══════════════════════════════════════════════════
   16. 독서 통계 바 차트
════════════════════════════════════════════════════ */

function renderBarChart(){ const el=document.getElementById('barChart'); const max=Math.max(...MONTHLY_DATA.map(d=>d.count)); el.innerHTML=MONTHLY_DATA.map(d=>`<div class="bar-col"><div class="bar-fill" style="height:${(d.count/max)*100}%" title="${d.month}: ${d.count}권"></div><span class="bar-label">${d.month}</span></div>`).join(''); }

/* ═══════════════════════════════════════════════════
   17. 📷 사진 기능
   - Firebase Storage에 직접 업로드 (사진첩에서 선택)
   - 사진 아카이브 폴더
   - 프로필 갤러리 팝업
   - 라이트박스
════════════════════════════════════════════════════ */

let PHOTO_DATA=[], GALLERY_DATA=[], lightboxData=[], lightboxIndex=0;

async function loadPhotos(){
  try{
    const[ps,gs]=await Promise.all([dbGetAll('photos'),dbGetAll('gallery')]);
    PHOTO_DATA=ps; GALLERY_DATA=gs;
    renderPhotoGrid(); renderProfileGallery(); updatePhotoCount();
  }catch(e){ console.error('사진 로드 실패',e); }
}

function updatePhotoCount(){ const el=document.getElementById('photoFolderCount'); if(el)el.textContent=`사진 ${PHOTO_DATA.length}장`; }

/* ── 사진 폴더 그리드 ── */
function renderPhotoGrid(){
  const grid=document.getElementById('photoGrid'); if(!grid)return;
  if(PHOTO_DATA.length===0){ grid.innerHTML=`<div class="photo-empty"><p>아직 사진이 없어요 📷</p><p style="font-size:.78rem;color:var(--text-faint);margin-top:6px;">편집 모드에서 ＋ 사진 추가를 눌러주세요</p></div>`; return; }
  grid.innerHTML=PHOTO_DATA.map((p,i)=>`<div class="photo-item" data-index="${i}"><div class="admin-item-btns"><button class="admin-del-btn" data-pid="${p.id}">🗑️</button></div><img src="${p.url}" alt="${p.caption||''}" loading="lazy">${p.caption?`<p class="photo-caption">${p.caption}</p>`:''}</div>`).join('');
  grid.querySelectorAll('.photo-item').forEach(item=>{ item.addEventListener('click',e=>{ if(e.target.closest('.admin-item-btns'))return; openLightbox(PHOTO_DATA,parseInt(item.dataset.index)); }); });
  grid.querySelectorAll('.admin-del-btn').forEach(btn=>{ btn.addEventListener('click',async e=>{ e.stopPropagation(); if(!confirm('삭제할까요?'))return; await dbDelete('photos',btn.dataset.pid); PHOTO_DATA=PHOTO_DATA.filter(p=>p.id!==btn.dataset.pid); renderPhotoGrid(); updatePhotoCount(); toast('🗑️ 삭제 완료'); }); });
}

/* ── 프로필 갤러리 ── */
function renderProfileGallery(){
  const grid=document.getElementById('profileGalleryGrid'); if(!grid)return;
  if(GALLERY_DATA.length===0){ grid.innerHTML=`<div class="photo-empty"><p>갤러리 사진이 없어요</p><p style="font-size:.78rem;color:var(--text-faint);margin-top:6px;">편집 모드에서 ＋ 갤러리 사진을 눌러주세요</p></div>`; return; }
  grid.innerHTML=GALLERY_DATA.map((p,i)=>`<div class="photo-item" data-index="${i}"><div class="admin-item-btns"><button class="admin-del-btn" data-gid="${p.id}">🗑️</button></div><img src="${p.url}" alt="${p.caption||''}" loading="lazy"></div>`).join('');
  grid.querySelectorAll('.photo-item').forEach(item=>{ item.addEventListener('click',e=>{ if(e.target.closest('.admin-item-btns'))return; openLightbox(GALLERY_DATA,parseInt(item.dataset.index)); }); });
  grid.querySelectorAll('.admin-del-btn').forEach(btn=>{ btn.addEventListener('click',async e=>{ e.stopPropagation(); if(!confirm('삭제할까요?'))return; await dbDelete('gallery',btn.dataset.gid); GALLERY_DATA=GALLERY_DATA.filter(p=>p.id!==btn.dataset.gid); renderProfileGallery(); toast('🗑️ 삭제 완료'); }); });
}

/* ── 라이트박스 ── */
function openLightbox(data,index){
  lightboxData=data; lightboxIndex=index;
  updateLightboxImg();
  show(document.getElementById('lightboxModal'));
  document.body.style.overflow='hidden';
}
function updateLightboxImg(){ const p=lightboxData[lightboxIndex]; document.getElementById('lightboxImg').src=p.url; document.getElementById('lightboxCaption').textContent=p.caption||''; }
function closeLightbox(){ hide(document.getElementById('lightboxModal')); document.body.style.overflow=''; }
document.getElementById('lightboxClose').addEventListener('click',closeLightbox);
document.getElementById('lightboxModal').addEventListener('click',e=>{ if(e.target===document.getElementById('lightboxModal'))closeLightbox(); });
document.getElementById('lightboxPrev').addEventListener('click',()=>{ lightboxIndex=(lightboxIndex-1+lightboxData.length)%lightboxData.length; updateLightboxImg(); });
document.getElementById('lightboxNext').addEventListener('click',()=>{ lightboxIndex=(lightboxIndex+1)%lightboxData.length; updateLightboxImg(); });

/* ── 아바타 클릭 → 갤러리 팝업 ── */
const avatarBtn=document.getElementById('avatarBtn');
const profileGalleryModal=document.getElementById('profileGalleryModal');
avatarBtn.addEventListener('click',()=>{ renderProfileGallery(); show(profileGalleryModal); document.body.style.overflow='hidden'; });
document.getElementById('profileGalleryClose').addEventListener('click',()=>{ hide(profileGalleryModal); document.body.style.overflow=''; });
profileGalleryModal.addEventListener('click',e=>{ if(e.target===profileGalleryModal){hide(profileGalleryModal);document.body.style.overflow='';} });

/* ── 사진 추가 (Storage 직접 업로드) ── */
async function uploadPhoto(file, caption, collection_name) {
  showUploadProgress(file.name);
  try {
    const { url, path } = await uploadFile(file, collection_name, pct => updateUploadProgress(pct));
    hideUploadProgress();
    const newP = { id:(collection_name==='photos'?'p':'g')+uid(), url, path, caption: caption||'', date: new Date().toLocaleDateString('ko-KR').replace(/\. /g,'.').replace('.','') };
    await dbSet(collection_name, newP.id, newP);
    if(collection_name==='photos'){ PHOTO_DATA.unshift(newP); renderPhotoGrid(); updatePhotoCount(); }
    else { GALLERY_DATA.unshift(newP); renderProfileGallery(); }
    toast('📷 사진 업로드 완료!');
  } catch(e) {
    hideUploadProgress();
    toast('❌ 업로드 실패: '+e.message, 'error');
    console.error(e);
  }
}

/* ── ＋ 사진 추가 버튼 (사진 폴더) ── */
document.getElementById('admAddPhoto').addEventListener('click', () => {
  // 캡션 입력 후 파일 선택
  openEditModal('📷 사진 추가', [
    { label: '캡션 (선택)', key: 'caption', type: 'text', placeholder: '사진 설명을 입력하세요' },
  ], (r) => {
    pickImageFile(file => uploadPhoto(file, r.caption, 'photos'));
  });
});

/* ── ＋ 갤러리 사진 버튼 (프로필 갤러리) ── */
document.getElementById('admAddGallery').addEventListener('click', () => {
  openEditModal('🖼️ 갤러리 사진 추가', [
    { label: '캡션 (선택)', key: 'caption', type: 'text', placeholder: '사진 설명을 입력하세요' },
  ], (r) => {
    pickImageFile(file => uploadPhoto(file, r.caption, 'gallery'));
  });
});

/* ═══════════════════════════════════════════════════
   18. 프로필 + SNS 편집
════════════════════════════════════════════════════ */

function applyProfile(p){ const nameEl=document.querySelector('.profile-name'); if(nameEl)nameEl.childNodes[0].textContent=p.name+' '; const nameEnEl=document.querySelector('.name-en'); if(nameEnEl)nameEnEl.textContent=p.nameEn; const bioEl=document.querySelector('.profile-bio'); if(bioEl)bioEl.textContent=p.bio; const badgeEl=document.querySelector('.status-text'); if(badgeEl)badgeEl.textContent=p.statusBadge; const emojiEl=document.querySelector('.status-emoji'); if(emojiEl)emojiEl.textContent=p.statusEmoji; const msgEl=document.querySelector('.status-msg'); if(msgEl)msgEl.textContent=p.statusMsg; }
function applySns(s){ const btns=document.querySelectorAll('.sns-btn'); btns.forEach(btn=>{ const label=btn.getAttribute('aria-label'); if(label==='Instagram'&&s.instagram)btn.href=s.instagram; if(label==='YouTube'&&s.youtube)btn.href=s.youtube; if(label==='Brunch'&&s.brunch)btn.href=s.brunch; if(label==='GitHub'&&s.github)btn.href=s.github; }); }

async function loadProfile(){ try{ const snap=await getDocs(collection(db,'profile')); if(!snap.empty)applyProfile(snap.docs[0].data()); else{ await dbSet('profile','main',DEFAULT_PROFILE); applyProfile(DEFAULT_PROFILE); } }catch(e){console.error(e);} }
async function loadSns(){ try{ const snap=await getDocs(collection(db,'sns')); if(!snap.empty)applySns(snap.docs[0].data()); else{ await dbSet('sns','main',DEFAULT_SNS); applySns(DEFAULT_SNS); } }catch(e){console.error(e);} }

document.getElementById('admEditProfile').addEventListener('click',async()=>{
  const name=document.querySelector('.profile-name')?.childNodes[0]?.textContent?.trim()||'';
  const nameEn=document.querySelector('.name-en')?.textContent||'';
  const bio=document.querySelector('.profile-bio')?.textContent||'';
  const badge=document.querySelector('.status-text')?.textContent||'';
  const emoji=document.querySelector('.status-emoji')?.textContent||'';
  const msg=document.querySelector('.status-msg')?.textContent||'';
  openEditModal('👤 프로필 수정',[
    {label:'이름 (한글)',key:'name',type:'text',value:name},
    {label:'이름 (영문)',key:'nameEn',type:'text',value:nameEn},
    {label:'한줄 소개',key:'bio',type:'textarea',value:bio},
    {label:'상태 배지',key:'statusBadge',type:'text',value:badge,placeholder:'독서 중'},
    {label:'상태 이모지',key:'statusEmoji',type:'text',value:emoji,placeholder:'📖'},
    {label:'상태 메시지',key:'statusMsg',type:'textarea',value:msg},
  ],async r=>{ const np={name:r.name,nameEn:r.nameEn,bio:r.bio,statusBadge:r.statusBadge,statusEmoji:r.statusEmoji,statusMsg:r.statusMsg}; await dbSet('profile','main',np); applyProfile(np); toast('💾 프로필 저장 완료'); });
});

document.getElementById('admEditSns').addEventListener('click',async()=>{
  const btns=document.querySelectorAll('.sns-btn'); let ig='',yt='',br='',gh='';
  btns.forEach(btn=>{ const label=btn.getAttribute('aria-label'); const href=btn.href===location.href?'':btn.href; if(label==='Instagram')ig=href; if(label==='YouTube')yt=href; if(label==='Brunch')br=href; if(label==='GitHub')gh=href; });
  openEditModal('🔗 SNS 링크 수정',[
    {label:'Instagram URL',key:'instagram',type:'text',value:ig,placeholder:'https://instagram.com/아이디'},
    {label:'YouTube URL',key:'youtube',type:'text',value:yt,placeholder:'https://youtube.com/@채널명'},
    {label:'브런치 URL',key:'brunch',type:'text',value:br,placeholder:'https://brunch.co.kr/@아이디'},
    {label:'GitHub URL',key:'github',type:'text',value:gh,placeholder:'https://github.com/아이디'},
  ],async r=>{ const ns={instagram:r.instagram,youtube:r.youtube,brunch:r.brunch,github:r.github}; await dbSet('sns','main',ns); applySns(ns); toast('💾 SNS 저장 완료'); });
});

/* ═══════════════════════════════════════════════════
   19. 검색
════════════════════════════════════════════════════ */

const searchToggle=document.getElementById('searchToggle'), searchCloseBtn=document.getElementById('searchClose'), searchBar=document.getElementById('searchBar'), searchInput=document.getElementById('searchInput'), searchResults=document.getElementById('searchResults'), searchResultsList=document.getElementById('searchResultsList');
searchToggle.addEventListener('click',()=>{ searchBar.classList.toggle('open'); searchBar.classList.contains('open')?searchInput.focus():closeSearch(); });
searchCloseBtn.addEventListener('click',()=>{ searchBar.classList.remove('open'); closeSearch(); });
function closeSearch(){ searchInput.value=''; hide(searchResults); }
function performSearch(query){ if(!query.trim()){hide(searchResults);return;} const q=query.toLowerCase(),results=[]; VIDEO_DATA.forEach(v=>{if(v.title.toLowerCase().includes(q)||v.tags.some(t=>t.toLowerCase().includes(q)))results.push({type:'영상',title:v.title,id:v.id,kind:'video'});}); WRITING_DATA.forEach(w=>{if(w.title.toLowerCase().includes(q)||w.tags.some(t=>t.toLowerCase().includes(q)))results.push({type:'글',title:w.title,id:w.id,kind:'writing'});}); BOOK_DATA.forEach(b=>{if(b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q))results.push({type:'책',title:`${b.title} — ${b.author}`,id:b.id,kind:'book'});}); searchResultsList.innerHTML=results.length===0?'<p style="font-size:.82rem;color:var(--text-faint);padding:8px 0;">검색 결과가 없습니다.</p>':results.map(r=>`<div class="search-result-item" data-kind="${r.kind}" data-id="${r.id}"><span class="search-result-type">${r.type}</span><span class="search-result-title">${r.title}</span></div>`).join(''); searchResultsList.querySelectorAll('.search-result-item').forEach(item=>{ item.addEventListener('click',()=>{ const{kind,id}=item.dataset; closeSearch(); searchBar.classList.remove('open'); if(kind==='video'){show(folderPanels.video);} if(kind==='writing'){show(folderPanels.writing);setTimeout(()=>openWritingModal(id),300);} if(kind==='book'){document.getElementById('bookshelf').scrollIntoView({behavior:'smooth'});setTimeout(()=>openBookModal(id),500);} }); }); show(searchResults); }
let searchTimer; searchInput.addEventListener('input',()=>{ clearTimeout(searchTimer); searchTimer=setTimeout(()=>performSearch(searchInput.value),200); });

/* ═══════════════════════════════════════════════════
   20. 초기화 + DB 로드
════════════════════════════════════════════════════ */

let VIDEO_DATA=[], WRITING_DATA=[], BOOK_DATA=[], MONTHLY_DATA=[];

document.getElementById('footerYear').textContent=new Date().getFullYear();

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('editModal')){ document.getElementById('editModal').remove(); document.body.style.overflow=''; }
    else if(document.getElementById('lightboxModal').classList.contains('open')) closeLightbox();
    else if(bookModal.classList.contains('open')){ hide(bookModal); document.body.style.overflow=''; }
    else if(writingModal.classList.contains('open')){ hide(writingModal); document.body.style.overflow=''; }
    else if(profileGalleryModal.classList.contains('open')){ hide(profileGalleryModal); document.body.style.overflow=''; }
    else if(searchBar.classList.contains('open')){ searchBar.classList.remove('open'); closeSearch(); }
  }
});

async function init(){
  showLoading('서재를 불러오는 중...');
  try{
    await Promise.all([
      seedIfEmpty('videos',SEED_VIDEOS), seedIfEmpty('writings',SEED_WRITINGS),
      seedIfEmpty('books',SEED_BOOKS),   seedIfEmpty('monthly',SEED_MONTHLY),
    ]);
    const[videos,writings,books,monthly]=await Promise.all([
      dbGetAll('videos'), dbGetAll('writings'), dbGetAll('books'), dbGetAll('monthly'),
    ]);
    VIDEO_DATA=videos; WRITING_DATA=writings; BOOK_DATA=books; MONTHLY_DATA=monthly;
    renderVideos(); renderWritings(); renderBookshelf(); renderBarChart();
    updateScrollProgress();
    document.querySelectorAll('[data-reveal]').forEach(el=>{ if(el.getBoundingClientRect().top<window.innerHeight)el.classList.add('revealed'); });
  }catch(e){ console.error('DB 로드 오류:',e); toast('❌ 데이터 로드 실패. 새로고침 해주세요.','error'); }
  finally{ hideLoading(); }
}

// 프로필, SNS, 사진 병렬 로드
Promise.all([loadProfile(), loadSns(), loadPhotos()]);
init();
