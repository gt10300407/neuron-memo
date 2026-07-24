const initialNotes = [
  {
    id: "n1",
    title: "AI 메모 앱 아이디어",
    body: "카카오톡처럼 빠르게 기록하고 AI가 자동으로 분류, 태그, 연결해주는 개인 지식 허브 앱.",
    time: "10:42",
    created: "2026.07.24 10:42",
    category: "아이디어",
    tags: ["아이디어", "AI", "앱"],
    color: "purple",
    links: ["n4", "n5", "n6"]
  },
  {
    id: "n2",
    title: "중국 상품 소싱 조사",
    body: "1688에서 반려동물 자동 급식기 관련 키워드 정리, 단가 비교.",
    time: "10:31",
    created: "2026.07.24 10:31",
    category: "사업",
    tags: ["사업", "소싱", "1688"],
    color: "green",
    links: ["n5"]
  },
  {
    id: "n3",
    title: "민수님 견적서 보내기",
    body: "다음 주 월요일까지 모델 A/B 견적서 각각 보내기.",
    time: "09:15",
    created: "2026.07.24 09:15",
    category: "할 일",
    tags: ["할일", "민수", "견적"],
    color: "blue",
    links: []
  },
  {
    id: "n4",
    title: "유튜브 자동 방송 아이디어",
    body: "웹게임 자동 플레이 + 채팅 읽기 + AI 음성 응답 구조.",
    time: "어제",
    created: "2026.07.23 22:10",
    category: "아이디어",
    tags: ["아이디어", "자동화", "유튜브"],
    color: "purple",
    links: ["n1", "n5"]
  },
  {
    id: "n5",
    title: "GitHub를 데이터 백업으로 사용",
    body: "실제 DB는 따로 두고 메모 원본과 관계 데이터를 JSON/Markdown으로 정기 백업.",
    time: "어제",
    created: "2026.07.23 18:26",
    category: "개발",
    tags: ["개발", "GitHub", "백업"],
    color: "blue",
    links: ["n1", "n2", "n4"]
  },
  {
    id: "n6",
    title: "옵시디언 그래프 방식",
    body: "같은 카테고리, 같은 사람, 같은 프로젝트, 의미 유사도를 기반으로 자동 연결.",
    time: "어제",
    created: "2026.07.23 16:48",
    category: "개발",
    tags: ["개발", "그래프", "연결"],
    color: "blue",
    links: ["n1", "n5"]
  },
  {
    id: "n7",
    title: "커피머신 비교",
    body: "드롱기, 필립스, 브레빌 가격/기능 비교표 만들기.",
    time: "어제",
    created: "2026.07.23 12:14",
    category: "구매",
    tags: ["구매", "커피머신"],
    color: "yellow",
    links: []
  }
];

const graphNodes = [
  { id: "center", label: "AI 메모 앱", count: 18, x: 450, y: 340, r: 70, color: "#8a5cff", noteId: "n1" },
  { id: "idea", label: "아이디어", count: 12, x: 300, y: 170, r: 49, color: "#58a6ff", noteId: "n1" },
  { id: "business", label: "사업", count: 18, x: 205, y: 355, r: 47, color: "#48c774", noteId: "n2" },
  { id: "dev", label: "개발", count: 15, x: 680, y: 330, r: 48, color: "#58a6ff", noteId: "n6" },
  { id: "auto", label: "자동화", count: 9, x: 670, y: 160, r: 45, color: "#ff9f43", noteId: "n4" },
  { id: "buy", label: "구매", count: 7, x: 260, y: 545, r: 41, color: "#f2c94c", noteId: "n7" },
  { id: "personal", label: "개인", count: 8, x: 500, y: 545, r: 40, color: "#43d2c4", noteId: "n3" },
  { id: "plan", label: "구현 계획", count: 11, x: 690, y: 525, r: 43, color: "#ef5da8", noteId: "n5" },
  { id: "youtube", label: "유튜브", count: 6, x: 380, y: 600, r: 38, color: "#ff7849", noteId: "n4" }
];

const graphEdges = [
  ["center", "idea", "strong"], ["center", "business", "strong"], ["center", "dev", "strong"],
  ["center", "auto", "strong"], ["center", "personal", "weak"], ["center", "plan", "strong"],
  ["center", "youtube", "weak"], ["business", "buy", "weak"], ["dev", "plan", "strong"],
  ["auto", "youtube", "weak"], ["personal", "youtube", "weak"], ["idea", "auto", "weak"]
];

let notes = [...initialNotes];
let selectedNoteId = null;
let currentView = "inbox";

