# 네온 레트로 팩맨라이크 웹게임 개발 계획 (React + Canvas + TypeScript)

## 요약

- 목표: 고전 팩맨 구조를 기반으로, 전술형 특수 아이템 3종을 추가한 네온사인 스타일 웹게임을 제작하고 GitHub 업로드 및 Vercel Preview 배포까지 완료합니다.
- 확정사항: React + Canvas, TypeScript, 중간 규모 MVP, 데스크톱 키보드 우선, 최고점 저장(localStorage), 한국어 우선 문서/텍스트, Vercel은 CLI 경로.
- 작업 방식: develop-web-game 루프(작게 구현 → Playwright 검증 반복) + vercel-deploy 배포 절차를 적용합니다.

## 범위 및 완료 기준

- 포함 범위: 1개 핵심 스테이지, 라운드 기반 난이도 상승, 유령 AI 2~3종 행동 패턴, 특수 아이템 3종, 점수/목숨/클리어/게임오버, 네온 UI, 최고점 저장, README, GitHub 푸시, Vercel preview URL 확보.
- 제외 범위: 멀티플레이, 계정/클라우드 저장, 복수 맵 에디터, 모바일 터치 조작, 프로덕션 배포.
- 완료 기준: 로컬 실행/테스트 통과, 주요 시나리오 플레이 가능, 배포 URL 접속 가능, 저장소에 빌드/실행/배포 문서 포함.

## 게임 설계 명세

- 기본 규칙: 미로 내 도트를 수집하며 유령 회피, 목숨 소진 시 게임오버, 라운드 목표 달성 시 다음 라운드로 진입.
- 라운드 구조: 동일 맵 사용 + 라운드 상승 시 유령 속도/스폰 간격/아이템 등장 확률 조정.
- 특수 아이템 3종:

1. Neon Freeze: 4초간 유령 속도 50% 감소.
2. Phase Dash: 1.2초간 벽 관통 대시 가능(쿨다운 10초).
3. Combo Beacon: 6초간 연속 도트 획득 시 점수 배수(최대 x3).

- 승패 규칙: 라운드 목표 점수 달성 시 클리어, 목숨 0이면 종료, 최고점은 로컬 저장.
- 비주얼 방향: 네온 청록/핑크/라임 중심, CRT 그레인/글로우/라인 스캔 느낌, 가독성 높은 픽셀/테크 폰트 사용.

## 기술 아키텍처

- 스택: Vite + React + TypeScript + Canvas 2D.
- 상태 구조: React는 화면/메뉴/HUD 담당, 실시간 게임 상태는 GameEngine 클래스가 관리.
- 렌더링: 고정 가상 해상도 기반(Canvas 내부 스케일링)로 데스크톱/모바일 반응형 대응.
- 입력: 키보드 매핑(방향키/WASD, Q/E/Space 스킬), 포커스 이슈 대비 입력 버퍼 처리.
- 저장: localStorage 키 1개(neon_maze_high_score)로 최고점 유지.

## 공개 API/인터페이스/타입 변경(신규)

- 브라우저 디버그/자동테스트 훅:
    - window.render_game_to_text(): string
    - window.advanceTime(ms: number): void
