# 배포 안내

## 한 번에 배포

```bash
cd ~/Downloads \
&& rm -rf SURYUNGGIL_COMMAENG \
&& unzip -qo NEURON_MEMO_LATEST.zip \
&& cd SURYUNGGIL_COMMAENG \
&& bash publish.sh
```

`publish.sh`는 먼저 `bash tests/release_check.sh`를 실행한다. 검사를 통과한 경우에만 GitHub 저장소 생성 또는 갱신, 커밋, 푸시, Pages 설정을 진행한다.

## 저장소 이름 변경

기본 저장소는 `neuron-memo`다.

```bash
SURYUNGGIL_REPO_NAME=suryunggil-commaeng bash publish.sh
```

## 주소

```text
https://<GitHub아이디>.github.io/<저장소이름>/
https://<GitHub아이디>.github.io/<저장소이름>/v094.html
```

## 주의

- 배포 전에 기존 데이터 JSON 백업을 권장한다.
- PC↔모바일 데이터 연동은 아직 포함되지 않는다.
