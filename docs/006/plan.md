# Implementation Plan 006: 체험단 지원

## 개요
- **CampaignApplicationForm (`src/features/campaigns/components/campaign-application-form.tsx`)**: 각오 한마디 및 방문 예정일 입력 UI.
- **useCampaignApplicationMutation (`src/features/campaigns/hooks/useCampaignApplicationMutation.ts`)**: 지원 제출 mutation 훅.
- **campaignApplicationSchema (`src/features/campaigns/backend/schema.ts`)**: 지원 요청/응답 스키마.
- **campaignApplicationService (`src/features/campaigns/backend/service.ts`)**: 모집 기간/중복 지원 검증 및 저장 로직.
- **campaignApplicationRoute (`src/features/campaigns/backend/route.ts`)**: `POST /campaigns/:campaignId/applications` 라우트.
- **campaignApplicationNotifier (`src/features/campaigns/lib/application-notifier.ts`)**: 성공/실패 토스트 메시지 등 프런트 공통 유틸.

## Diagram
```mermaid
graph TD
  Form[CampaignApplicationForm]
  MutHook[useCampaignApplicationMutation]
  Notifier[campaignApplicationNotifier]
  API[@/lib/remote/api-client]
  Route[campaignApplicationRoute]
  Service[campaignApplicationService]
  Schema[campaignApplicationSchema]
  DB[(campaigns + campaign_applications)]

  Form --> MutHook --> API --> Route
  MutHook --> Notifier
  Route --> Schema
  Route --> Service --> DB
  Service --> Schema
```

## Implementation Plan
1. **campaignApplicationSchema**
   - 작업: 요청(모티베이션, 방문 예정일)과 응답(지원 ID, 상태) 스키마 정의.
   - 테스트: `src/features/campaigns/backend/__tests__/application-schema.test.ts`에서 유효/무효 입력 검증.
2. **campaignApplicationService**
   - 작업: 모집 기간 내인지 확인, `campaign_applications` 중복 여부 체크 후 INSERT.
   - 테스트: `src/features/campaigns/backend/__tests__/application-service.test.ts`에서 기간 만료/중복/정상 케이스 단위 테스트.
3. **campaignApplicationRoute**
   - 작업: Hono POST 라우트 구현, 인증된 인플루언서만 접근 허용.
   - 테스트: `src/features/campaigns/backend/__tests__/application-route.test.ts`에서 권한 없는 접근, 성공 응답 검증.
4. **campaignApplicationNotifier**
   - 작업: 제출 성공/실패 메시지 상수화, toast 유틸 제공.
   - 테스트: 순수 함수로 작성 후 간단한 단위 테스트(optional) `__tests__/application-notifier.test.ts`.
5. **useCampaignApplicationMutation**
   - 작업: React Query `useMutation` 구현, 성공 시 `myApplications` 캐시 무효화.
   - QA 시나리오: 제출 로딩 상태/성공 토스트/에러 처리 확인.
6. **CampaignApplicationForm**
   - 작업: `react-hook-form` + `zodResolver` 적용, 방문 예정일 캘린더 입력, 제출 버튼 상태 관리.
   - QA 시트:
     - 빈 입력 제출 시 검증 메시지 확인.
     - 과거 날짜 선택 불가 여부.
     - 제출 성공 후 입력값 리셋 및 확인 메시지.
7. **Routing 통합**
   - 작업: `src/app/campaigns/[campaignId]/apply/page.tsx` 생성, 상세 페이지에서 이동 연결.
   - QA 시나리오: 권한 가드, 비로그인 접근 시 리다이렉트, 제출 후 내 지원 목록으로 이동여부 확인.