const els = {
  noteList: document.getElementById("noteList"),
  searchInput: document.getElementById("searchInput"),
  mobileSearchInput: document.getElementById("mobileSearchInput"),
  searchResults: document.getElementById("searchResults"),
  quickNoteInput: document.getElementById("quickNoteInput"),
  quickNoteSubmit: document.getElementById("quickNoteSubmit"),
  noteModal: document.getElementById("noteModal"),
  modalNoteInput: document.getElementById("modalNoteInput"),
  modalSaveButton: document.getElementById("modalSaveButton"),
  closeModalButton: document.getElementById("closeModalButton"),
  detailEmpty: document.getElementById("detailEmpty"),
  detailContent: document.getElementById("detailContent"),
  detailCategory: document.getElementById("detailCategory"),
  detailTitle: document.getElementById("detailTitle"),
  detailTags: document.getElementById("detailTags"),
  detailCreated: document.getElementById("detailCreated"),
  detailLinks: document.getElementById("detailLinks"),
  detailBody: document.getElementById("detailBody"),
  relatedList: document.getElementById("relatedList"),
  relatedCount: document.getElementById("relatedCount"),
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  toast: document.getElementById("toast"),
  sortSelect: document.getElementById("sortSelect")
};

const tagClass = (tag) => {
  if (["사업", "소싱", "1688"].includes(tag)) return "green";
  if (["개발", "GitHub", "백업", "그래프", "연결", "할일", "민수", "견적"].includes(tag)) return "blue";
  if (["구매", "커피머신"].includes(tag)) return "yellow";
  if (["자동화", "유튜브"].includes(tag)) return "orange";
  return "";
};

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function renderNotes(filterText = "") {
  const query = filterText.trim().toLowerCase();
  let filtered = notes.filter((note) => {
    if (!query) return true;
    return [note.title, note.body, note.category, ...note.tags].join(" ").toLowerCase().includes(query);
  });

  if (els.sortSelect?.value === "oldest") filtered = [...filtered].reverse();

  els.noteList.innerHTML = filtered.length
    ? `<div class="day-divider">오늘</div>` + filtered.map((note) => `
      <button class="note-card ${selectedNoteId === note.id ? "selected" : ""}" data-note-id="${note.id}" type="button">
        <div class="note-card-top">
          <h3>${escapeHtml(note.title)}</h3>
          <span class="note-time">${escapeHtml(note.time)}</span>
        </div>
        <p>${escapeHtml(note.body)}</p>
        <div class="tag-row">
          ${note.tags.map((tag) => `<span class="tag ${tagClass(tag)}">#${escapeHtml(tag)}</span>`).join("")}
        </div>
      </button>
    `).join("")
    : `<div class="detail-empty"><div class="empty-orbit">⌕</div><strong>검색 결과가 없어</strong><span>다른 단어로 찾아봐.</span></div>`;

  document.querySelectorAll(".note-card").forEach((card) => {
    card.addEventListener("click", () => selectNote(card.dataset.noteId));
  });
}

function renderSearchResults(query = "") {
  const q = query.trim().toLowerCase();
  const filtered = notes.filter((note) => !q || [note.title, note.body, note.category, ...note.tags].join(" ").toLowerCase().includes(q));
  els.searchResults.innerHTML = filtered.slice(0, 20).map((note) => `
    <article class="search-result">
      <strong>${escapeHtml(note.title)}</strong>
      <p>${escapeHtml(note.body)}</p>
    </article>
  `).join("");
}

function selectNote(noteId) {
  selectedNoteId = noteId;
  const note = notes.find((item) => item.id === noteId);
  if (!note) return;

  renderNotes(els.searchInput?.value || "");
  els.detailEmpty.classList.add("hidden");
  els.detailContent.classList.remove("hidden");
  els.detailCategory.textContent = note.category;
  els.detailTitle.textContent = note.title;
  els.detailTags.innerHTML = note.tags.map((tag) => `<span class="tag ${tagClass(tag)}">#${escapeHtml(tag)}</span>`).join("");
  els.detailCreated.textContent = note.created;
  els.detailBody.textContent = note.body;

  const related = notes.filter((item) => note.links.includes(item.id));
  els.detailLinks.textContent = `${related.length}개`;
  els.relatedCount.textContent = related.length;
  els.relatedList.innerHTML = related.length
    ? related.map((item) => `<div class="related-item"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)} · ${escapeHtml(item.time)}</span></div>`).join("")
    : `<div class="related-item"><span>아직 연결된 메모가 없어.</span></div>`;

  highlightGraphForNote(noteId);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add("hidden"), 1600);
}

