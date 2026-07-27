# 수령길-컴맹 v0.9.5 — Pinch Anchor Fix

## 수정
모바일 생각 연결에서 두 손가락으로 확대할 때 그래프 위치가 확대량에 따라 같이 밀리던 문제 수정.

원인은 두 가지였다.

1. 확대할 때마다 작은 그래프를 자동으로 다시 가운데 정렬하던 clamp 로직
2. 핀치 중 두 손가락 midpoint의 미세한 움직임까지 pan으로 처리하던 로직

이제 조작 규칙은 명확하다.

- 한 손가락: 그래프 이동
- 두 손가락: **처음 잡은 위치를 고정한 채 확대/축소만**
- `가운데`: 사용자가 직접 눌렀을 때만 가운데 맞춤

## 배포
```bash
cd ~/Downloads && rm -rf SURYUNGGIL_COMMAENG && unzip -qo NEURON_MEMO_LATEST.zip && cd SURYUNGGIL_COMMAENG && bash publish.sh
```

확인:
`https://<GitHub아이디>.github.io/neuron-memo/v095.html`