- 핵심 타입(신규):
    - [types.ts](app://-/index.html# "/Users/yongkim/Documents/Dev/Codex/codex_test/src/game/types.ts")의 GameState, PlayerState, GhostState, ItemState, EffectState, RoundConfig.
- 엔진 인터페이스(신규):
    - [GameEngine.ts](app://-/index.html# "/Users/yongkim/Documents/Dev/Codex/codex_test/src/game/GameEngine.ts")의 update(dt), render(ctx), handleInput(input), reset().
- UI 계약(신규):
    - [HUD.tsx](app://-/index.html# "/Users/yongkim/Documents/Dev/Codex/codex_test/src/ui/HUD.tsx")는 점수/목숨/쿨다운/라운드 표시를 엔진 스냅샷으로만 렌더링.

## 구현 순서 (의사결정 완료형)

1. 프로젝트 부트스트랩.
    - npm create vite@latest(React+TS), 기본 lint/format 스크립트 확정.
    - [progress.md](app://-/index.html# "/Users/yongkim/Documents/Dev/Codex/codex_test/progress.md") 생성 및 원문 프롬프트 기록.
    - 결과물: 실행 가능한 기본 앱 + 빈 캔버스.
2. 코어 게임 루프/맵/이동 구현.
    - 고정 타일맵, 충돌, 플레이어 이동, 도트 수집, 점수 반영 구현.
    - window.render_game_to_text, window.advanceTime 동시 구현.
    - 결과물: “이동+수집+점수”가 동작하는 최소 플레이 루프.
3. 유령 AI/게임 상태 전이 구현.
    - 순찰/추적 혼합 행동, 충돌 시 목숨 감소, 무적 프레임, 라운드 시작/클리어/게임오버 상태.
    - 결과물: 승패 가능한 단일 라운드 게임.
4. 특수 아이템 시스템 구현.
    - 스폰 로직, 획득 처리, 지속효과/쿨다운 시스템, HUD 연동.
    - Neon Freeze, Phase Dash, Combo Beacon 순서로 추가.
    - 결과물: 전술 판단이 필요한 확장 규칙 완성.
5. 네온 레트로 UI/연출 구현.
    - 메뉴/스타트/일시정지/게임오버 화면, 네온 타이포, 글로우/스캔라인, 이펙트 폴리시 적용.
    - 결과물: 요청한 레트로 네온 톤의 일관된 플레이 화면.
6. 테스트 자동화 루프 실행.
    - develop-web-game 스킬 기준으로 Playwright 액션 버스트 테스트 반복.
    - 스크린샷/텍스트 상태/콘솔 에러 확인 후 이슈 수정.
    - 결과물: 핵심 시나리오 안정화 및 회귀 체크 완료.
7. GitHub 정리 및 업로드.
    - Git 초기화, .gitignore, README(한국어 우선), 실행/빌드/배포 절차 문서화.
    - 사용자 GitHub 원격 저장소 연결 후 main 푸시.
    - 결과물: 협업 가능한 공개/비공개 저장소 상태.
8. Vercel Preview 배포.

- vercel CLI 설치, vercel login, 프로젝트 링크, preview 배포(vercel deploy -y).
- 배포 URL 공유 및 재배포 명령 문서화.
- 결과물: 접근 가능한 preview 링크.

## 테스트 케이스 및 수용 기준

1. 이동/충돌.
    - 벽 통과 불가, 대시 중 벽 관통 가능, 경계 이동 정상.
    - 수용 기준: 위치/속도/충돌 상태가 render_game_to_text와 화면에서 일치.
2. 점수/라운드.
    - 도트 수집 점수 증가, 배수 적용/해제 정상, 목표 점수 달성 시 라운드 전환.
    - 수용 기준: 라운드 전환 시 상태 초기화 정책(목숨 유지, 맵 리셋)이 명세대로 동작.
3. 아이템 효과.
    - 3종 아이템의 발동 조건, 지속시간, 쿨다운, 중첩 규칙 검증.
    - 수용 기준: 중복 발동/동시 종료 타이밍 버그 없음.
4. 생존/종료.
    - 유령 충돌 시 목숨 감소, 무적 프레임 적용, 목숨 0 게임오버.
    - 수용 기준: HUD/내부 상태/텍스트 출력이 모두 동일.
5. 저장/복원.
    - 최고점 갱신 및 새로고침 후 유지.
    - 수용 기준: localStorage 손상 시 안전한 기본값 복구.
6. 배포 스모크.

- npm run build 성공, preview URL 접속 시 첫 화면과 플레이 시작 가능.
- 수용 기준: 치명적 콘솔 에러 없음.