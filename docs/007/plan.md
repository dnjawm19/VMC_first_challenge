# Implementation Plan 007: 내 지원 목록 (인플루언서 전용)

## 개요
- **MyApplicationsPage (`src/app/(protected)/applications/page.tsx`)**: 내 지원 목록 페이지 엔트리 포인트.
- **MyApplicationsSection (`src/features/campaigns/components/my-applications-section.tsx`)**: 지원 목록/필터 UI.
- **ApplicationStatusFilter (`src/features/campaigns/components/application-status-filter.tsx`)**: 상태 필터 컴포넌트.
- **ApplicationList (`src/features/campaigns/components/application-list.tsx`)**: 지원 카드/테이블 렌더링.
- **useMyApplicationsQuery (`src/features/campaigns/hooks/useMyApplicationsQuery.ts`)**: 지원 목록 조회 훅.
- **myApplicationsSchema (`src/features/campaigns/backend/schema.ts`)**: 지원 목록 응답 스키마.
- **myApplicationsService (`src/features/campaigns/backend/service.ts`)**: 현재 사용자 지원 목록 조회 로직.
- **myApplicationsRoute (`src/features/campaigns/backend/route.ts`)**: `GET /me/applications` 라우트.

## Diagram
```mermaid
graph TD
  Page[MyApplicationsPage]
  Section[MyApplicationsSection]
  Filter[ApplicationStatusFilter]
  List[ApplicationList]
  Hook[useMyApplicationsQuery]
  API[@/lib/remote/api-client]
  Route[myApplicationsRoute]
  Service[myApplicationsService]
  Schema[myApplicationsSchema]
  DB[(campaign_applications + campaigns)]

  Page --> Section
  Section --> Filter
  Section --> List
  List --> Hook --> API --> Route
  Route --> Schema
  Route --> Service --> DB
  Schema --> Hook
```

## Implementation Plan
1. **myApplicationsSchema**
   - 작업: 응답 구조(지원 ID, 캠페인 요약, 상태, 제출일) 스키마 작성.
   - 테스트: `src/features/campaigns/backend/__tests__/my-applications-schema.test.ts`에서 데이터 형식 검증.
2. **myApplicationsService**
   - 작업: 현재 사용자 ID 기준으로 `campaign_applications` 조인 조회, 상태 필터 적용.
   - 테스트: `src/features/campaigns/backend/__tests__/my-applications-service.test.ts`에서 필터(전체/선정/반려)별 반환값 검증.
3. **myApplicationsRoute**
   - 작업: `GET /me/applications` 라우트 구현, 인증된 인플루언서만 허용.
   - 테스트: `src/features/campaigns/backend/__tests__/my-applications-route.test.ts`에서 인증 실패/성공 응답 검증.
4. **useMyApplicationsQuery**
   - 작업: React Query `useQuery` 구현, 상태 필터 파라미터 처리.
   - QA 시나리오: 로딩/빈 상태/에러 메시지 확인, 필터 변경 시 데이터 갱신.
5. **ApplicationStatusFilter**
   - 작업: 상태 선택 UI, query 훅과 상태 공유.
   - QA 시트:
     - 선택 변경 시 목록 갱신 확인.
     - 기본값(전체) 확인.
6. **ApplicationList**
   - 작업: 카드 또는 테이블 렌더링, 상태 뱃지 표시.
   - QA 시트:
     - 데이터가 없을 때 빈 상태 메시지.
     - 상태별 스타일 확인.
     - 캠페인 상세로 이동 링크 동작.
7. **MyApplicationsSection**
   - 작업: 필터와 리스트 조합, 로딩/에러 UI 통합.
   - QA 시트:
     - 전체 페이지 반응형 레이아웃 확인.
     - 에러 시 재시도 버튼.
8. **MyApplicationsPage**
   - 작업: 보호된 라우트 생성, `use client` 지정, 섹션 컴포넌트 렌더링.
   - QA 시나리오: 비로그인 접근 시 리다이렉트, Breadcrumb/헤더 표시 확인.
