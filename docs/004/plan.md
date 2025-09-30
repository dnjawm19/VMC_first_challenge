# Implementation Plan 004: 홈 & 체험단 목록 탐색

## 개요
- **HomeCampaignSection (`src/features/campaigns/components/home-campaign-section.tsx`)**: 홈 화면에서 체험단 리스트와 배너를 노출하는 클라이언트 컴포넌트.
- **CampaignFilterBar (`src/features/campaigns/components/campaign-filter-bar.tsx`)**: 필터/정렬 UI 모듈.
- **CampaignList (`src/features/campaigns/components/campaign-list.tsx`)**: 캠페인 카드 그리드 렌더링.
- **useCampaignListQuery (`src/features/campaigns/hooks/useCampaignListQuery.ts`)**: 목록 조회 React Query 훅.
- **campaignSchema (`src/features/campaigns/backend/schema.ts`)**: 캠페인 목록/카드 응답 스키마 정의.
- **campaignRoute (`src/features/campaigns/backend/route.ts`)**: `GET /campaigns` 라우트 구현.
- **campaignService (`src/features/campaigns/backend/service.ts`)**: 모집중 캠페인 조회 비즈니스 로직.
- **campaignConstants (`src/features/campaigns/constants/index.ts`)**: 정렬 키, 페이지 사이즈 등 상수.
- **campaignDto (`src/features/campaigns/lib/dto.ts`)**: 프런트 DTO 노출.

## Diagram
```mermaid
graph TD
  Section[HomeCampaignSection]
  Filter[CampaignFilterBar]
  List[CampaignList]
  Hook[useCampaignListQuery]
  API[@/lib/remote/api-client]
  Route[campaignRoute]
  Service[campaignService]
  Schema[campaignSchema]
  Constants[campaignConstants]
  DB[(campaigns table)]

  Section --> Filter
  Section --> List
  List --> Hook --> API --> Route
  Route --> Schema
  Route --> Service --> DB
  Service --> Constants
  Schema --> Hook
  Hook --> List
```

## Implementation Plan
1. **campaignConstants**
   - 작업: 기본 페이지 크기, 정렬 키 목록, 필터 옵션 정의.
   - 테스트: 상수 모듈이므로 테스트 불필요.
2. **campaignSchema**
   - 작업: 목록 응답(배열), 카드 항목(혜택, 기간, 상태) zod 스키마 작성.
   - 테스트: `src/features/campaigns/backend/__tests__/schema.test.ts`에서 정렬/필터 파라미터 검증 및 응답 파싱 테스트.
3. **campaignService**
   - 작업: Supabase 쿼리 작성 (`status = recruiting`, 정렬/페이징 적용) 및 에러 처리.
   - 테스트: `src/features/campaigns/backend/__tests__/service.test.ts`에서 쿼리 파라미터별 반환 데이터 검증(목 클라이언트 사용).
4. **campaignRoute**
   - 작업: `GET /campaigns` 라우트 생성, 쿼리 파라미터 검증 및 서비스 호출.
   - 테스트: `src/features/campaigns/backend/__tests__/route.test.ts`에서 필터/정렬 조합 및 빈 결과 검증.
5. **campaignDto**
   - 작업: 스키마 기반 타입 재노출.
   - 테스트: 런타임 테스트 불필요.
6. **useCampaignListQuery**
   - 작업: React Query `useInfiniteQuery` 또는 `useQuery` 구성, 에러 메시지 처리.
   - QA 시나리오: 로딩/빈 상태/에러 처리 확인, 필터 변경 시 refetch 여부 확인.
7. **CampaignList**
   - 작업: 카드 컴포넌트 재사용, 각 카드에 picsum placeholder 사용 규칙 준수.
   - QA 시트:
     - 캠페인 데이터가 없을 때 빈 상태 표시.
     - 카드 클릭 시 상세 페이지 이동 경로 확인.
     - hover 및 접근성 속성 확인.
8. **CampaignFilterBar**
   - 작업: 필터 선택 UI, 상태 변경 시 `useCampaignListQuery`에 파라미터 전달.
   - QA 시트:
     - 필터 변경 시 목록 갱신.
     - 잘못된 값 선택 방지 및 초기화 버튼 기능 확인.
9. **HomeCampaignSection**
   - 작업: 홈 페이지(`src/app/page.tsx`)에서 사용, 배너 + 리스트 조합 제공.
   - QA 시트:
     - 홈 진입 시 데이터 로딩 및 레이아웃 확인.
     - 필터/정렬 상호작용 동작 확인.
