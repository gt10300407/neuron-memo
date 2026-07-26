# 보안 검수

## 적용
- Content Security Policy
- 외부 네트워크 연결 차단: `connect-src 'none'`
- 인라인 JavaScript 제거
- GitHub PAT 입력 UI 제거
- GitHub API 실행 코드 제거
- 가져온 HTML 정화
- 허용 링크: HTTP, HTTPS, mailto
- `noopener noreferrer`
- JSON 가져오기 최대 20MB
- 최대 100,000개 메모 가져오기 안전 한도
- 중복 메모·연결 ID 정규화
- 구형 토큰 입력 페이지 제거

## 데이터 위치
메모는 현재 브라우저의 IndexedDB에 저장된다. JSON 백업 없이 브라우저 데이터나 사이트 저장 공간을 삭제하면 복구할 수 없다.

## 남은 보안 작업
v1.0 원격 연동을 구현할 때 인증 토큰을 정적 페이지에 직접 저장하지 않는 구조를 별도로 설계한다.
