# 수령길-컴맹 v0.3.2

## 메모 입력 UX
- `뭐든 적어...` 영역 클릭 → 큰 메모장 창
- `새 메모` 클릭 → 큰 메모장 창
- `이어서 기록하기` 영역 클릭 → 큰 메모장 창
- 기존 기록 `수정` → 같은 크기의 큰 수정 창
- 굵게 / 밑줄 / 글자 크기 지원
- Ctrl/Cmd + Enter 저장

## 생각 연결 직접 연결
### 생각 연결 화면
1. `직접 연결` 클릭
2. 첫 번째 메모 노드 클릭
3. 두 번째 메모 노드 클릭
4. 굵은 직접 연결선 생성

### 메모 화면
`메모 연결` → 연결할 다른 메모 체크 → `연결 저장`

## 배포
```bash
cd ~/Downloads && rm -rf SURYUNGGIL_COMMAENG && unzip -qo NEURON_MEMO_LATEST.zip && cd SURYUNGGIL_COMMAENG && bash publish.sh
```

확인:
`https://<owner>.github.io/neuron-memo/v032.html`
