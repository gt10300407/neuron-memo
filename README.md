# 수령길-컴맹 v0.2.3

변경사항:
- 프로그램 이름을 `수령길-컴맹`으로 변경
- `뇌지도`를 `생각 연결`로 변경
- 생각 연결 화면을 열 때 노드 전체를 자동으로 화면 정중앙에 맞춤
- 긴 메모 때문에 전체 페이지가 계속 길어지지 않도록 상세 기록 영역만 내부 스크롤
- 새 메모/이어쓰기/수정에 굵게(B), 밑줄(U), 글자 크기(작게/보통/크게) 추가
- 기존 v0.2.x localStorage 데이터를 그대로 읽어 기존 메모 유지

## 배포
```bash
cd ~/Downloads && rm -rf SURYUNGGIL_COMMAENG && unzip -qo NEURON_MEMO_LATEST.zip && cd SURYUNGGIL_COMMAENG && bash publish.sh
```

배포 후 우선 확인:
`https://gt10300407.github.io/neuron-memo/v023.html`
