# Implementation Plan 002: 인플루언서 정보 등록

## 개요
- **InfluencerProfileForm (`src/features/onboarding/components/influencer-profile-form.tsx`)**: 인플루언서 상세 정보 입력 및 채널 CRUD UI.
- **useInfluencerProfileQuery (`src/features/onboarding/hooks/useInfluencerProfileQuery.ts`)**: 프로필/채널 데이터를 조회하는 React Query 훅.
- **useUpsertInfluencerProfileMutation (`src/features/onboarding/hooks/useUpsertInfluencerProfileMutation.ts`)**: 프로필 및 채널 저장을 처리하는 mutation 훅.
- **influencerSchema (`src/features/onboarding/backend/schema.ts`)**: 인플루언서 프로필/채널 요청·응답 스키마.
- **influencerService (`src/features/onboarding/backend/service.ts`)**: 프로필 upsert, 채널 추가/갱신, 검증 상태 초기화를 수행.
- **influencerRoute (`src/features/onboarding/backend/route.ts`)**: GET/PUT 엔드포인트 등록.
- **onboardingChannelValidator (`src/features/onboarding/lib/channel-validator.ts`)**: 채널 URL 정규화 로직 공유 모듈.

## Diagram
```mermaid
graph TD
  Form[InfluencerProfileForm]
  QueryHook[useInfluencerProfileQuery]
  MutHook[useUpsertInfluencerProfileMutation]
  API[@/lib/remote/api-client]
  Route[influencerRoute]
  Service[influencerService]
  Schema[influencerSchema]
  Validator[onboardingChannelValidator]
  DB[(Supabase Tables)]

  Form --> QueryHook --> API --> Route
  Form --> MutHook --> API
  Route --> Schema
  Route --> Service --> DB
  Service --> Validator
  Schema --> QueryHook
  Schema --> MutHook
```

## Implementation Plan
1. **influencerSchema**
   - 작업: 프로필 조회/업데이트, 채널 배열 스키마 정의 (생년월일, 허용된 채널 유형, 상태 필드 포함).
   - 테스트: `src/features/onboarding/backend/__tests__/influencer-schema.test.ts`에서 성공/실패 케이스 단위 테스트.
2. **onboardingChannelValidator**
   - 작업: 채널 URL 정규화 및 유형별 패턴 매칭 유틸 작성.
   - 테스트: `src/features/onboarding/lib/__tests__/channel-validator.test.ts`에서 각 채널 유형별 유효/무효 사례 검증.
3. **influencerService**
   - 작업: Supabase 트랜잭션 흐름 설계(프로필 upsert 후 채널 upsert), 검증 상태를 `pending`으로 초기화.
   - 테스트: `src/features/onboarding/backend/__tests__/influencer-service.test.ts`에서 프로필 신규/갱신, 중복 채널, 잘못된 유형 에러 처리 검증.
4. **influencerRoute**
   - 작업: `GET /onboarding/influencer`와 `PUT /onboarding/influencer` 라우트 등록, user context에서 userId 추출.
   - 테스트: `src/features/onboarding/backend/__tests__/influencer-route.test.ts`에서 인증 누락/성공 흐름 검증.
5. **useInfluencerProfileQuery**
   - 작업: React Query `useQuery` 구현, 스키마 타입 사용, stale time 및 error handling 정의.
   - QA 시나리오: 로딩 상태/에러 토스트/비어 있는 데이터 처리 확인.
6. **useUpsertInfluencerProfileMutation**
   - 작업: mutation 구성, 성공 시 `invalidateQueries` 적용, 에러 메시지 처리.
   - QA 시나리오: 저장 성공 후 상태 갱신, 실패 시 메시지 표시 확인.
7. **InfluencerProfileForm**
   - 작업: `react-hook-form` + `zodResolver`로 폼 구성, 채널 추가/삭제 UI, 오토포커스.
   - QA 시트:
     - 빈 필드 제출 시 검증 메시지 확인.
     - 채널 유형/URL 조합 오류 시 메시지 확인.
     - 저장 성공 후 성공 알림 및 버튼 disable 처리 확인.
     - 다중 채널 추가/삭제 시 UI 일관성 유지.
8. **Page 통합**
   - 작업: 인플루언서 온보딩 페이지(`src/app/(protected)/onboarding/influencer/page.tsx` 예정) 생성 후 폼 배치.
   - QA 시나리오: 페이지 보호(로그인 필요) 확인, 기존 데이터 프리로드, 저장 후 이동 흐름 검증.
