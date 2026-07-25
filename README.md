# 수령길-컴맹 v0.3.3

## 반응형 범위

- PC: 1181px 이상
- 태블릿: 761px ~ 1180px
- 모바일: 760px 이하
- 좁은 모바일: 420px 이하 추가 보정

## 이번 수정

- 모바일에서 페이지 전체가 좌우/상하로 흔들리는 현상 억제
- 외부 body 스크롤/overscroll 차단
- 필요한 목록과 메모 영역만 내부 스크롤
- iOS Safari 주소창/키보드에 따른 viewport 높이 변화 대응
- 생각 연결의 드래그/확대 동작을 SVG 내부로 격리
- 그래프를 만질 때 부모 UI가 같이 움직이는 현상 차단
- pointer capture 정리 및 resize 한 프레임 지연 처리
- 태블릿 전용 레이아웃 추가

## 배포

```bash
cd ~/Downloads && rm -rf SURYUNGGIL_COMMAENG && unzip -qo NEURON_MEMO_LATEST.zip && cd SURYUNGGIL_COMMAENG && bash publish.sh
```

확인:
`https://<owner>.github.io/neuron-memo/v033.html`
