/**
 * app.js — 개인 아카이브 완성본
 * ★ 비밀번호: ADMIN_PASSWORD 변수에서 변경
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCoGIQVNaIrRRBUM1wzy3A74UGp59jQOQU",
  authDomain: "yuni-archive.firebaseapp.com",
  projectId: "yuni-archive",
  storageBucket: "yuni-archive.firebasestorage.app",
  messagingSenderId: "1082487282227",
  appId: "1:1082487282227:web:a39e154e7f79a037586146"
});
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

/* ── 런타임 데이터 ── */
let VIDEO_DATA = [], WRITING_DATA = [], BOOK_DATA = [];
let PHOTO_DATA = [], GALLERY_DATA = [], TRACKS = [];
let trackIdx = 0, isPlaying = false, isAdminMode = false;
let lightboxData = [], lightboxIndex = 0;

/* ── 시드 데이터 ── */
const SEED_VIDEOS = [
  { id:'v1', title:'교토에서 보낸 3일', date:'2025.05.18', category:'vlog', emoji:'🏯', gradient:'linear-gradient(135deg,#fde68a,#f59e0b)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'혼자 떠난 교토 여행.', tags:['여행','교토','브이로그'] },
  { id:'v2', title:'나만의 독서 루틴', date:'2025.04.30', category:'study', emoji:'📖', gradient:'linear-gradient(135deg,#a78bfa,#7c3aed)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'한 달에 책 5권 읽는 법.', tags:['독서','루틴'] },
  { id:'v3', title:'성수동 카페 투어', date:'2025.04.12', category:'vlog', emoji:'☕', gradient:'linear-gradient(135deg,#6ee7b7,#059669)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'숨겨진 공간들.', tags:['카페','서울'] },
  { id:'v4', title:'애플 셋업 투어 2025', date:'2025.03.10', category:'etc', emoji:'🖥️', gradient:'linear-gradient(135deg,#bfdbfe,#3b82f6)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'M3 MacBook Air 실사용.', tags:['애플','테크'] },
  { id:'v5', title:'제주 한달살기 Ep.1', date:'2025.02.14', category:'vlog', emoji:'🌊', gradient:'linear-gradient(135deg,#fed7aa,#ea580c)', youtubeUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc:'첫 주의 기록.', tags:['제주','한달살기'] },
];
const SEED_WRITINGS = [
  { id:'w1', title:'서울의 카페를 전부 가봤다', date:'2025.05.24', category:'thought', tags:['생각','카페'], excerpt:'카페가 이렇게 많은 도시에 살고 있으면서 왜 항상 같은 자리에 앉을까.', body:'<p>카페가 이렇게 많은 도시에 살고 있으면서 왜 나는 항상 같은 자리에 앉아 같은 아메리카노를 시킬까.</p>' },
  { id:'w2', title:'혼자 있는 능력에 대하여', date:'2025.05.10', category:'thought', tags:['생각','고독'], excerpt:'혼자 있는 것을 즐기는 사람과 혼자 있을 수밖에 없는 사람은 겉으로는 같아 보인다.', body:'<p>혼자 있는 것과 고립은 종이 한 장 차이다.</p>' },
  { id:'w3', title:'교토 여행에서 배운 것들', date:'2025.04.20', category:'review', tags:['후기','여행'], excerpt:'5박 6일이라는 짧지 않은 시간 동안 교토에 있었다.', body:'<p>교토는 서두르면 손해보는 도시다.</p>' },
  { id:'w4', title:'오늘 하루 감사한 것들', date:'2025.04.01', category:'gratitude', tags:['감사','일상'], excerpt:'작은 것들에 감사하는 연습을 시작했다.', body:'<p>커피 한 잔, 햇빛, 좋아하는 음악.</p>' },
];
const SEED_BOOKS = [
  { id:'b1', title:'채식주의자', author:'한강', date:'2026.05.20', stars:5, color:'#2d6a4f', width:24, quote:'인간이라는 사실이, 이렇게 수치스러울 수 없었다.', memo:'두 번째로 읽었다.' },
  { id:'b2', title:'82년생 김지영', author:'조남주', date:'2026.05.05', stars:4, color:'#e07a5f', width:20, quote:'그래도 나는 내 딸이 자유롭게 꿈꾸길 바랐다.', memo:'픽션인데 픽션이 아닌 이야기.' },
  { id:'b3', title:'아몬드', author:'손원평', date:'2026.04.28', stars:5, color:'#c77dff', width:22, quote:'괴물이 되는 건 쉽다. 사람이 되는 건 어렵다.', memo:'감정이 무엇인지 생각하게 만드는 책.' },
  { id:'b4', title:'데미안', author:'헤르만 헤세', date:'2026.04.15', stars:4, color:'#457b9d', width:18, quote:'새는 알을 깨고 나온다.', memo:'스무 살과 서른에 읽는 것이 다르다.' },
  { id:'b5', title:'파친코', author:'이민진', date:'2026.02.28', stars:5, color:'#e63946', width:28, quote:'역사는 우리를 저버렸다. 하지만 그래도 상관없다.', memo:'4대에 걸친 가족 이야기.' },
  { id:'b6', title:'작별하지 않는다', author:'한강', date:'2026.01.18', stars:5, color:'#264653', width:23, quote:'우리는 어떻게 애도해야 하는가.', memo:'읽는 내내 숨을 참았다.' },
];
const DEFAULT_PROFILE = { name:'김아라', nameEn:'Ara Kim', bio:'글 쓰고 책 읽고 영상 만드는 사람 ✦ 기록으로 존재를 증명하는 중', statusBadge:'독서 중' };
const DEFAULT_SNS = { blog:'', instagram:'', github:'' };

/* ── 유틸리티 ── */
const renderStars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
const renderTags  = (tags, cls) => tags.map(t => `<span class="${cls}">${t}</span>`).join('');
const show = el => el.classList.add('open');
const hide = el => el.classList.remove('open');
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const formatTime = s => isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2400);
}

function showLoading() {
  let el = document.getElementById('loadingOverlay');
  if (!el) { el = document.createElement('div'); el.id = 'loadingOverlay'; el.innerHTML = `<div class="loading-inner"><div class="loading-spinner"></div><p>불러오는 중...</p></div>`; document.body.appendChild(el); }
  el.classList.add('open');
}
const hideLoading = () => document.getElementById('loadingOverlay')?.classList.remove('open');

/* ── Firestore ── */
const dbGetAll = async col => (await getDocs(collection(db, col))).docs.map(d => ({ id: d.id, ...d.data() }));
const dbSet    = async (col, id, data) => { const { id: _, ...rest } = data; await setDoc(doc(db, col, id), rest); };
const dbDel    = async (col, id) => deleteDoc(doc(db, col, id));
async function seedIfEmpty(col, seed) {
  const snap = await getDocs(collection(db, col));
  if (!snap.empty) return;
  const batch = writeBatch(db);
  seed.forEach(item => { const { id, ...rest } = item; batch.set(doc(db, col, id), rest); });
  await batch.commit();
}

/* ── Storage 업로드 ── */
function uploadFile(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const path = `${folder}/${uid()}_${file.name}`;
    const task = uploadBytesResumable(ref(storage, path), file);
    task.on('state_changed',
      s => onProgress?.(Math.round(s.bytesTransferred / s.totalBytes * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path })
    );
  });
}

