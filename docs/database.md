# Database Specification

## Data Flow Overview
1. **회원가입 & 역할선택**: Supabase Auth 계정 생성 직후 `user_profiles`에 기본 정보와 역할·인증 방식을 저장하고, 동의한 약관은 `user_terms_acceptances`에 기록한다.
2. **인플루언서 정보 등록**: `influencer_profiles`에 생년월일과 검증 상태를 저장하며, 등록한 SNS 채널별로 `influencer_channels`가 생성되고 검증 상태가 업데이트된다.
3. **광고주 정보 등록**: 광고주 입력값을 `advertiser_profiles`에 보관하고, 사업자 검증 결과에 따라 상태를 변경한다.
4. **체험단 목록 탐색**: 홈·목록 화면은 `campaigns`에서 `status = 'recruiting'`인 모집 정보를 조회해 카드 리스트를 구성한다.
5. **체험단 상세 조회**: `campaigns` 단일 레코드를 조회하고, 인플루언서의 프로필·채널 완성 여부를 확인해 지원 버튼 노출 여부를 결정한다.
6. **체험단 지원 제출**: 지원 시 `campaign_applications`에 각오 한마디, 방문 예정일, 상태=`applied`를 저장하고, 동일 인플루언서의 중복 지원을 차단한다.
7. **내 지원 목록 조회**: 인플루언서가 `campaign_applications`를 조회해 신청완료/선정/반려 상태별로 필터링한다.
8. **광고주 체험단 관리**: 광고주는 `campaigns`를 통해 등록·조회·상태 변경(모집중→모집종료→선정완료)을 수행하고, 선정 시 관련 `campaign_applications` 상태를 `selected`/`rejected`로 갱신한다.

## Schema Definition

### Enumerations
- `auth_method_enum`: `email`, `external`
- `user_role_enum`: `advertiser`, `influencer`
- `verification_status_enum`: `pending`, `verified`, `rejected`
- `channel_status_enum`: `pending`, `verified`, `failed`
- `campaign_status_enum`: `recruiting`, `closed`, `selected`
- `application_status_enum`: `applied`, `selected`, `rejected`

### Tables

#### `user_profiles`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `user_id` | uuid | PK, FK → `auth.users(id)` | Supabase 사용자 식별자 |
| `full_name` | text | NOT NULL | 사용자 이름 |
| `phone` | text | NOT NULL | 휴대폰 번호 |
| `role` | `user_role_enum` | NOT NULL | 선택한 역할 |
| `auth_method` | `auth_method_enum` | NOT NULL | 인증 방식 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 (트리거 자동 갱신) |

#### `user_terms_acceptances`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | bigserial | PK | 동의 이력 식별자 |
| `user_id` | uuid | FK → `user_profiles(user_id)` ON DELETE CASCADE | 사용자 참조 |
| `terms_code` | text | NOT NULL | 약관 코드 |
| `version` | text | NOT NULL | 약관 버전 |
| `accepted_at` | timestamptz | DEFAULT `now()` | 동의 시각 |

#### `influencer_profiles`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `user_id` | uuid | PK, FK → `user_profiles(user_id)` ON DELETE CASCADE | 인플루언서 사용자 |
| `birth_date` | date | NOT NULL | 생년월일 |
| `age_policy_status` | `verification_status_enum` | DEFAULT `pending` | 나이 정책 검증 상태 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 |

#### `influencer_channels`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | bigserial | PK | 채널 식별자 |
| `influencer_user_id` | uuid | FK → `influencer_profiles(user_id)` ON DELETE CASCADE | 소유 인플루언서 |
| `channel_type` | text | CHECK (`channel_type` ∈ {`naver`,`youtube`,`instagram`,`threads`}) | 채널 유형 |
| `channel_name` | text | NOT NULL | 채널명 |
| `channel_url` | text | NOT NULL | 채널 URL |
| `status` | `channel_status_enum` | DEFAULT `pending` | 검증 상태 |
| `last_checked_at` | timestamptz | NULL | 최근 검증 시각 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 |

#### `advertiser_profiles`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `user_id` | uuid | PK, FK → `user_profiles(user_id)` ON DELETE CASCADE | 광고주 사용자 |
| `company_name` | text | NOT NULL | 업체명 |
| `location` | text | NOT NULL | 위치 |
| `category` | text | NOT NULL | 카테고리 |
| `business_registration_number` | text | NOT NULL, UNIQUE | 사업자등록번호 |
| `verification_status` | `verification_status_enum` | DEFAULT `pending` | 검증 상태 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 |

#### `campaigns`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 체험단 식별자 |
| `advertiser_user_id` | uuid | FK → `advertiser_profiles(user_id)` ON DELETE CASCADE | 등록 광고주 |
| `title` | text | NOT NULL | 체험단명 |
| `recruitment_start_at` | date | NOT NULL | 모집 시작일 |
| `recruitment_end_at` | date | NOT NULL, CHECK (>= `recruitment_start_at`) | 모집 종료일 |
| `capacity` | integer | NOT NULL, CHECK (`capacity` > 0) | 모집 인원 |
| `benefits` | text | NOT NULL | 제공 혜택 |
| `mission` | text | NOT NULL | 미션 설명 |
| `store_info` | text | NOT NULL | 매장 정보 |
| `status` | `campaign_status_enum` | DEFAULT `recruiting` | 모집 상태 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 |

#### `campaign_applications`
| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` | 지원 식별자 |
| `campaign_id` | uuid | FK → `campaigns(id)` ON DELETE CASCADE | 대상 체험단 |
| `influencer_user_id` | uuid | FK → `influencer_profiles(user_id)` ON DELETE CASCADE | 지원 인플루언서 |
| `motivation` | text | NOT NULL | 각오 한마디 |
| `visit_plan_date` | date | NOT NULL | 방문 예정일 |
| `status` | `application_status_enum` | DEFAULT `applied` | 지원 상태 |
| `submitted_at` | timestamptz | DEFAULT `now()` | 제출 시각 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 |

### Triggers
- 모든 테이블의 `updated_at` 컬럼은 `set_timestamp()` 트리거로 갱신된다.
- 트리거는 각 테이블에 한 번만 생성되며, 반복 실행 시 중복 생성되지 않도록 보호되어 있다.
