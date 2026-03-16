# 로컬에 PostgreSQL 없이 실행하기 (Neon 무료 DB)

로컬에 Postgres를 설치하지 않고 **Neon** 무료 DB로 마이그레이션·업로드를 쓰는 방법입니다.

## 1. Neon에서 DB 만들기

1. 브라우저에서 **https://neon.tech** 접속
2. **Sign up** (GitHub 로그인 가능)
3. **New Project** → 이름 예: `lls-scoreboard` → **Create project**
4. 대시보드에서 **Connection string** 찾기 (예: "Pooled connection" 또는 "Direct connection")
5. **Copy** 로 연결 URL 복사  
   형식 예: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

## 2. .env 설정

`v7` 폴더의 `.env` 파일을 열고, **DATABASE_URL** 한 줄을 Neon에서 복사한 URL로 **통째로** 바꿉니다.

```env
DATABASE_URL="postgresql://여기에_복사한_Neon_URL_붙여넣기?sslmode=require"
NEXT_PUBLIC_APP_NAME="LLS Scoreboard v7"
```

(기존 `localhost:5433` 줄은 지우고 위 한 줄만 넣으면 됩니다.)

## 3. 마이그레이션 실행

터미널에서:

```bash
cd /Users/myoungsookim/LLS_스코어보드/v7
npm run prisma:migrate
```

"Environment variables loaded from .env" 다음에 에러 없이 마이그레이션이 완료되면 성공입니다.

## 4. 앱 실행

```bash
npm run dev
# 또는
npm run dev:3002
```

브라우저에서 **http://localhost:3000** (또는 3002) 접속 후 스코어보드 엑셀 업로드를 시도해 보세요.

---

**정리:** 로컬 Postgres 설치 없이 `.env`만 Neon URL로 바꾸고 `prisma:migrate` 한 번 실행하면 됩니다.