function showUploadProgress(filename) {
  document.getElementById('uploadProgressModal')?.remove();
  const el = document.createElement('div'); el.id = 'uploadProgressModal'; el.className = 'upload-progress-modal';
  el.innerHTML = `<div class="upload-progress-inner"><p class="upload-filename">📤 ${filename}</p><div class="upload-bar-wrap"><div class="upload-bar" id="uploadBar"></div></div><p class="upload-pct" id="uploadPct">0%</p></div>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('open'));
}
function updateUploadProgress(p) { const b = document.getElementById('uploadBar'), t = document.getElementById('uploadPct'); if (b) b.style.width = p + '%'; if (t) t.textContent = p + '%'; }
function hideUploadProgress() { const el = document.getElementById('uploadProgressModal'); if (el) { el.classList.remove('open'); setTimeout(() => el.remove(), 300); } }
function pickFile(accept, cb) { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.style.display = 'none'; document.body.appendChild(i); i.addEventListener('change', () => { if (i.files[0]) cb(i.files[0]); i.remove(); }); i.click(); }

/* ── 테마 ── */
let currentTheme = localStorage.getItem('archive_theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
document.getElementById('themeToggle').addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('archive_theme', currentTheme);
});

/* ── 스크롤 진행도 + 리빌 ── */
function updateScrollProgress() {
  document.getElementById('scrollProgress').style.width = ((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100 || 0) + '%';
}
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('revealed'), i * 80); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('scroll', () => { document.getElementById('topNav').style.boxShadow = window.scrollY > 10 ? 'var(--shadow-md)' : 'none'; }, { passive: true });

/* ── 최근 업데이트 ticker (실제 데이터 반영) ── */
function updateRecentTicker() {
  const ticker = document.getElementById('recentTicker');
  const items = [];

  // 영상 최신 2개
  [...VIDEO_DATA].sort((a, b) => b.date?.localeCompare(a.date || '') || 0).slice(0, 2).forEach(v => {
    items.push(`📹 새 영상 — 「${v.title}」`);
  });
  // 글 최신 2개
  [...WRITING_DATA].sort((a, b) => b.date?.localeCompare(a.date || '') || 0).slice(0, 2).forEach(w => {
    items.push(`✍️ 새 글 — 「${w.title}」`);
  });
  // 책 최신 1개
  [...BOOK_DATA].sort((a, b) => b.date?.localeCompare(a.date || '') || 0).slice(0, 1).forEach(b => {
    items.push(`📚 독서 완료 — 「${b.title} / ${b.author}」`);
  });
  // 사진 최신 1개
  if (PHOTO_DATA.length) items.push(`📷 새 사진 업로드 — ${PHOTO_DATA.length}장`);

  if (!items.length) {
    ticker.innerHTML = '<span>✦ 아직 업데이트 내역이 없어요</span>';
    return;
  }
  // 무한 스크롤 위해 2배 복제
  const html = items.map(t => `<span>${t}</span>`).join('');
  ticker.innerHTML = html + html;
}

/* ── BGM 플레이어 ── */
const audio = document.getElementById('audioPlayer');
const playerDisc = document.getElementById('playerDisc');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerNowLabel = document.getElementById('playerNowLabel');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const discAlbumArt = document.getElementById('discAlbumArt');

function loadTrack(idx) {
  if (!TRACKS.length) { playerTitle.textContent = '음악을 추가해주세요'; playerArtist.textContent = '편집 모드 → 🎵 음악 추가'; playerNowLabel.textContent = '♪ 재생 대기 중'; return; }
  const t = TRACKS[idx];
  audio.src = t.url; audio.load();
  playerTitle.textContent = t.title || '알 수 없는 곡';
  playerArtist.textContent = t.artist || '';
  playerNowLabel.textContent = '♪ Now Playing';
  discAlbumArt.style.display = t.artUrl ? 'block' : 'none';
  if (t.artUrl) discAlbumArt.style.backgroundImage = `url(${t.artUrl})`;
  progressFill.style.width = '0%'; currentTimeEl.textContent = '0:00'; totalTimeEl.textContent = '0:00';
  if (isPlaying) audio.play().catch(() => {});
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('ended', () => { trackIdx = (trackIdx + 1) % Math.max(TRACKS.length, 1); loadTrack(trackIdx); });
audio.addEventListener('loadedmetadata', () => { totalTimeEl.textContent = formatTime(audio.duration); });

document.getElementById('progressBarClick').addEventListener('click', e => {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});
volumeSlider.addEventListener('input', () => { audio.volume = parseFloat(volumeSlider.value); });
audio.volume = 0.8;

playBtn.addEventListener('click', () => {
  if (!TRACKS.length) { toast('먼저 음악을 추가해주세요 🎵'); return; }
  if (isPlaying) {
    audio.pause(); isPlaying = false; playerDisc.classList.remove('spinning');
    playBtn.querySelector('.play-icon').style.display = 'block';
    playBtn.querySelector('.pause-icon').style.display = 'none';
  } else {
    audio.play().then(() => {
      isPlaying = true; playerDisc.classList.add('spinning');
      playBtn.querySelector('.play-icon').style.display = 'none';
      playBtn.querySelector('.pause-icon').style.display = 'block';
    }).catch(e => toast('재생 실패: ' + e.message, 'error'));
  }
});
nextBtn.addEventListener('click', () => { trackIdx = (trackIdx + 1) % Math.max(TRACKS.length, 1); loadTrack(trackIdx); });
prevBtn.addEventListener('click', () => { trackIdx = (trackIdx - 1 + Math.max(TRACKS.length, 1)) % Math.max(TRACKS.length, 1); loadTrack(trackIdx); });

async function loadTracks() {
  try { TRACKS = await dbGetAll('tracks'); if (TRACKS.length) loadTrack(0); } catch (e) { console.error(e); }
}

/* ── 관리자 모드 ── */
const ADMIN_PASSWORD = '1234'; // ★ 여기서 비밀번호 변경

const lockBtn = document.createElement('button');
lockBtn.className = 'icon-btn admin-lock-btn';
lockBtn.innerHTML = `<svg class="lock-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><svg class="lock-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
document.querySelector('.nav-actions').prepend(lockBtn);

const adminToolbar = document.createElement('div');
adminToolbar.className = 'admin-toolbar';
adminToolbar.innerHTML = `
  <span class="admin-toolbar-label">✏️ 편집 모드</span>
  <div class="admin-toolbar-btns">
    <button class="adm-btn adm-btn-profile" id="admEditProfile">👤 프로필</button>
    <button class="adm-btn adm-btn-profile" id="admEditSns">🔗 SNS</button>
    <button class="adm-btn adm-btn-profile" id="admEditInterests">✦ 관심사</button>
    <button class="adm-btn" id="admAddVideo">＋ 영상</button>
    <button class="adm-btn" id="admAddWriting">＋ 글</button>
    <button class="adm-btn" id="admAddBook">＋ 책</button>
    <button class="adm-btn" id="admAddPhoto">＋ 사진</button>
    <button class="adm-btn" id="admAddGallery">＋ 갤러리</button>
    <button class="adm-btn adm-btn-profile" id="admAddTrack">🎵 음악 추가</button>
    <button class="adm-btn adm-btn-profile" id="admManageTracks">🎵 음악 관리</button>
  </div>`;
document.body.appendChild(adminToolbar);

function setAdminMode(on) {
  isAdminMode = on;
  document.body.classList.toggle('admin-mode', on);
  lockBtn.querySelector('.lock-closed').style.display = on ? 'none' : 'block';
  lockBtn.querySelector('.lock-open').style.display = on ? 'block' : 'none';
  lockBtn.style.color = on ? 'var(--accent)' : '';
  adminToolbar.classList.toggle('open', on);
  toast(on ? '✏️ 편집 모드 활성화' : '🔒 편집 모드 종료');
}
lockBtn.addEventListener('click', () => {
  if (isAdminMode) { setAdminMode(false); return; }
  const pw = prompt('🔐 관리자 비밀번호');
  if (pw === null) return;
  pw === ADMIN_PASSWORD ? setAdminMode(true) : toast('❌ 비밀번호가 틀렸습니다', 'error');
});

/* ── 편집 모달 ── */
function openEditModal(title, fields, onSave) {
  document.getElementById('editModal')?.remove();
  const modal = document.createElement('div'); modal.id = 'editModal'; modal.className = 'modal-overlay open';
  const fh = fields.map(f => {
    let inp = '';
    if (f.type === 'textarea') inp = `<textarea class="edit-input edit-textarea" data-key="${f.key}" rows="4">${f.value ?? ''}</textarea>`;
    else if (f.type === 'select') inp = `<select class="edit-input" data-key="${f.key}">${f.options.map(o => `<option value="${o}"${o === f.value ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    else if (f.type === 'number') inp = `<input type="number" class="edit-input" data-key="${f.key}" value="${f.value ?? ''}" min="${f.min ?? 0}" max="${f.max ?? 999}">`;
    else inp = `<input type="text" class="edit-input" data-key="${f.key}" value="${f.value ?? ''}" placeholder="${f.placeholder ?? ''}">`;
    return `<div class="edit-field"><label class="edit-label">${f.label}</label>${inp}</div>`;
  }).join('');
  modal.innerHTML = `<div class="modal edit-modal"><button class="modal-close" id="editModalClose">✕</button><h3 class="edit-modal-title">${title}</h3><div class="edit-fields">${fh}</div><div class="edit-modal-footer"><button class="edit-cancel-btn" id="editCancel">취소</button><button class="edit-save-btn" id="editConfirm">저장</button></div></div>`;
  document.body.appendChild(modal); document.body.style.overflow = 'hidden';
  const close = () => { modal.remove(); document.body.style.overflow = ''; };
  modal.querySelector('#editModalClose').addEventListener('click', close);
  modal.querySelector('#editCancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#editConfirm').addEventListener('click', () => {
    const r = {}; modal.querySelectorAll('[data-key]').forEach(el => { r[el.dataset.key] = el.value; }); onSave(r); close();
  });
}

/* ── 음악 관리 ── */
document.getElementById('admAddTrack').addEventListener('click', () => {
  openEditModal('🎵 음악 추가', [
    { label: '곡 제목', key: 'title', type: 'text', placeholder: '곡 제목' },
    { label: '아티스트', key: 'artist', type: 'text', placeholder: '아티스트명' },
  ], r => {
    pickFile('audio/*', async file => {
      showUploadProgress(file.name);
      try {
        const { url, path } = await uploadFile(file, 'tracks', p => updateUploadProgress(p));
        hideUploadProgress();
        const newT = { id: 't' + uid(), title: r.title || file.name.replace(/\.[^/.]+$/, ''), artist: r.artist || '', url, path };
        await dbSet('tracks', newT.id, newT); TRACKS.push(newT);
        if (TRACKS.length === 1) { trackIdx = 0; loadTrack(0); }
        toast('🎵 음악 추가 완료!');
      } catch (e) { hideUploadProgress(); toast('❌ 업로드 실패', 'error'); console.error(e); }
    });
  });
});

document.getElementById('admManageTracks').addEventListener('click', () => {
  if (!TRACKS.length) { toast('추가된 음악이 없어요', 'error'); return; }
  document.getElementById('editModal')?.remove();
  const modal = document.createElement('div'); modal.id = 'editModal'; modal.className = 'modal-overlay open';
  const list = TRACKS.map((t, i) => `<div class="track-manage-item"><span class="track-manage-info">${i === trackIdx ? '▶ ' : ''}<strong>${t.title}</strong>${t.artist ? ` — ${t.artist}` : ''}</span><button class="admin-del-btn" data-tid="${t.id}">🗑️</button></div>`).join('');
  modal.innerHTML = `<div class="modal edit-modal"><button class="modal-close" id="editModalClose">✕</button><h3 class="edit-modal-title">🎵 음악 관리</h3><div class="edit-fields" style="gap:8px;">${list}</div></div>`;
  document.body.appendChild(modal); document.body.style.overflow = 'hidden';
  const close = () => { modal.remove(); document.body.style.overflow = ''; };
  modal.querySelector('#editModalClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelectorAll('.admin-del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('이 곡을 삭제할까요?')) return;
      const t = TRACKS.find(x => x.id === btn.dataset.tid);
      if (t?.path) { try { await deleteObject(ref(storage, t.path)); } catch (_) {} }
      await dbDel('tracks', btn.dataset.tid);
      TRACKS = TRACKS.filter(x => x.id !== btn.dataset.tid);
      if (!TRACKS.length) { audio.pause(); isPlaying = false; loadTrack(0); } else { trackIdx = 0; loadTrack(0); }
      toast('🗑️ 곡 삭제 완료'); close();
    });
  });
});

