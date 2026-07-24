# NEURON Responsive UI v0.1.0

반응형 UI 기준선 검증용 프론트엔드 프로토타입이다.

## 이 버전의 목적

- PC / 태블릿 / 모바일에서 레이아웃이 깨지지 않는지 먼저 검증
- 인박스 → 뇌 지도 → 검색 → 다시 보기의 핵심 UX 검증
- 모바일 하단 내비게이션 + 중앙 빠른 메모 버튼 검증
- SVG 그래프의 데스크톱/모바일 반응형 검증
- 아직 실제 DB/로그인/AI API는 연결하지 않음

## 실행

```bash
python3 -m http.server 8080
```

브라우저:

```text
http://localhost:8080
```

`file://`로 index.html을 직접 열어도 대부분 동작하지만 PWA/service worker 검증은 로컬 서버가 필요하다.

## 반응형 검수 기준

반드시 아래 뷰포트를 확인한다.

- 320 × 568
- 360 × 800
- 375 × 812
- 390 × 844
- 430 × 932
- 768 × 1024
- 820 × 1180
- 1024 × 768
- 1280 × 800
- 1440 × 900
- 1920 × 1080

### 통과 조건

- 가로 스크롤 없음
- 모바일에서 콘텐츠가 하단 내비게이션 뒤로 숨지 않음
- iPhone safe-area 반영
- 320px 폭에서도 메뉴/메모가 화면 밖으로 밀리지 않음
- PC 1080px 이하에서는 상세 패널 자동 제거
- PC 820px 이하부터 모바일 단일 화면 구조로 전환
- 가로모드 저높이 화면 별도 대응
- 뇌 지도는 SVG viewBox 기반으로 크기 변화에 따라 자동 적응

## 다음 단계

이 반응형 기준선을 승인한 뒤 실제 저장 계층을 붙인다.

1. Supabase/PostgreSQL 데이터 모델
2. 로그인
3. 실제 CRUD
4. 실시간 동기화
5. AI 분류/태그
6. 의미 기반 메모 연결
7. 그래프 실데이터 연결

## GitHub + Pages 원클릭 배포

이 ZIP은 `publish.sh`를 포함한다.

### 최초/업데이트 공통

다운로드 폴더에서 아래 한 줄만 실행한다.

```bash
cd ~/Downloads && rm -rf NEURON_MEMO && unzip -qo NEURON_MEMO_v0.1.1.zip && cd NEURON_MEMO && bash publish.sh
```

macOS에서 다운로드 폴더가 `~/다운로드`로 보이는 경우에도 실제 경로는 보통 `~/Downloads`다.

스크립트가 자동으로 처리하는 것:

- GitHub 로그인 상태 확인
- `neuron-memo` 공개 저장소가 없으면 생성
- 기존 저장소가 있으면 최신 `main` 이력을 이어받음
- 현재 ZIP 전체를 새 커밋으로 생성
- `main` 푸시
- GitHub Pages를 GitHub Actions 방식으로 활성화
- Pages 배포 workflow 실행
- GitHub 주소와 사이트 주소 출력

`gh auth login`이 되어 있어야 한다.
