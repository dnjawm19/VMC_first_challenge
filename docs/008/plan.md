# Implementation Plan 008: 광고주 체험단 관리

## 개요
- **AdvertiserCampaignDashboard (`src/features/campaign-management/components/advertiser-campaign-dashboard.tsx`)**: 광고주 체험단 목록 및 액션 UI.
- **CampaignCreateDialog (`src/features/campaign-management/components/campaign-create-dialog.tsx`)**: 신규 체험단 등록 폼 모달.
- **useAdvertiserCampaignsQuery (`src/features/campaign-management/hooks/useAdvertiserCampaignsQuery.ts`)**: 광고주 체험단 목록 조회 훅.
- **useCreateCampaignMutation (`src/features/campaign-management/hooks/useCreateCampaignMutation.ts`)**: 신규 체험단 생성 mutation.
- **managementSchema (`src/features/campaign-management/backend/schema.ts`)**: 목록/생성 요청 스키마.
- **managementService (`src/features/campaign-management/backend/service.ts`)**: 광고주 체험단 조회 및 생성 로직.
- **managementRoute (`src/features/campaign-management/backend/route.ts`)**: `GET/POST /advertiser/campaigns` 라우트.
- **campaignManagementConstants (`src/features/campaign-management/constants/index.ts`)**: 모집 상태/정렬 상수.

## Diagram
```mermaid
graph TD
  Dashboard[AdvertiserCampaignDashboard]
  CreateDialog[CampaignCreateDialog]
  QueryHook[useAdvertiserCampaignsQuery]
  CreateHook[useCreateCampaignMutation]
  API[@/lib/remote/api-client]
  Route[managementRoute]
  Service[managementService]
  Schema[managementSchema]
  Constants[campaignManagementConstants]
  DB[(campaigns table)]

  Dashboard --> QueryHook --> API --> Route
  Dashboard --> CreateDialog --> CreateHook --> API
  Route --> Schema
  Route --> Service --> DB
  Service --> Constants
  Schema --> QueryHook
  Schema --> CreateHook
```

## Implementation Plan
1. **campaignManagementConstants**
   - 작업: 모집 상태 라벨, 최대 등록 가능 수 등 상수 정의.
   - 테스트: 상수 모듈 테스트 불필요.
2. **managementSchema**
   - 작업: 목록 응답, 생성 요청(모집 기간, 인원, 혜택 등) 스키마 작성.
   - 테스트: `src/features/campaign-management/backend/__tests__/schema.test.ts`에서 유효성 검증.
3. **managementService**
   - 작업: 광고주별 캠페인 조회, 생성 로직(Supabase INSERT) 구현.
   - 테스트: `src/features/campaign-management/backend/__tests__/service.test.ts`에서 검증 미완료 광고주 제한, 모집 기간 검증 테스트.
4. **managementRoute**
   - 작업: `GET /advertiser/campaigns`, `POST /advertiser/campaigns` 라우트 구현.
   - 테스트: `src/features/campaign-management/backend/__tests__/route.test.ts`에서 권한 체크, 검증 실패 응답 테스트.
5. **useAdvertiserCampaignsQuery**
   - 작업: React Query `useQuery` 구현, 로딩/에러 처리.
   - QA 시나리오: 데이터 없음 시 빈 상태, 에러 시 토스트.
6. **useCreateCampaignMutation**
   - 작업: mutation 구현, 성공 후 목록 캐시 무효화, 오류 메시지 표시.
   - QA 시나리오: 필수 필드 누락 에러, 성공 후 모달 닫힘 및 토스트 확인.
7. **CampaignCreateDialog**
   - 작업: `react-hook-form` 기반 폼, 날짜 범위 선택, 혜택/미션 입력.
   - QA 시트:
     - 모집 기간 시작≤종료 검증.
     - 모집 인원 최소값 검증.
     - 저장 성공 후 폼 리셋.
8. **AdvertiserCampaignDashboard**
   - 작업: 목록 카드 렌더링, 생성 버튼 연결, 검증 미완료 상태 안내.
   - QA 시트:
     - 검증 미완료 광고주 시 CTAs 비활성화.
     - 목록 리프레시 동작.
     - 반응형 레이아웃 확인.
9. **Page 통합**
   - 작업: `src/app/(protected)/advertiser/campaigns/page.tsx` 생성하여 대시보드 배치.
   - QA 시나리오: 로그인/권한 체크, 초기 데이터 로드, 생성 플로우.
