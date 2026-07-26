const { performance } = require('node:perf_hooks');

const SEARCH_NOTES = 50000;
const GRAPH_NOTES = 120;
const SEARCH_LIMIT_MS = 2500;
const GRAPH_LIMIT_MS = 1500;

function makeNote(i) {
  return {
    id: `n${i}`,
    title: `프로젝트 ${i} 자동화 조사`,
    body: [
      '상품', '시장', '가격', '메모', '반복',
      `분류${i % 80}`,
      `주제${i % 240}`,
      i % 7 === 0 ? '중요' : '일반',
      i % 11 === 0 ? '미완료' : '완료'
    ].join(' ')
  };
}

const notes = Array.from({ length: SEARCH_NOTES }, (_, i) => makeNote(i));

const searchStart = performance.now();
const queryTerms = ['자동화', '중요'];
const searchResults = notes.filter(note => {
  const text = `${note.title} ${note.body}`.toLowerCase();
  return queryTerms.every(term => text.includes(term));
}).slice(0, 160);
const searchMs = performance.now() - searchStart;

if (!searchResults.length) throw new Error('검색 결과가 없습니다.');
if (searchResults.length > 160) throw new Error('목록 제한이 적용되지 않았습니다.');
if (searchMs > SEARCH_LIMIT_MS) {
  throw new Error(`검색 성능 한도 초과: ${searchMs.toFixed(1)}ms`);
}

const graphSource = notes.slice(0, GRAPH_NOTES);
const graphStart = performance.now();
const inverted = new Map();
for (const note of graphSource) {
  const tokens = new Set(note.body.split(/\s+/).filter(token => token.length >= 2));
  for (const token of tokens) {
    if (!inverted.has(token)) inverted.set(token, []);
    inverted.get(token).push(note.id);
  }
}

const pairs = new Map();
for (const [token, ids] of inverted) {
  if (ids.length < 2 || ids.length > Math.max(16, Math.floor(graphSource.length * 0.35))) continue;
  const cap = Math.min(ids.length, 24);
  for (let i = 0; i < cap; i++) {
    for (let j = i + 1; j < cap; j++) {
      const key = ids[i] < ids[j] ? `${ids[i]}|${ids[j]}` : `${ids[j]}|${ids[i]}`;
      const item = pairs.get(key) || { score: 0, reasons: [] };
      item.score += 1;
      if (item.reasons.length < 5) item.reasons.push(token);
      pairs.set(key, item);
    }
  }
}
const graphMs = performance.now() - graphStart;

if (graphSource.length !== GRAPH_NOTES) throw new Error('그래프 상한 테스트 실패');
if (graphMs > GRAPH_LIMIT_MS) {
  throw new Error(`그래프 계산 성능 한도 초과: ${graphMs.toFixed(1)}ms`);
}

const payload = JSON.stringify({ schemaVersion: 9, notes });
if (payload.length <= 0) throw new Error('백업 직렬화 실패');

console.log(
  `performance PASS | search=${SEARCH_NOTES.toLocaleString()} notes ${searchMs.toFixed(1)}ms | ` +
  `graph=${GRAPH_NOTES} notes ${graphMs.toFixed(1)}ms | pairs=${pairs.size.toLocaleString()}`
);
