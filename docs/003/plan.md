# Implementation Plan 003: 광고주 정보 등록

## 개요
- **AdvertiserProfileForm (`src/features/onboarding/components/advertiser-profile-form.tsx`)**: 광고주 업체 정보 입력 UI.
- **useAdvertiserProfileQuery (`src/features/onboarding/hooks/useAdvertiserProfileQuery.ts`)**: 광고주 프로필 조회 훅.
- **useUpsertAdvertiserProfileMutation (`src/features/onboarding/hooks/useUpsertAdvertiserProfileMutation.ts`)**: 광고주 프로필 저장 mutation 훅.
- **advertiserSchema (`src/features/onboarding/backend/schema.ts`)**: 광고주 정보용 zod 스키마.
- **advertiserService (`src/features/onboarding/backend/service.ts`)**: 광고주 프로필 upsert 및 검증 상태 관리 로직.
- **advertiserRoute (`src/features/onboarding/backend/route.ts`)**: GET/PUT 광고주 엔드포인트 정의.
- **businessNumberValidator (`src/features/onboarding/lib/business-number-validator.ts`)**: 사업자등록번호 형식/중복 검증 유틸.

## Diagram
```mermaid
graph TD
  Form[AdvertiserProfileForm]
  QHook[useAdvertiserProfileQuery]
  MHook[useUpsertAdvertiserProfileMutation]
  API[@/lib/remote/api-client]
  Route[advertiserRoute]
  Service[advertiserService]
  Schema[advertiserSchema]
  Validator[businessNumberValidator]
  DB[(Supabase Tables)]

  Form --> QHook --> API --> Route
  Form --> MHook --> API
  Route --> Schema
  Route --> Service --> DB
  Service --> Validator
  Schema --> QHook
  Schema --> MHook
```

## Implementation Plan
1. **advertiserSchema**
   - 작업: 업체명/위치/카테고리/사업자등록번호 스키마 작성.
   - 테스트: `src/features/onboarding/backend/__tests__/advertiser-schema.test.ts`에서 필드 누락/형식 오류 케이스 검증.
2. **businessNumberValidator**
   - 작업: 사업자등록번호 정규화 및 체크섬 유효성 검증 유틸 작성.
   - 테스트: `src/features/onboarding/lib/__tests__/business-number-validator.test.ts`에서 유효/무효 번호 테스트.
3. **advertiserService**
   - 작업: 프로필 upsert, 중복 키 에러 처리, 검증 상태(`pending`) 초기화.
   - 테스트: `src/features/onboarding/backend/__tests__/advertiser-service.test.ts`에서 신규/갱신/중복 시나리오 단위 테스트.
4. **advertiserRoute**
   - 작업: `GET /onboarding/advertiser`, `PUT /onboarding/advertiser` 라우트 구현.
   - 테스트: `src/features/onboarding/backend/__tests__/advertiser-route.test.ts`에서 인증 체크 및 응답 검증.
5. **useAdvertiserProfileQuery**
   - 작업: React Query `useQuery` 구현, 로딩/에러 상태 관리.
   - QA 시나리오: 데이터 미존재 시 초기값 처리, 에러 토스트 확인.
6. **useUpsertAdvertiserProfileMutation**
   - 작업: mutation 구현, 성공 후 프로필 재요청, 에러 메시지 표시.
   - QA 시나리오: 성공 알림, 중복 번호 에러 안내 확인.
7. **AdvertiserProfileForm**
   - 작업: `react-hook-form`으로 폼 구성, 사업자번호 입력 마스킹, 저장 버튼 상태 제어.
   - QA 시트:
     - 필수 입력 누락 시 검증 메시지.
     - 사업자번호 형식 오류 시 경고.
     - 저장 성공 후 상태 메시지 및 버튼 disable 여부.
     - 검증 대기 상태 안내 문구 표시.
8. **Page 통합**
   - 작업: 광고주 온보딩 페이지(`src/app/(protected)/onboarding/advertiser/page.tsx`) 생성 및 폼 연결.
   - QA 시나리오: 권한 보호, 기존 데이터 채움, 저장 후 네비게이션 동작 확인.