/* ── 폴더 카운트 업데이트 ── */
function updateAllCounts() {
  const vc = document.getElementById('videoFolderCount');
  const wc = document.getElementById('writingFolderCount');
  const pc = document.getElementById('photoFolderCount');
  if (vc) vc.textContent = `영상 ${VIDEO_DATA.length}편`;
  if (wc) wc.textContent = `글 ${WRITING_DATA.length}편`;
  if (pc) pc.textContent = `사진 ${PHOTO_DATA.length}장`;
}

/* ── 영상 편집 ── */
async function deleteVideo(id) {
  if (!confirm('삭제할까요?')) return;
  await dbDel('videos', id); VIDEO_DATA = VIDEO_DATA.filter(v => v.id !== id);
  toast('🗑️ 삭제'); renderVideos(); updateAllCounts(); updateRecentTicker();
}
function editVideo(v) {
  openEditModal('📹 영상 수정', [
    { label: '제목', key: 'title', type: 'text', value: v.title },
    { label: '날짜', key: 'date', type: 'text', value: v.date, placeholder: 'YYYY.MM.DD' },
    { label: 'YouTube URL', key: 'youtubeUrl', type: 'text', value: v.youtubeUrl },
    { label: '카테고리', key: 'category', type: 'select', value: v.category, options: ['vlog', 'study', 'etc'] },
    { label: '이모지', key: 'emoji', type: 'text', value: v.emoji },
    { label: '설명', key: 'desc', type: 'textarea', value: v.desc },
    { label: '태그 (쉼표 구분)', key: 'tags', type: 'text', value: v.tags.join(', ') },
  ], async r => {
    Object.assign(v, { title: r.title, date: r.date, youtubeUrl: r.youtubeUrl, category: r.category, emoji: r.emoji, desc: r.desc, tags: r.tags.split(',').map(t => t.trim()).filter(Boolean) });
    await dbSet('videos', v.id, v); toast('💾 저장'); renderVideos(); updateAllCounts(); updateRecentTicker();
  });
}
document.getElementById('admAddVideo').addEventListener('click', () => {
  const nv = { id: 'v' + uid(), title: '새 영상', date: '', category: 'vlog', emoji: '🎬', gradient: 'linear-gradient(135deg,#a0aec0,#718096)', youtubeUrl: '', desc: '', tags: [] };
  VIDEO_DATA.unshift(nv); editVideo(nv);
});

