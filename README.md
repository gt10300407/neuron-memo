# 수령길-컴맹 v0.3.0

## GitHub PC ↔ 모바일 동기화

메모 데이터는 전용 **비공개 GitHub 저장소** `suryunggil-commaeng-data`의 `data/state.json`에 저장한다.

- PC/모바일에서 같은 GitHub 계정·저장소·Fine-grained PAT를 한 번씩 설정
- 메모 변경 후 약 2초 뒤 자동 동기화
- 30초마다 다른 기기의 변경 확인
- 메모/이어쓰기 항목은 ID 기반 병합
- 삭제 tombstone 동기화
- 토큰은 GitHub 데이터 파일에 저장하지 않고 각 기기 브라우저 localStorage에만 저장

## 지인 계정 세팅

지인이 로그인한 환경에서:

```bash
bash setup_friend_github.sh
```

그 다음 GitHub 웹에서 Fine-grained PAT 생성:

- Repository access: Only select repositories
- `suryunggil-commaeng-data` 선택
- Repository permissions → Contents → Read and write

GitHub 비밀번호를 받을 필요는 없다.

## 배포

```bash
cd ~/Downloads && rm -rf SURYUNGGIL_COMMAENG && unzip -qo NEURON_MEMO_LATEST.zip && cd SURYUNGGIL_COMMAENG && bash publish.sh
```

확인용: `https://<github-id>.github.io/neuron-memo/v030.html`