function createNote(rawText) {
  const text = rawText.trim();
  if (!text) {
    showToast("메모 내용을 입력해.");
    return;
  }

  const now = new Date();
  const firstLine = text.split(/\n/)[0].trim();
  const title = firstLine.length > 34 ? `${firstLine.slice(0, 34)}…` : firstLine;
  const keywords = [];
  if (/사업|판매|소싱|마켓/.test(text)) keywords.push("사업");
  if (/개발|코드|앱|웹|API|GitHub/i.test(text)) keywords.push("개발");
  if (/AI|인공지능|LLM/i.test(text)) keywords.push("AI");
  if (/자동|자동화/.test(text)) keywords.push("자동화");
  const tags = keywords.length ? [...new Set(keywords)].slice(0, 3) : ["메모"];

  const note = {
    id: `n${Date.now()}`,
    title,
    body: text,
    time: now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }),
    created: now.toLocaleString("ko-KR"),
    category: tags[0] === "사업" ? "사업" : tags[0] === "개발" ? "개발" : "아이디어",
    tags,
    color: "purple",
    links: ["n1"]
  };

  notes.unshift(note);
  els.quickNoteInput.value = "";
  els.modalNoteInput.value = "";
  closeModal();
  renderNotes(els.searchInput?.value || "");
  renderSearchResults(els.mobileSearchInput?.value || "");
  selectNote(note.id);
  showToast("메모를 저장했어.");
}

function openModal() {
  els.noteModal.classList.remove("hidden");
  requestAnimationFrame(() => els.modalNoteInput.focus());
}

function closeModal() {
  els.noteModal.classList.add("hidden");
}

const viewMeta = {
  inbox: ["인박스", "모든 생각을 한곳에"],
  graph: ["뇌 지도", "생각의 연결을 탐색"],
  search: ["검색", "기억을 다시 찾기"],
  review: ["다시 보기", "묻힌 생각을 다시 꺼내기"]
};

function switchView(view) {
  currentView = view;
  document.querySelectorAll(".view-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  els.pageTitle.textContent = viewMeta[view][0];
  els.pageSubtitle.textContent = viewMeta[view][1];
  if (view === "search") {
    renderSearchResults(els.mobileSearchInput?.value || "");
    setTimeout(() => els.mobileSearchInput?.focus(), 80);
  }
}

function renderGraph(svgId, edgesId, nodesId, isMobile = false) {
  const svg = document.getElementById(svgId);
  const edgeGroup = document.getElementById(edgesId);
  const nodeGroup = document.getElementById(nodesId);
  if (!svg || !edgeGroup || !nodeGroup) return;

  edgeGroup.innerHTML = graphEdges.map(([a, b, strength]) => {
    const na = graphNodes.find((n) => n.id === a);
    const nb = graphNodes.find((n) => n.id === b);
    return `<line class="edge ${strength}" data-edge="${a}-${b}" x1="${na.x}" y1="${na.y}" x2="${nb.x}" y2="${nb.y}" />`;
  }).join("");

  nodeGroup.innerHTML = graphNodes.map((node) => `
    <g class="node" data-graph-node="${node.id}" data-note-id="${node.noteId}" transform="translate(${node.x} ${node.y})">
      <circle r="${node.r}" fill="${node.color}16" stroke="${node.color}" />
      <text y="-2" font-size="${node.r > 50 ? 19 : 15}">${escapeHtml(node.label)}</text>
      <text class="count" y="${node.r > 50 ? 22 : 19}" font-size="11">${node.count}</text>
    </g>
  `).join("");

  nodeGroup.querySelectorAll(".node").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      const nodeId = node.dataset.graphNode;
      const noteId = node.dataset.noteId;
      highlightGraph(nodeId);
      if (isMobile) {
        const graphNode = graphNodes.find((item) => item.id === nodeId);
        const note = notes.find((item) => item.id === noteId);
        const info = document.getElementById("mobileNodeInfo");
        info.innerHTML = `<strong>${escapeHtml(graphNode.label)}</strong><br>${note ? escapeHtml(note.body) : "연결된 메모를 탐색 중이야."}`;
      } else if (noteId) {
        selectNote(noteId);
      }
    });
  });

  attachPanZoom(svg);
}

function highlightGraph(nodeId) {
  const relatedNodeIds = new Set([nodeId]);
  graphEdges.forEach(([a, b]) => {
    if (a === nodeId) relatedNodeIds.add(b);
    if (b === nodeId) relatedNodeIds.add(a);
  });

  document.querySelectorAll("[data-graph-node]").forEach((node) => {
    const id = node.dataset.graphNode;
    node.classList.toggle("active", id === nodeId);
    node.classList.toggle("dim", !relatedNodeIds.has(id));
  });
}