/* ── 글 편집 ── */
async function deleteWriting(id) {
  if (!confirm('삭제할까요?')) return;
  await dbDel('writings', id); WRITING_DATA = WRITING_DATA.filter(w => w.id !== id);
  toast('🗑️ 삭제'); renderWritings(); updateAllCounts(); updateRecentTicker();
}
function editWriting(w) {
  openEditModal('✍️ 글 수정', [
    { label: '제목', key: 'title', type: 'text', value: w.title },
    { label: '날짜', key: 'date', type: 'text', value: w.date, placeholder: 'YYYY.MM.DD' },
    { label: '카테고리', key: 'category', type: 'select', value: w.category, options: ['thought', 'gratitude', 'review'] },
    { label: '태그 (쉼표 구분)', key: 'tags', type: 'text', value: w.tags.join(', ') },
    { label: '요약', key: 'excerpt', type: 'textarea', value: w.excerpt },
    { label: '본문', key: 'body', type: 'textarea', value: w.body },
  ], async r => {
    Object.assign(w, { title: r.title, date: r.date, category: r.category, tags: r.tags.split(',').map(t => t.trim()).filter(Boolean), excerpt: r.excerpt, body: r.body });
    await dbSet('writings', w.id, w); toast('💾 저장'); renderWritings(); updateAllCounts(); updateRecentTicker();
  });
}
document.getElementById('admAddWriting').addEventListener('click', () => {
  const nw = { id: 'w' + uid(), title: '새 글', date: '', category: 'thought', tags: [], excerpt: '', body: '<p>내용을 입력하세요.</p>' };
  WRITING_DATA.unshift(nw); editWriting(nw);
});

/* ── 책 편집 ── */
async function deleteBook(id) {
  if (!confirm('삭제할까요?')) return;
  await dbDel('books', id); BOOK_DATA = BOOK_DATA.filter(b => b.id !== id);
  toast('🗑️ 삭제'); renderBookshelf(); updateRecentTicker();
}
function editBook(b) {
  openEditModal('📚 책 수정', [
    { label: '제목', key: 'title', type: 'text', value: b.title },
    { label: '저자', key: 'author', type: 'text', value: b.author },
    { label: '완독일', key: 'date', type: 'text', value: b.date, placeholder: 'YYYY.MM.DD' },
    { label: '별점 (1~5)', key: 'stars', type: 'number', value: b.stars, min: 1, max: 5 },
    { label: '책등 색상 (HEX)', key: 'color', type: 'text', value: b.color, placeholder: '#2d6a4f' },
    { label: '한줄평', key: 'quote', type: 'textarea', value: b.quote },
    { label: '독서 메모', key: 'memo', type: 'textarea', value: b.memo },
  ], async r => {
    Object.assign(b, { title: r.title, author: r.author, date: r.date, stars: Math.min(5, Math.max(1, parseInt(r.stars) || 1)), color: r.color || '#888', quote: r.quote, memo: r.memo });
    await dbSet('books', b.id, b); toast('💾 저장'); renderBookshelf(); updateRecentTicker();
  });
}
document.getElementById('admAddBook').addEventListener('click', () => {
  const colors = ['#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#457b9d', '#6a4c93', '#2d6a4f', '#e63946'];
  const nb = { id: 'b' + uid(), title: '새 책', author: '', date: new Date().toLocaleDateString('ko').replace(/\. /g, '.').replace('.', ''), stars: 4, color: colors[Math.floor(Math.random() * colors.length)], width: 20, quote: '', memo: '' };
  BOOK_DATA.push(nb); editBook(nb);
});

