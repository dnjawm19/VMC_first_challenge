# Implementation Plan 001: 회원가입 & 역할선택

## 개요
- **SignupRoleForm (`src/features/onboarding/components/signup-role-form.tsx`)**: 역할 선택을 포함한 회원가입 폼 UI와 상호작용 담당 클라이언트 컴포넌트.
- **useSignupMutation (`src/features/onboarding/hooks/useSignupMutation.ts`)**: 회원가입 요청을 처리하는 React Query 기반 훅.
- **onboardingSchema (`src/features/onboarding/backend/schema.ts`)**: 회원가입·약관·역할 저장을 위한 zod 스키마 정의.
- **onboardingService (`src/features/onboarding/backend/service.ts`)**: Supabase Auth 계정 생성 및 프로필/약관 저장 비즈니스 로직.
- **onboardingRoute (`src/features/onboarding/backend/route.ts`)**: 회원가입 API 엔드포인트 라우터.
- **onboardingDto (`src/features/onboarding/lib/dto.ts`)**: 프런트엔드에서 사용할 요청/응답 타입 재노출 모듈.
- **OnboardingConstants (`src/features/onboarding/constants/index.ts`)**: 역할, 인증 방식 등 상수 정의.

## Diagram
```mermaid
graph TD
  UI[SignupRoleForm]
  Hook[useSignupMutation]
  DTO[onboardingDto]
  APIClient[@/lib/remote/api-client]
  Route[onboardingRoute]
  Service[onboardingService]
  Schema[onboardingSchema]
  Constants[OnboardingConstants]
  Supabase[(Supabase Auth + DB)]

  UI --> Hook --> APIClient --> Route
  Route --> Schema
  Route --> Service --> Supabase
  Service --> Constants
  Schema --> DTO
  DTO --> Hook
```

## Implementation Plan
1. **OnboardingConstants**
   - 정의: 역할 목록, 인증 방식 키 등 재사용 가능한 상수 선언.
   - 테스트: 단위 테스트 불필요 (상수).
2. **onboardingSchema**
   - 작업: 회원가입 요청/응답, 약관 레코드 zod 스키마 작성.
   - 테스트: `src/features/onboarding/backend/__tests__/schema.test.ts`에 스키마 검증 유닛 테스트 작성 (정상/에러 케이스 포함).
3. **onboardingService**
   - 작업: Supabase Admin 클라이언트로 Auth 계정 생성 → `user_profiles`, `user_terms_acceptances` 저장 로직 구현, 오류 변환.
   - 테스트: `src/features/onboarding/backend/__tests__/service.test.ts`에서 Supabase 클라이언트 목킹을 통해 성공/중복 이메일/약관 미입력 시나리오 단위 테스트.
4. **onboardingRoute**
   - 작업: Hono 라우터에 POST `/onboarding/signup` 등록, 입력 검증 및 서비스 호출, 응답 규격화.
   - 테스트: `src/features/onboarding/backend/__tests__/route.test.ts`에서 Hono 테스트 유틸로 요청/응답 검증.
5. **onboardingDto**
   - 작업: 스키마 타입 재노출 및 프런트 전용 타입 제공.
   - 테스트: 타입 재사용이므로 별도 런타임 테스트 불필요.
6. **useSignupMutation**
   - 작업: `@tanstack/react-query`로 mutation 구성, `@/lib/remote/api-client` 경유, 에러 메시지 추출.
   - QA 시나리오: API 오류 메시지 표시, 성공 시 후속 동작 트리거 여부 확인.
7. **SignupRoleForm**
   - 작업: `react-hook-form`으로 폼 구성, 역할 선택/약관 체크 UI 포함, mutation 연동.
   - QA 시트:
     - 필수 입력 누락 시 클라이언트 검증 동작 여부 확인.
     - 역할/약관 미선택 시 제출 불가 여부 확인.
     - 가입 성공 시 성공 토스트 및 리다이렉션 동작.
     - API 실패 시 오류 메시지 노출.
8. **Integration**
   - 작업: `src/app/signup/page.tsx`에서 신규 컴포넌트 사용, 기존 임시 로직 제거.
   - QA 시나리오: 새 페이지 로딩, 인증 상태에 따른 리디렉션, 다국어/접근성 확인.
