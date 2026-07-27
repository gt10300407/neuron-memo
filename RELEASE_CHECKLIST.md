# v0.9.3 배포 체크리스트

## 자동 검사
- [ ] `bash tests/release_check.sh`
- [ ] JavaScript 문법 PASS
- [ ] 정적·보안 감사 PASS
- [ ] 50,000개 검색 성능 PASS
- [ ] 120개 그래프 계산 PASS
- [ ] publish.sh 문법 PASS

## 수동 확인
- [ ] 기존 메모 JSON 백업
- [ ] 모바일 실제 기기 확인
- [ ] 태블릿 세로·가로 확인
- [ ] 생각 연결 직접·자동 연결 확인
- [ ] 검색 날짜 문법 확인
- [ ] 다시보기 각 필터 확인
- [ ] 휴지통·복구 확인

## 배포 후
- [ ] GitHub Actions test 성공
- [ ] GitHub Pages deploy 성공
- [ ] 기본 주소 확인
- [ ] v093.html 확인
- [ ] PWA 설치 확인
- [ ] 오프라인 재접속 확인
