# 수령길-컴맹 v0.3.1

## 긴 메모
- 긴 기록은 기본 접힘
- `펼치기 / 접기`
- 기록 목록 내부에서만 스크롤
- 긴 첫 메모 하나가 화면 전체를 먹지 않도록 수정

## 생각 연결
- 주제 ↔ 메모 연결
- 공통 단어 기반 메모 ↔ 메모 자동 연결
- 메모 상세의 `메모 연결`로 직접 연결
- 자동 연결: 점선
- 직접 연결: 굵은 선
- 연결 강도 기반 배치
- 노드에 마우스를 올리면 연결 관계 강조
- 진입 시 자동 가운데 맞춤
- 직접 연결 정보도 GitHub 동기화 데이터에 포함

## 지인 GitHub ID 기반 설치 준비

```bash
bash provision_friend.sh 지인GitHub아이디
```

네 GitHub 계정에서 프로그램/데이터 저장소를 만든 뒤 지인 GitHub ID로 이전 요청한다.
지인은 GitHub 메일에서 두 저장소 이전을 승인하면 된다.

중요: 저장소 이전은 GitHub ID만으로 가능하지만 private 저장소에 브라우저가 자동 쓰기 위해서는 별도 인증 권한이 필요하다.

## 배포

```bash
cd ~/Downloads && rm -rf SURYUNGGIL_COMMAENG && unzip -qo NEURON_MEMO_LATEST.zip && cd SURYUNGGIL_COMMAENG && bash publish.sh
```

확인:
`https://<owner>.github.io/neuron-memo/v031.html`