/* ── 프로필 + SNS ── */
function applyProfile(p) {
  const ne = document.querySelector('.profile-name'); if (ne) ne.childNodes[0].textContent = (p.name || '') + ' ';
  const ee = document.querySelector('.name-en'); if (ee) ee.textContent = p.nameEn || '';
  const be = document.querySelector('.profile-bio'); if (be) be.textContent = p.bio || '';
  const bde = document.querySelector('.status-text'); if (bde) bde.textContent = p.statusBadge || '';
  if (p.avatarUrl) setAvatarPhoto(p.avatarUrl);
}
function applySns(s) {
  document.querySelectorAll('.sns-btn').forEach(btn => {
    const label = btn.getAttribute('aria-label');
    if (label === 'Blog' && s.blog) btn.href = s.blog;
    if (label === 'Instagram' && s.instagram) btn.href = s.instagram;
    if (label === 'GitHub' && s.github) btn.href = s.github;
  });
}
function setAvatarPhoto(url) {
  const el = document.getElementById('avatarBtn');
  if (!url || !el) return;
  el.innerHTML = `<img src="${url}" alt="프로필 사진" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
}
async function loadProfile() {
  try {
    const snap = await getDocs(collection(db, 'profile'));
    if (snap.empty) { await dbSet('profile', 'main', DEFAULT_PROFILE); applyProfile(DEFAULT_PROFILE); }
    else applyProfile(snap.docs[0].data());
  } catch (e) { console.error(e); }
}
async function loadSns() {
  try {
    const snap = await getDocs(collection(db, 'sns'));
    if (snap.empty) { await dbSet('sns', 'main', DEFAULT_SNS); applySns(DEFAULT_SNS); }
    else applySns(snap.docs[0].data());
  } catch (e) { console.error(e); }
}

const DEFAULT_AVATAR_SVG = `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="60" fill="var(--avatar-bg)"/><ellipse cx="60" cy="88" rx="28" ry="18" fill="var(--avatar-body)"/><circle cx="60" cy="52" r="22" fill="var(--avatar-skin)"/><path d="M38 50 Q40 28 60 30 Q80 28 82 50 Q78 36 60 38 Q42 36 38 50Z" fill="var(--avatar-hair)"/><circle cx="52" cy="50" r="3" fill="var(--avatar-eye)"/><circle cx="68" cy="50" r="3" fill="var(--avatar-eye)"/><circle cx="53.5" cy="48.5" r="1" fill="white"/><circle cx="69.5" cy="48.5" r="1" fill="white"/><ellipse cx="46" cy="55" rx="5" ry="3" fill="var(--avatar-blush)" opacity="0.5"/><ellipse cx="74" cy="55" rx="5" ry="3" fill="var(--avatar-blush)" opacity="0.5"/><path d="M54 60 Q60 65 66 60" stroke="var(--avatar-eye)" stroke-width="1.5" stroke-linecap="round" fill="none"/><rect x="30" y="78" width="18" height="14" rx="2" fill="var(--accent)" opacity="0.8"/><line x1="39" y1="78" x2="39" y2="92" stroke="white" stroke-width="1" opacity="0.5"/><path d="M48 48 Q52 44 56 48 M64 48 Q68 44 72 48" stroke="var(--avatar-eye)" stroke-width="1.2" fill="none"/><line x1="56" y1="48" x2="64" y2="48" stroke="var(--avatar-eye)" stroke-width="1.2"/></svg>`;

function resetAvatar() {
  document.getElementById('avatarBtn').innerHTML = DEFAULT_AVATAR_SVG;
}

document.getElementById('admEditProfile').addEventListener('click', async () => {
  const snap = await getDocs(collection(db, 'profile'));
  const current = snap.empty ? {} : snap.docs[0].data();
  const hasPhoto = !!current.avatarUrl;

  // 프사 삭제 버튼 별도 처리
  document.getElementById('editModal')?.remove();
  const modal = document.createElement('div'); modal.id = 'editModal'; modal.className = 'modal-overlay open';

  const fieldsHtml = [
    { label: '이름 (한글)', key: 'name',        value: document.querySelector('.profile-name')?.childNodes[0]?.textContent?.trim() || '' },
    { label: '이름 (영문)', key: 'nameEn',       value: document.querySelector('.name-en')?.textContent || '' },
    { label: '한줄 소개',   key: 'bio',          value: document.querySelector('.profile-bio')?.textContent || '', textarea: true },
    { label: '상태 배지',   key: 'statusBadge',  value: document.querySelector('.status-text')?.textContent || '' },
  ].map(f => `<div class="edit-field"><label class="edit-label">${f.label}</label>${f.textarea ? `<textarea class="edit-input edit-textarea" data-key="${f.key}" rows="3">${f.value}</textarea>` : `<input type="text" class="edit-input" data-key="${f.key}" value="${f.value}">`}</div>`).join('');

  const avatarSection = hasPhoto
    ? `<div class="edit-field"><label class="edit-label">프로필 사진</label><button class="edit-delete-avatar-btn" id="deleteAvatarBtn">🗑️ 프로필 사진 삭제</button></div>`
    : `<div class="edit-field"><label class="edit-label">프로필 사진</label><p style="font-size:.78rem;color:var(--text-faint);">갤러리에서 사진을 선택해주세요</p></div>`;

  modal.innerHTML = `
    <div class="modal edit-modal">
      <button class="modal-close" id="editModalClose">✕</button>
      <h3 class="edit-modal-title">👤 프로필 수정</h3>
      <div class="edit-fields">
        ${fieldsHtml}
        ${avatarSection}
      </div>
      <div class="edit-modal-footer">
        <button class="edit-cancel-btn" id="editCancel">취소</button>
        <button class="edit-save-btn" id="editConfirm">저장</button>
      </div>
    </div>`;

  document.body.appendChild(modal); document.body.style.overflow = 'hidden';
  const close = () => { modal.remove(); document.body.style.overflow = ''; };
  modal.querySelector('#editModalClose').addEventListener('click', close);
  modal.querySelector('#editCancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // 프사 삭제 버튼
  modal.querySelector('#deleteAvatarBtn')?.addEventListener('click', async () => {
    if (!confirm('프로필 사진을 삭제할까요?')) return;
    const np = { ...current }; delete np.avatarUrl;
    await dbSet('profile', 'main', np);
    resetAvatar();
    toast('🗑️ 프로필 사진 삭제 완료');
    close();
  });

  // 저장
  modal.querySelector('#editConfirm').addEventListener('click', async () => {
    const r = {}; modal.querySelectorAll('[data-key]').forEach(el => { r[el.dataset.key] = el.value; });
    const np = { ...current, name: r.name, nameEn: r.nameEn, bio: r.bio, statusBadge: r.statusBadge };
    await dbSet('profile', 'main', np); applyProfile(np); toast('💾 프로필 저장'); close();
  });
});

document.getElementById('admEditSns').addEventListener('click', () => {
  const blogBtn = document.querySelector('.sns-btn[aria-label="Blog"]');
  const igBtn = document.querySelector('.sns-btn[aria-label="Instagram"]');
  const ghBtn = document.querySelector('.sns-btn[aria-label="GitHub"]');
  openEditModal('🔗 SNS 링크', [
    { label: '블로그 URL', key: 'blog', type: 'text', value: blogBtn?.href === location.href ? '' : blogBtn?.href || '', placeholder: 'https://brunch.co.kr/@...' },
    { label: 'Instagram URL', key: 'instagram', type: 'text', value: igBtn?.href === location.href ? '' : igBtn?.href || '', placeholder: 'https://instagram.com/아이디' },
    { label: 'GitHub URL', key: 'github', type: 'text', value: ghBtn?.href === location.href ? '' : ghBtn?.href || '', placeholder: 'https://github.com/아이디' },
  ], async r => {
    await dbSet('sns', 'main', { blog: r.blog, instagram: r.instagram, github: r.github });
    applySns({ blog: r.blog, instagram: r.instagram, github: r.github }); toast('💾 SNS 저장');
  });
});

/* ── 관심사 편집 ── */
function applyInterests(tags) {
  const el = document.getElementById('interestsTags');
  if (!el || !tags.length) return;
  el.innerHTML = tags.map(t => `<span class="interest-tag">${t}</span>`).join('');
}
async function loadInterests() {
  try {
    const snap = await getDocs(collection(db, 'interests'));
    if (!snap.empty) applyInterests(snap.docs[0].data().tags || []);
  } catch (e) { console.error(e); }
}
document.getElementById('admEditInterests').addEventListener('click', () => {
  const currentTags = [...document.querySelectorAll('.interest-tag')].map(el => el.textContent).join(', ');
  openEditModal('✦ 관심사 수정', [
    { label: '태그 (쉼표로 구분)', key: 'tags', type: 'textarea', value: currentTags, placeholder: '☕ 커피, 📚 독서, 🎵 음악' },
  ], async r => {
    const tags = r.tags.split(',').map(t => t.trim()).filter(Boolean);
    await dbSet('interests', 'main', { tags }); applyInterests(tags); toast('💾 관심사 저장');
  });
});

/* ── 프사 선택 (갤러리에서) ── */
function openAvatarPicker() {
  if (!GALLERY_DATA.length) { toast('먼저 갤러리에 사진을 추가해주세요', 'error'); return; }
  document.getElementById('editModal')?.remove();
  const modal = document.createElement('div'); modal.id = 'editModal'; modal.className = 'modal-overlay open';
  modal.innerHTML = `<div class="modal edit-modal"><button class="modal-close" id="editModalClose">✕</button><h3 class="edit-modal-title">🖼️ 프로필 사진 선택</h3><p style="font-size:.82rem;color:var(--text-muted);margin-bottom:16px;">클릭하면 프로필 사진으로 설정돼요</p><div class="avatar-picker-grid" id="avatarPickerGrid"></div></div>`;
  document.body.appendChild(modal); document.body.style.overflow = 'hidden';
  const grid = modal.querySelector('#avatarPickerGrid');
  grid.innerHTML = GALLERY_DATA.map(p => `<div class="avatar-pick-item" data-url="${p.url}"><img src="${p.url}" alt=""></div>`).join('');
  grid.querySelectorAll('.avatar-pick-item').forEach(item => {
    item.addEventListener('click', async () => {
      const url = item.dataset.url;
      setAvatarPhoto(url);
      const snap = await getDocs(collection(db, 'profile'));
      const current = snap.empty ? DEFAULT_PROFILE : snap.docs[0].data();
      await dbSet('profile', 'main', { ...current, avatarUrl: url });
      toast('✅ 프로필 사진 변경 완료!'); modal.remove(); document.body.style.overflow = '';
    });
  });
  modal.querySelector('#editModalClose').addEventListener('click', () => { modal.remove(); document.body.style.overflow = ''; });
  modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); document.body.style.overflow = ''; } });
}

document.getElementById('avatarBtn').addEventListener('click', () => {
  if (isAdminMode) { openAvatarPicker(); return; }
  renderProfileGallery();
  show(document.getElementById('profileGalleryModal'));
  document.body.style.overflow = 'hidden';
});

/* ── 폴더 패널 ── */
const folderPanels = {
  video:   document.getElementById('panelVideo'),
  writing: document.getElementById('panelWriting'),
  photos:  document.getElementById('panelPhotos'),
};

function togglePanel(type) {
  const p = folderPanels[type]; if (!p) return;
  const isOpen = p.classList.contains('open');
  Object.values(folderPanels).forEach(x => hide(x));
  if (!isOpen) { show(p); p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

document.getElementById('folderVideo').addEventListener('click',  () => togglePanel('video'));
document.getElementById('folderWrite').addEventListener('click',  () => togglePanel('writing'));
document.getElementById('folderPhotos').addEventListener('click', () => togglePanel('photos'));

// 서재 폴더 클릭 → 서재 섹션 토글
const bookshelfSection = document.getElementById('bookshelf');
let bookshelfVisible = false;
document.getElementById('folderBooks').addEventListener('click', () => {
  bookshelfVisible = !bookshelfVisible;
  bookshelfSection.style.display = bookshelfVisible ? 'block' : 'none';
  if (bookshelfVisible) {
    bookshelfSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

document.querySelectorAll('.panel-close').forEach(btn => {
  btn.addEventListener('click', () => { const type = btn.dataset.close; if (folderPanels[type]) hide(folderPanels[type]); });
});

/* ── 영상 렌더링 ── */
const videoGrid = document.getElementById('videoGrid');
function createVideoCard(v) {
  return `<div class="video-card" data-id="${v.id}" data-category="${v.category}"><div class="admin-item-btns"><button class="admin-edit-btn" data-vid="${v.id}">✏️</button><button class="admin-del-btn" data-vid="${v.id}">🗑️</button></div><a href="${v.youtubeUrl || '#'}" target="_blank" rel="noopener" class="video-card-link"><div class="video-thumb"><div class="video-thumb-bg" style="background:${v.gradient}"><span style="font-size:3rem">${v.emoji}</span></div><div class="video-play-overlay"><div class="play-circle">▶</div></div><div class="yt-badge">▶ YouTube</div></div><div class="video-info"><p class="video-title">${v.title}</p><div class="video-meta"><span class="video-date">${v.date}</span><span class="video-tag">${v.category}</span></div></div></a></div>`;
}
function renderVideos(filter = 'all') {
  const f = filter === 'all' ? VIDEO_DATA : VIDEO_DATA.filter(v => v.category === filter);
  videoGrid.innerHTML = f.map(createVideoCard).join('');
  videoGrid.querySelectorAll('.admin-edit-btn').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); const v = VIDEO_DATA.find(x => x.id === b.dataset.vid); if (v) editVideo(v); }); });
  videoGrid.querySelectorAll('.admin-del-btn').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); deleteVideo(b.dataset.vid); }); });
}
document.querySelectorAll('#panelVideo .filter-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('#panelVideo .filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderVideos(btn.dataset.filter); }); });

/* ── 글쓰기 렌더링 ── */
const writingList = document.getElementById('writingList');
const writingModal = document.getElementById('writingModal');
function createWritingItem(w) {
  return `<div class="writing-item" data-id="${w.id}" data-category="${w.category}"><div class="admin-item-btns"><button class="admin-edit-btn" data-wid="${w.id}">✏️</button><button class="admin-del-btn" data-wid="${w.id}">🗑️</button></div><span class="writing-item-date">${w.date}</span><div class="writing-item-content"><p class="writing-item-title">${w.title}</p><p class="writing-item-excerpt">${w.excerpt}</p><div class="writing-tags">${renderTags(w.tags, 'writing-tag')}</div></div></div>`;
}
function renderWritings(filter = 'all') {
  const f = filter === 'all' ? WRITING_DATA : WRITING_DATA.filter(w => w.category === filter);
  writingList.innerHTML = f.map(createWritingItem).join('');
  writingList.querySelectorAll('.writing-item').forEach(item => { item.addEventListener('click', e => { if (e.target.closest('.admin-item-btns')) return; openWritingModal(item.dataset.id); }); });
  writingList.querySelectorAll('.admin-edit-btn').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); const w = WRITING_DATA.find(x => x.id === b.dataset.wid); if (w) editWriting(w); }); });
  writingList.querySelectorAll('.admin-del-btn').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); deleteWriting(b.dataset.wid); }); });
}
function openWritingModal(id) {
  const w = WRITING_DATA.find(x => x.id === id); if (!w) return;
  document.getElementById('writingModalTitle').textContent = w.title;
  document.getElementById('writingModalDate').textContent  = w.date;
  document.getElementById('writingModalBody').innerHTML    = w.body;
  document.getElementById('writingModalTags').innerHTML    = renderTags(w.tags, 'writing-tag');
  show(writingModal); document.body.style.overflow = 'hidden';
}
document.getElementById('writingModalClose').addEventListener('click', () => { hide(writingModal); document.body.style.overflow = ''; });
writingModal.addEventListener('click', e => { if (e.target === writingModal) { hide(writingModal); document.body.style.overflow = ''; } });
document.querySelectorAll('#panelWriting .filter-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('#panelWriting .filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderWritings(btn.dataset.filter); }); });

/* ── 독서 기록 — 책장 + 통계 ── */
const bookshelfEl = document.getElementById('bookshelf-display');
const bookModal   = document.getElementById('bookModal');

let currentShelfYear = 2026;

function updateBookStats() {
  const now = new Date(), thisYear = now.getFullYear(), thisMonth = now.getMonth() + 1;
  const yearBooks  = BOOK_DATA.filter(b => b.date && parseInt(b.date.split('.')[0]) === thisYear);
  const monthBooks = yearBooks.filter(b => parseInt(b.date.split('.')[1]) === thisMonth);
  document.getElementById('statThisYear').textContent  = yearBooks.length;
  document.getElementById('statThisMonth').textContent = monthBooks.length;
  document.getElementById('statTotal').textContent     = BOOK_DATA.length;
  const bfc = document.getElementById('bookFolderCount');
  if (bfc) bfc.textContent = `읽은 책 ${BOOK_DATA.length}권`;


}

/** 전체 기록 모달 */
document.getElementById('statTotalCard').addEventListener('click', () => {
  document.getElementById('editModal')?.remove();
  const modal = document.createElement('div'); modal.id = 'editModal'; modal.className = 'modal-overlay open';
  const sorted = [...BOOK_DATA].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const grouped = {};
  sorted.forEach(b => {
    const year = b.date ? b.date.split('.')[0] : '날짜 없음';
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(b);
  });
  const years = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

  const renderAllBooks = (filterYear = 'all') => {
    const filtered = filterYear === 'all' ? grouped : { [filterYear]: grouped[filterYear] || [] };
    return Object.entries(filtered).sort((a,b) => b[0].localeCompare(a[0])).map(([year, books]) => `
      <div class="all-books-year">
        <h4 class="all-books-year-label">${year}년 · ${books.length}권</h4>
        ${books.map(b => `
          <div class="all-books-item" data-bid="${b.id}">
            <div class="all-books-cover" style="background:${b.color}"></div>
            <div class="all-books-info">
              <p class="all-books-title">${b.title}</p>
              <p class="all-books-author">${b.author} · ${renderStars(b.stars)}</p>
              <p class="all-books-date">${b.date}</p>
            </div>
          </div>`).join('')}
      </div>`).join('') || '<p style="color:var(--text-faint);text-align:center;padding:20px;">읽은 책이 없어요</p>';
  };

  const yearTabsHtml = `<button class="year-tab active" data-year="all">전체 (${BOOK_DATA.length}권)</button>` +
    years.map(y => `<button class="year-tab" data-year="${y}">${y}년 (${grouped[y].length}권)</button>`).join('');

  modal.innerHTML = `
    <div class="modal edit-modal" style="max-width:600px;">
      <button class="modal-close" id="editModalClose">✕</button>
      <h3 class="edit-modal-title">📚 전체 독서 기록</h3>
      <div class="bookshelf-year-tabs" style="margin-bottom:16px;">${yearTabsHtml}</div>
      <div class="edit-fields all-books-list" id="allBooksList">${renderAllBooks()}</div>
    </div>`;
  document.body.appendChild(modal); document.body.style.overflow = 'hidden';
  const close = () => { modal.remove(); document.body.style.overflow = ''; };
  modal.querySelector('#editModalClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  // 연도 필터 탭
  modal.querySelectorAll('.year-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      modal.querySelector('#allBooksList').innerHTML = renderAllBooks(tab.dataset.year);
      modal.querySelectorAll('.all-books-item').forEach(item => {
        item.addEventListener('click', () => { close(); openBookModal(item.dataset.bid); });
      });
    });
  });

  modal.querySelectorAll('.all-books-item').forEach(item => {
    item.addEventListener('click', () => { close(); openBookModal(item.dataset.bid); });
  });
});

function createBookSpine(b) {
  return `<div class="book-spine" data-id="${b.id}" style="background:${b.color};width:${b.width || 20}px;"><span class="book-spine-title">${b.title}</span></div>`;
}

function renderBookshelf() {
  if (!bookshelfEl) return;
  // 현재 연도 책만 필터
  const yearBooks = BOOK_DATA.filter(b => b.date && parseInt(b.date.split('.')[0]) === currentShelfYear);
  let html = '';
  const perRow = 12; // 한 줄에 12권
  for (let i = 0; i < yearBooks.length; i += perRow) {
    html += `<div class="shelf-row">${yearBooks.slice(i, i + perRow).map(createBookSpine).join('')}</div>`;
  }
  if (!yearBooks.length) html = `<div class="shelf-row empty-shelf"><p style="font-size:.85rem;color:var(--text-faint);padding:30px 0;">${currentShelfYear}년에 읽은 책이 없어요 📚</p></div>`;
  bookshelfEl.innerHTML = html;
  bookshelfEl.querySelectorAll('.book-spine').forEach(s => {
    s.addEventListener('click', () => {
      isAdminMode ? showBookAdminMenu(BOOK_DATA.find(x => x.id === s.dataset.id), s) : openBookModal(s.dataset.id);
    });
  });
  updateBookStats();
}

// 연도 탭 클릭
document.getElementById('bookshelfYearTabs').addEventListener('click', e => {
  const tab = e.target.closest('.year-tab');
  if (!tab) return;
  document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentShelfYear = parseInt(tab.dataset.year);
  renderBookshelf();
});

function showBookAdminMenu(b, anchor) {
  document.querySelector('.book-admin-menu')?.remove();
  const menu = document.createElement('div'); menu.className = 'book-admin-menu';
  menu.innerHTML = `<button data-action="edit">✏️ 수정</button><button data-action="del">🗑️ 삭제</button><button data-action="cancel">취소</button>`;
  const rect = anchor.getBoundingClientRect();
  menu.style.cssText = `position:fixed;top:${rect.bottom + 8}px;left:${rect.left}px;z-index:2000;`;
  document.body.appendChild(menu);
  menu.addEventListener('click', e => { const a = e.target.dataset.action; menu.remove(); if (a === 'edit') editBook(b); if (a === 'del') deleteBook(b.id); });
  setTimeout(() => { document.addEventListener('click', () => menu.remove(), { once: true }); }, 0);
}

function openBookModal(id) {
  const b = BOOK_DATA.find(x => x.id === id); if (!b) return;
  const cover = document.getElementById('bookModalCover');
  cover.style.background = `linear-gradient(135deg,${b.color},color-mix(in srgb,${b.color} 70%,#000))`;
  cover.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,.9);padding:20px;"><div style="font-size:2.5rem;margin-bottom:12px;">📖</div><p style="font-size:.8rem;line-height:1.4;">${b.title}</p><p style="font-size:.65rem;opacity:.7;margin-top:6px;">${b.author}</p></div>`;
  document.getElementById('bookModalTitle').textContent  = b.title;
  document.getElementById('bookModalAuthor').textContent = b.author;
  document.getElementById('bookModalStars').textContent  = renderStars(b.stars);
  document.getElementById('bookModalDate').textContent   = '📅 ' + b.date + ' 완독';
  document.getElementById('bookModalQuote').textContent  = `"${b.quote}"`;
  document.getElementById('bookModalMemo').textContent   = b.memo;
  show(bookModal); document.body.style.overflow = 'hidden';
}
document.getElementById('bookModalClose').addEventListener('click', () => { hide(bookModal); document.body.style.overflow = ''; });
bookModal.addEventListener('click', e => { if (e.target === bookModal) { hide(bookModal); document.body.style.overflow = ''; } });

/* ── 사진 업로드 (Storage) ── */
async function loadPhotos() {
  try {
    const [ps, gs] = await Promise.all([dbGetAll('photos'), dbGetAll('gallery')]);
    PHOTO_DATA = ps; GALLERY_DATA = gs;
    renderPhotoGrid(); renderProfileGallery(); updateAllCounts();
  } catch (e) { console.error(e); }
}

function renderPhotoGrid() {
  const g = document.getElementById('photoGrid'); if (!g) return;
  if (!PHOTO_DATA.length) { g.innerHTML = `<div class="photo-empty"><p>아직 사진이 없어요 📷</p><p style="font-size:.78rem;color:var(--text-faint);margin-top:6px;">편집 모드 → ＋ 사진</p></div>`; return; }
  g.innerHTML = PHOTO_DATA.map((p, i) => `<div class="photo-item" data-index="${i}"><div class="admin-item-btns"><button class="admin-del-btn" data-pid="${p.id}">🗑️</button></div><img src="${p.url}" alt="${p.caption || ''}" loading="lazy">${p.caption ? `<p class="photo-caption">${p.caption}</p>` : ''}</div>`).join('');
  g.querySelectorAll('.photo-item').forEach(item => { item.addEventListener('click', e => { if (e.target.closest('.admin-item-btns')) return; openLightbox(PHOTO_DATA, parseInt(item.dataset.index)); }); });
  g.querySelectorAll('.admin-del-btn').forEach(b => { b.addEventListener('click', async e => { e.stopPropagation(); if (!confirm('삭제할까요?')) return; await dbDel('photos', b.dataset.pid); PHOTO_DATA = PHOTO_DATA.filter(p => p.id !== b.dataset.pid); renderPhotoGrid(); updateAllCounts(); updateRecentTicker(); toast('🗑️ 삭제'); }); });
}

function renderProfileGallery() {
  const g = document.getElementById('profileGalleryGrid'); if (!g) return;
  if (!GALLERY_DATA.length) { g.innerHTML = `<div class="photo-empty"><p>갤러리 사진이 없어요</p><p style="font-size:.78rem;color:var(--text-faint);margin-top:6px;">편집 모드 → ＋ 갤러리</p></div>`; return; }
  g.innerHTML = GALLERY_DATA.map((p, i) => `<div class="photo-item" data-index="${i}"><div class="admin-item-btns"><button class="admin-del-btn" data-gid="${p.id}">🗑️</button></div><img src="${p.url}" alt="" loading="lazy"></div>`).join('');
  g.querySelectorAll('.photo-item').forEach(item => { item.addEventListener('click', e => { if (e.target.closest('.admin-item-btns')) return; openLightbox(GALLERY_DATA, parseInt(item.dataset.index)); }); });
  g.querySelectorAll('.admin-del-btn').forEach(b => { b.addEventListener('click', async e => { e.stopPropagation(); if (!confirm('삭제할까요?')) return; await dbDel('gallery', b.dataset.gid); GALLERY_DATA = GALLERY_DATA.filter(p => p.id !== b.dataset.gid); renderProfileGallery(); toast('🗑️ 삭제'); }); });
}

async function uploadPhoto(file, caption, col) {
  showUploadProgress(file.name);
  try {
    const { url, path } = await uploadFile(file, col, p => updateUploadProgress(p));
    hideUploadProgress();
    const np = { id: (col === 'photos' ? 'p' : 'g') + uid(), url, path, caption: caption || '' };
    await dbSet(col, np.id, np);
    if (col === 'photos') { PHOTO_DATA.unshift(np); renderPhotoGrid(); updateAllCounts(); updateRecentTicker(); }
    else { GALLERY_DATA.unshift(np); renderProfileGallery(); }
    toast('📷 업로드 완료!');
  } catch (e) { hideUploadProgress(); toast('❌ 업로드 실패. Storage 규칙을 확인해주세요.', 'error'); console.error(e); }
}

document.getElementById('admAddPhoto').addEventListener('click', () => { openEditModal('📷 사진 추가', [{ label: '캡션 (선택)', key: 'caption', type: 'text', placeholder: '사진 설명' }], r => pickFile('image/*', file => uploadPhoto(file, r.caption, 'photos'))); });
document.getElementById('admAddGallery').addEventListener('click', () => { openEditModal('🖼️ 갤러리 사진 추가', [{ label: '캡션 (선택)', key: 'caption', type: 'text', placeholder: '사진 설명' }], r => pickFile('image/*', file => uploadPhoto(file, r.caption, 'gallery'))); });

/* ── 라이트박스 ── */
function openLightbox(data, index) {
  lightboxData = data; lightboxIndex = index;
  document.getElementById('lightboxImg').src = data[index].url;
  document.getElementById('lightboxCaption').textContent = data[index].caption || '';
  show(document.getElementById('lightboxModal')); document.body.style.overflow = 'hidden';
}
function closeLightbox() { hide(document.getElementById('lightboxModal')); document.body.style.overflow = ''; }
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxModal').addEventListener('click', e => { if (e.target === document.getElementById('lightboxModal')) closeLightbox(); });
document.getElementById('lightboxPrev').addEventListener('click', () => { lightboxIndex = (lightboxIndex - 1 + lightboxData.length) % lightboxData.length; document.getElementById('lightboxImg').src = lightboxData[lightboxIndex].url; document.getElementById('lightboxCaption').textContent = lightboxData[lightboxIndex].caption || ''; });
document.getElementById('lightboxNext').addEventListener('click', () => { lightboxIndex = (lightboxIndex + 1) % lightboxData.length; document.getElementById('lightboxImg').src = lightboxData[lightboxIndex].url; document.getElementById('lightboxCaption').textContent = lightboxData[lightboxIndex].caption || ''; });

/* ── 프로필 갤러리 모달 ── */
document.getElementById('profileGalleryClose').addEventListener('click', () => { hide(document.getElementById('profileGalleryModal')); document.body.style.overflow = ''; });
document.getElementById('profileGalleryModal').addEventListener('click', e => { if (e.target === document.getElementById('profileGalleryModal')) { hide(document.getElementById('profileGalleryModal')); document.body.style.overflow = ''; } });

/* ── 검색 ── */
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchResultsList = document.getElementById('searchResultsList');

document.getElementById('searchToggle').addEventListener('click', () => { searchBar.classList.toggle('open'); searchBar.classList.contains('open') ? searchInput.focus() : closeSearch(); });
document.getElementById('searchClose').addEventListener('click', () => { searchBar.classList.remove('open'); closeSearch(); });
function closeSearch() { searchInput.value = ''; hide(searchResults); }
function performSearch(q) {
  if (!q.trim()) { hide(searchResults); return; }
  const ql = q.toLowerCase(), r = [];
  VIDEO_DATA.forEach(v => { if (v.title.toLowerCase().includes(ql) || v.tags.some(t => t.toLowerCase().includes(ql))) r.push({ type: '영상', title: v.title, id: v.id, kind: 'video' }); });
  WRITING_DATA.forEach(w => { if (w.title.toLowerCase().includes(ql) || w.tags.some(t => t.toLowerCase().includes(ql))) r.push({ type: '글', title: w.title, id: w.id, kind: 'writing' }); });
  BOOK_DATA.forEach(b => { if (b.title.toLowerCase().includes(ql) || b.author.toLowerCase().includes(ql)) r.push({ type: '책', title: `${b.title} — ${b.author}`, id: b.id, kind: 'book' }); });
  searchResultsList.innerHTML = r.length === 0 ? '<p style="font-size:.82rem;color:var(--text-faint);padding:8px 0;">검색 결과가 없습니다.</p>' : r.map(x => `<div class="search-result-item" data-kind="${x.kind}" data-id="${x.id}"><span class="search-result-type">${x.type}</span><span class="search-result-title">${x.title}</span></div>`).join('');
  searchResultsList.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const { kind, id } = item.dataset; closeSearch(); searchBar.classList.remove('open');
      if (kind === 'video')   { show(folderPanels.video); folderPanels.video.scrollIntoView({ behavior: 'smooth' }); }
      if (kind === 'writing') { show(folderPanels.writing); folderPanels.writing.scrollIntoView({ behavior: 'smooth' }); setTimeout(() => openWritingModal(id), 300); }
      if (kind === 'book')    { document.getElementById('bookshelf').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => openBookModal(id), 500); }
    });
  });
  show(searchResults);
}
let searchTimer;
searchInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => performSearch(searchInput.value), 200); });

