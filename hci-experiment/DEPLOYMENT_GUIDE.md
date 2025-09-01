# 실험 플랫폼 배포 및 운영 가이드

## 🚀 배포 전 설정

### 1. 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 순서로 실행:

```sql
-- 1. 004_comprehensive_schema.sql 실행 (이미 완료)
-- 2. 005_experiment_conditions.sql 실행 (이미 완료) 
-- 3. 006_fix_constraints.sql 실행 (이미 완료)
-- 4. 새로 추가된 원자적 배정 함수 실행
```

**007_atomic_condition_assignment.sql** 파일 내용을 Supabase SQL Editor에서 실행하세요.

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 설정:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
LLM_MODEL=gpt-4o

# Prolific Configuration
PROLIFIC_COMPLETION_CODE=your_completion_code
NEXT_PUBLIC_PROLIFIC_COMPLETION_URL=https://app.prolific.co/submissions/complete?cc=YOUR_COMPLETION_CODE

# Admin API (선택사항 - 보안을 위해 강력한 키 사용)
ADMIN_API_KEY=your_secure_random_admin_key_here
NEXT_PUBLIC_ADMIN_API_KEY=your_secure_random_admin_key_here
```

### 3. Vercel 배포

```bash
# 의존성 설치
npm install

# 로컬 테스트
npm run dev

# Vercel에 배포
vercel --prod
```

## 🔧 개선된 기능들

### 1. 동시성 문제 해결 ✅

- **문제**: 여러 참가자가 동시 접속 시 같은 조건 중복 배정
- **해결**: PostgreSQL의 `FOR UPDATE SKIP LOCKED`를 사용한 원자적 배정
- **함수**: `assign_next_condition(participant_id)`

### 2. 중도 이탈자 자동 정리 ✅

- **문제**: 중도 이탈 시 조건이 영구히 잠김
- **해결**: 30분 타임아웃 후 자동 해제
- **함수**: `cleanup_abandoned_assignments()`

### 3. 재시도 로직 강화 ✅

- **문제**: 일시적 오류 시 참가자 등록 실패
- **해결**: 최대 3회 재시도 + 지수 백오프
- **API**: `/api/participants/upsert`

### 4. 관리자 대시보드 ✅

- **기능**: 실시간 실험 상태 모니터링
- **경로**: `/admin/dashboard`
- **정리**: 수동 중도 이탈자 정리 버튼

## 📊 운영 모니터링

### 관리자 대시보드 접속

```
https://your-domain.vercel.app/admin/dashboard
```

### API를 통한 상태 확인

```bash
# 현재 상태 조회
curl -H "Authorization: Bearer YOUR_ADMIN_KEY" \
     https://your-domain.vercel.app/api/admin/cleanup

# 수동 정리 실행
curl -X POST \
     -H "Authorization: Bearer YOUR_ADMIN_KEY" \
     https://your-domain.vercel.app/api/admin/cleanup
```

### 주요 지표

- **총 조건 수**: 126개 (사전 생성)
- **배정된 조건**: 현재 참가자에게 할당된 수
- **사용 가능한 조건**: 새 참가자 배정 가능한 수
- **완료된 참가자**: 실험을 끝까지 마친 수
- **활성 참가자**: 현재 진행 중인 수 (30분 이내 활동)
- **중도 이탈자**: 30분 이상 비활성 상태

## 🔄 자동 정리 설정 (선택사항)

### Vercel Cron Jobs 사용

`vercel.json` 파일 생성:

```json
{
  "crons": [
    {
      "path": "/api/admin/cleanup",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

이렇게 하면 30분마다 자동으로 중도 이탈자를 정리합니다.

### 외부 모니터링 서비스

- **UptimeRobot** 등의 서비스로 주기적 호출
- **GitHub Actions** 워크플로우로 스케줄 실행

## 🐛 트러블슈팅

### 1. 조건 배정 실패

```bash
# 수동 정리 실행
curl -X POST -H "Authorization: Bearer YOUR_ADMIN_KEY" \
     https://your-domain.vercel.app/api/admin/cleanup
```

### 2. 데이터베이스 함수 오류

Supabase SQL Editor에서 함수 재생성:

```sql
-- 007_atomic_condition_assignment.sql 다시 실행
```

### 3. 환경 변수 누락

Vercel 대시보드에서 Environment Variables 확인

### 4. 권한 오류

Supabase에서 함수 실행 권한 확인:

```sql
GRANT EXECUTE ON FUNCTION assign_next_condition(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_assignments() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_condition_stats() TO anon, authenticated;
```

## 📈 성능 최적화

### 인덱스 확인

```sql
-- 필요한 인덱스들이 생성되었는지 확인
\d experiment_conditions
\d participants
```

### 쿼리 성능 모니터링

Supabase Dashboard의 Performance 탭에서 느린 쿼리 확인

## 🔒 보안 고려사항

1. **Admin API Key**: 강력한 랜덤 키 사용
2. **Supabase RLS**: 필요 시 Row Level Security 활성화
3. **Rate Limiting**: Vercel의 기본 제한 활용
4. **로그 모니터링**: Vercel Functions 로그 정기 확인

## 📞 문제 발생 시

1. **관리자 대시보드**에서 현재 상태 확인
2. **수동 정리** 버튼으로 즉시 해결 시도
3. **Vercel 로그**에서 상세 오류 확인
4. **Supabase 로그**에서 데이터베이스 오류 확인

이제 동시 접속, 중도 이탈, 데이터 정합성 문제가 모두 해결되었습니다! 🎉