function highlightGraphForNote(noteId) {
  const graphNode = graphNodes.find((node) => node.noteId === noteId);
  if (graphNode) highlightGraph(graphNode.id);
}

function resetGraphHighlight() {
  document.querySelectorAll("[data-graph-node]").forEach((node) => node.classList.remove("active", "dim"));
}

function attachPanZoom(svg) {
  let viewBox = { x: 0, y: 0, w: 900, h: 700 };
  let dragging = false;
  let start = null;

  const apply = () => svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
  apply();

  svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoom = event.deltaY > 0 ? 1.08 : 0.92;
    const nextW = Math.min(1400, Math.max(430, viewBox.w * zoom));
    const nextH = nextW * (700 / 900);
    viewBox.x += (viewBox.w - nextW) / 2;
    viewBox.y += (viewBox.h - nextH) / 2;
    viewBox.w = nextW;
    viewBox.h = nextH;
    apply();
  }, { passive: false });

  svg.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".node")) return;
    dragging = true;
    start = { x: event.clientX, y: event.clientY, vx: viewBox.x, vy: viewBox.y };
    svg.setPointerCapture?.(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragging || !start) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    viewBox.x = start.vx - (event.clientX - start.x) * scaleX;
    viewBox.y = start.vy - (event.clientY - start.y) * scaleY;
    apply();
  });
  const stop = () => { dragging = false; start = null; };
  svg.addEventListener("pointerup", stop);
  svg.addEventListener("pointercancel", stop);

  svg._resetViewBox = () => {
    viewBox = { x: 0, y: 0, w: 900, h: 700 };
    apply();
    resetGraphHighlight();
  };
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll(".mini-filter").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter || "";
    els.searchInput.value = filter;
    renderNotes(filter);
    showToast(`#${filter} 필터`);
  });
});

document.querySelectorAll(".search-suggestions button").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.textContent.replace("완료 안 한 할 일", "할일").replace(" 관련 메모", "");
    els.mobileSearchInput.value = value;
    renderSearchResults(value);
  });
});

document.getElementById("newNoteDesktop").addEventListener("click", openModal);
document.getElementById("newNoteMobile").addEventListener("click", openModal);
els.closeModalButton.addEventListener("click", closeModal);
els.noteModal.addEventListener("click", (event) => {
  if (event.target === els.noteModal) closeModal();
});
els.modalSaveButton.addEventListener("click", () => createNote(els.modalNoteInput.value));
els.quickNoteSubmit.addEventListener("click", () => createNote(els.quickNoteInput.value));
els.quickNoteInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    createNote(els.quickNoteInput.value);
  }
});
els.quickNoteInput.addEventListener("input", () => {
  els.quickNoteInput.style.height = "auto";
  els.quickNoteInput.style.height = `${Math.min(150, els.quickNoteInput.scrollHeight)}px`;
});
els.searchInput.addEventListener("input", () => renderNotes(els.searchInput.value));
els.mobileSearchInput.addEventListener("input", () => renderSearchResults(els.mobileSearchInput.value));
els.sortSelect.addEventListener("change", () => renderNotes(els.searchInput.value));

document.getElementById("focusGraphButton").addEventListener("click", () => {
  if (window.innerWidth <= 820) switchView("graph");
  else document.body.classList.toggle("focus-mode");
});
document.getElementById("themeButton").addEventListener("click", () => {
  document.body.classList.toggle("focus-mode");
  showToast(document.body.classList.contains("focus-mode") ? "집중 화면" : "기본 화면");
});

document.getElementById("resetGraphButton").addEventListener("click", () => {
  document.getElementById("brainGraph")._resetViewBox?.();
});
document.querySelector("[data-action='reset-mobile-graph']").addEventListener("click", () => {
  document.getElementById("mobileBrainGraph")._resetViewBox?.();
});
document.querySelectorAll("[data-graph-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-graph-filter]").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    const strongOnly = button.dataset.graphFilter === "strong";
    document.querySelectorAll("#graphEdges .edge").forEach((edge) => {
      edge.style.display = strongOnly && !edge.classList.contains("strong") ? "none" : "";
    });
  });
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (window.innerWidth <= 820) {
      switchView("search");
    } else {
      els.searchInput.focus();
    }
  }
  if (event.key === "Escape") closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !els.noteModal.classList.contains("hidden")) {
    createNote(els.modalNoteInput.value);
  }
});

renderNotes();
renderSearchResults();
renderGraph("brainGraph", "graphEdges", "graphNodes");
renderGraph("mobileBrainGraph", "mobileGraphEdges", "mobileGraphNodes", true);
selectNote("n1");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
