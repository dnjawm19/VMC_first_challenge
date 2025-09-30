# Implementation Plan 005: 체험단 상세

## 개요
- **CampaignDetailSection (`src/features/campaigns/components/campaign-detail-section.tsx`)**: 체험단 상세 정보와 지원 버튼 UI.
- **useCampaignDetailQuery (`src/features/campaigns/hooks/useCampaignDetailQuery.ts`)**: 단일 캠페인 데이터 조회 훅.
- **useCampaignEligibility (`src/features/campaigns/hooks/useCampaignEligibility.ts`)**: 현재 사용자 지원 가능 여부 계산 훅.
- **campaignDetailSchema (`src/features/campaigns/backend/schema.ts`)**: 상세 응답 및 eligibility 정보 스키마.
- **campaignDetailService (`src/features/campaigns/backend/service.ts`)**: 캠페인 상세 조회 및 지원 가능 조건 계산 로직.
- **campaignDetailRoute (`src/features/campaigns/backend/route.ts`)**: `GET /campaigns/:campaignId` 라우트.
- **campaignEligibility (`src/features/campaigns/lib/eligibility.ts`)**: 인플루언서 프로필·채널 상태를 이용한 지원 가능 로직 공유 유틸.

## Diagram
```mermaid
graph TD
  Page[CampaignDetailSection]
  DetailHook[useCampaignDetailQuery]
  EligibilityHook[useCampaignEligibility]
  API[@/lib/remote/api-client]
  Route[campaignDetailRoute]
  Service[campaignDetailService]
  Schema[campaignDetailSchema]
  EligibilityUtil[campaignEligibility]
  DB[(campaigns + influencer_profiles + influencer_channels)]

  Page --> DetailHook --> API --> Route
  Page --> EligibilityHook --> DetailHook
  Route --> Schema
  Route --> Service --> DB
  Service --> EligibilityUtil
  Schema --> DetailHook
```

## Implementation Plan
1. **campaignEligibility 유틸**
   - 작업: 모집 기간, 캠페인 상태, 사용자 역할, 인플루언서 프로필 완성 여부를 체크하는 순수 함수 작성.
   - 테스트: `src/features/campaigns/lib/__tests__/eligibility.test.ts`에서 상태별 케이스(모집종료, 미완성 프로필 등) 단위 테스트.
2. **campaignDetailSchema**
   - 작업: 캠페인 상세 정보(혜택, 미션, 매장정보)와 eligibility payload zod 스키마 작성.
   - 테스트: `src/features/campaigns/backend/__tests__/detail-schema.test.ts`에서 정상/누락 필드 케이스 검증.
3. **campaignDetailService**
   - 작업: 캠페인, 모집 상태, 사용자 프로필 조회 후 eligibility 계산. 존재하지 않을 경우 404 처리.
   - 테스트: `src/features/campaigns/backend/__tests__/detail-service.test.ts`에서 존재/미존재/지원 불가 케이스 목킹 테스트.
4. **campaignDetailRoute**
   - 작업: `GET /campaigns/:campaignId` 라우트 구현, 파라미터 검증.
   - 테스트: `src/features/campaigns/backend/__tests__/detail-route.test.ts`에서 200/404/403 흐름 검증.
5. **useCampaignDetailQuery**
   - 작업: React Query `useQuery` 구현, eligibility 포함 응답 처리.
   - QA 시나리오: 로딩/에러 메시지, 지원 가능 여부에 따른 UI 변화 확인.
6. **useCampaignEligibility**
   - 작업: 상세 응답을 바탕으로 지원 가능 상태/메시지 제공.
   - QA 시나리오: 지원 불가 사유 출력, 버튼 활성/비활성 상태 확인.
7. **CampaignDetailSection**
   - 작업: 상세 정보 표시, 지원 버튼 렌더링, 지원 버튼 클릭 시 지원 페이지 네비게이션.
   - QA 시트:
     - 모집 종료 상태에서 버튼 비활성화 확인.
     - 프로필 미완성 시 가드 메시지 표시.
     - 상세 콘텐츠(Tailwind 반응형) 확인.
8. **Routing**
   - 작업: `src/app/campaigns/[campaignId]/page.tsx` 페이지 생성하여 컴포넌트 사용.
   - QA 시나리오: 페이지 접근(권한 여부), 존재하지 않는 ID에 대한 404 처리 확인.
