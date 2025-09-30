# Implementation Plan 009: 광고주 체험단 상세 & 모집 관리

## 개요
- **CampaignManagementDetail (`src/features/campaign-management/components/campaign-management-detail.tsx`)**: 광고주용 체험단 상세 및 상태 제어 UI.
- **ApplicantTable (`src/features/campaign-management/components/applicant-table.tsx`)**: 지원자 리스트 테이블 컴포넌트.
- **SelectionDialog (`src/features/campaign-management/components/selection-dialog.tsx`)**: 선정 인원 선택 다이얼로그.
- **useCampaignManagementDetailQuery (`src/features/campaign-management/hooks/useCampaignManagementDetailQuery.ts`)**: 상세 정보 + 지원자 조회 훅.
- **useCloseRecruitmentMutation (`src/features/campaign-management/hooks/useCloseRecruitmentMutation.ts`)**: 모집 종료 mutation.
- **useSelectApplicantsMutation (`src/features/campaign-management/hooks/useSelectApplicantsMutation.ts`)**: 선정 처리 mutation.
- **managementDetailSchema (`src/features/campaign-management/backend/schema.ts`)**: 상세/지원자/상태 변경 스키마.
- **managementDetailService (`src/features/campaign-management/backend/service.ts`)**: 상세 조회, 모집 종료, 선정 로직.
- **managementDetailRoute (`src/features/campaign-management/backend/route.ts`)**: `GET /advertiser/campaigns/:campaignId`, `POST /advertiser/campaigns/:campaignId/actions` 라우트.
- **selectionRules (`src/features/campaign-management/lib/selection-rules.ts`)**: 모집 상태 흐름과 인원 검증 유틸.

## Diagram
```mermaid
graph TD
  DetailUI[CampaignManagementDetail]
  Table[ApplicantTable]
  Dialog[SelectionDialog]
  DetailHook[useCampaignManagementDetailQuery]
  CloseMut[useCloseRecruitmentMutation]
  SelectMut[useSelectApplicantsMutation]
  API[@/lib/remote/api-client]
  Route[managementDetailRoute]
  Service[managementDetailService]
  Schema[managementDetailSchema]
  Rules[selectionRules]
  DB[(campaigns + campaign_applications)]

  DetailUI --> DetailHook --> API --> Route
  DetailUI --> CloseMut --> API
  DetailUI --> Dialog --> SelectMut --> API
  DetailUI --> Table
  Route --> Schema
  Route --> Service --> DB
  Service --> Rules
  Schema --> DetailHook
  Schema --> CloseMut
  Schema --> SelectMut
```

## Implementation Plan
1. **selectionRules**
   - 작업: 상태 전환 순서(`recruiting`→`closed`→`selected`), 정원 초과 검증, 지원자 존재 여부 검증 로직 구현.
   - 테스트: `src/features/campaign-management/lib/__tests__/selection-rules.test.ts`에서 정상/에러 케이스 단위 테스트.
2. **managementDetailSchema**
   - 작업: 상세 응답, 지원자 리스트, 액션 요청(모집종료/선정) zod 스키마 작성.
   - 테스트: `src/features/campaign-management/backend/__tests__/detail-schema.test.ts`에서 유효성 검증.
3. **managementDetailService**
   - 작업: 광고주 소유 검증, 상세 조회, 모집 종료 처리, 선정 처리(선정/반려 상태 일괄 업데이트).
   - 테스트: `src/features/campaign-management/backend/__tests__/detail-service.test.ts`에서 상태 전환, 정원 초과, 지원자 없음 시나리오 검증.
4. **managementDetailRoute**
   - 작업: `GET /advertiser/campaigns/:id`와 `POST /advertiser/campaigns/:id/actions` 라우트 구현 (액션 타입별 분기).
   - 테스트: `src/features/campaign-management/backend/__tests__/detail-route.test.ts`에서 권한, 상태 흐름 검증.
5. **useCampaignManagementDetailQuery**
   - 작업: React Query `useQuery`, 상세 + 지원자 데이터 캐싱.
   - QA 시나리오: 로딩/에러/빈 지원자 처리 확인.
6. **useCloseRecruitmentMutation**
   - 작업: 상태 변경 mutation, 성공 시 상세 쿼리 무효화.
   - QA 시나리오: 이미 종료 상태 오류 처리, 성공 메시지 확인.
7. **useSelectApplicantsMutation**
   - 작업: 선정 요청 mutation, 성공 후 상세 갱신.
   - QA 시나리오: 정원 초과 선택 시 에러, 성공 시 토스트 및 상태 업데이트 확인.
8. **ApplicantTable**
   - 작업: 지원자 리스트 + 상태 뱃지 표시, 선택 가능 여부 표시.
   - QA 시트:
     - 지원자 없음 시 빈 상태 메시지.
     - 선정 대상 선택/해제 동작.
9. **SelectionDialog**
   - 작업: 모집 종료 이후 표시, 다중 선택과 확인 버튼 제공.
   - QA 시트:
     - 정원 초과 선택 시 즉시 경고.
     - 취소/확인 동작.
10. **CampaignManagementDetail**
   - 작업: 상세 요약, 액션 버튼, 테이블/다이얼로그 orchestration.
   - QA 시트:
     - 상태에 따라 버튼 노출 조건 확인.
     - 액션 실행 후 UI 업데이트.
11. **Page 통합**
   - 작업: `src/app/(protected)/advertiser/campaigns/[campaignId]/page.tsx` 생성하여 상세 컴포넌트 배치.
   - QA 시나리오: 권한 없는 접근 차단, URL 직접 진입 시 지원자 목록 표시 확인.
