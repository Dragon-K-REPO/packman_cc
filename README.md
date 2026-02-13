# 네온 레트로 팩맨

네온사인 스타일의 레트로 팩맨 웹게임. React + TypeScript + Canvas 2D로 제작.

## 실행

```bash
npm install
npm run dev
```

## 조작법

- **이동**: 방향키 / WASD
- **스킬**: Q (Phase Dash) / Space
- **일시정지**: ESC
- **시작/재시작**: Enter / Space

## 특수 아이템

| 아이템 | 효과 | 지속시간 |
|--------|------|----------|
| Neon Freeze | 유령 속도 50% 감소 | 4초 |
| Phase Dash | 벽 관통 대시 | 1.2초 (쿨다운 10초) |
| Combo Beacon | 도트 점수 배수 (최대 x3) | 6초 |

## 빌드 & 테스트

```bash
npm run build        # 프로덕션 빌드
npm run test         # 유닛 테스트 (Vitest)
npm run test:e2e     # E2E 테스트 (Playwright)
```

## 기술 스택

- Vite + React 18 + TypeScript
- Canvas 2D (네온/CRT 비주얼)
- Vitest (유닛 테스트 33개)
- Playwright (E2E 테스트 7개)