/* ── ESC ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const editModal = document.getElementById('editModal');
  if (editModal) { editModal.remove(); document.body.style.overflow = ''; }
  else if (document.getElementById('lightboxModal').classList.contains('open')) closeLightbox();
  else if (bookModal.classList.contains('open')) { hide(bookModal); document.body.style.overflow = ''; }
  else if (writingModal.classList.contains('open')) { hide(writingModal); document.body.style.overflow = ''; }
  else if (document.getElementById('profileGalleryModal').classList.contains('open')) { hide(document.getElementById('profileGalleryModal')); document.body.style.overflow = ''; }
  else if (searchBar.classList.contains('open')) { searchBar.classList.remove('open'); closeSearch(); }
});

/* ── 메인 초기화 ── */
document.getElementById('footerYear').textContent = new Date().getFullYear();

async function init() {
  showLoading();
  try {
    await Promise.all([
      seedIfEmpty('videos', SEED_VIDEOS),
      seedIfEmpty('writings', SEED_WRITINGS),
      seedIfEmpty('books', SEED_BOOKS),
    ]);
    const [videos, writings, books] = await Promise.all([
      dbGetAll('videos'), dbGetAll('writings'), dbGetAll('books'),
    ]);
    VIDEO_DATA = videos; WRITING_DATA = writings; BOOK_DATA = books;
    renderVideos(); renderWritings(); renderBookshelf();
    updateAllCounts(); updateRecentTicker();
    updateScrollProgress();
    document.querySelectorAll('[data-reveal]').forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('revealed'); });
  } catch (e) { console.error('초기화 오류:', e); toast('❌ 로드 실패. 새로고침 해주세요.', 'error'); }
  finally { hideLoading(); }
}

Promise.all([loadProfile(), loadSns(), loadPhotos(), loadTracks(), loadInterests()]);
init();
