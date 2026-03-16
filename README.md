# LLS 스코어보드 v7

매출·정산·광고비·재고를 한 화면에서 보고, 목표·수수료 룰·채널별 실적을 관리하는 대시보드입니다.

---

## 지금 상태 확인하기 (개발 모드, 가장 쉬움)

**빌드 없이** 바로 브라우저에서 확인하려면:

```bash
cd /Users/myoungsookim/LLS_스코어보드/v7
npm install
npm run dev
```

터미널에 **Ready** 가 보이면 브라우저에서 **http://localhost:3000** 으로 접속하세요.

- 엑셀 업로드, 대시보드, 채널·SKU·카테고리 등 **현재 구현된 기능**을 모두 사용할 수 있습니다.
- 코드를 수정하면 화면이 자동으로 갱신됩니다.
- 종료하려면 터미널에서 **Ctrl + C** 를 누르세요.

**DB가 없다면:** 아래 "로컬에서 스코어보드 업로드까지"를 따라하세요.

---

## 로컬에서 스코어보드 업로드까지 (엑셀 → DB 적재)

업로드/적재를 쓰려면 **PostgreSQL**과 **.env** 설정이 필요합니다.

1. **`.env` 만들기**  
   `v7` 폴더에 `.env` 파일이 없으면 `.env.example`을 복사한 뒤, `DATABASE_URL`을 실제 DB에 맞게 수정하세요.
   ```bash
   cp .env.example .env
   ```
   예시 (로컬 Postgres 포트 5433):
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/lls_scoreboard?schema=public"
   ```

2. **PostgreSQL 실행**  
   아래 중 하나를 선택하세요.
   - **Docker** (설치되어 있다면):
     ```bash
     docker run -d --name lls-db -p 5433:5432 -e POSTGRES_PASSWORD=postgres postgres:15
     docker exec -it lls-db psql -U postgres -c "CREATE DATABASE lls_scoreboard;"
     ```
   - **Mac, 설치 없이 쓰기 (권장):** [Neon](https://neon.tech) 무료 가입 → DB 생성 → 연결 URL 복사 → `.env`의 `DATABASE_URL`을 그 URL로 교체 후 `npm run prisma:migrate`. 자세한 단계는 **[docs/로컬DB없이_실행하기.md](docs/로컬DB없이_실행하기.md)** 참고.
   - **Mac, 로컬 설치:** [Postgres.app](https://postgresapp.com) 다운로드 후 실행, 또는 `brew install postgresql@15` 후 `brew services start postgresql@15`. 기본 포트가 5432면 `.env`를 `localhost:5432`로 맞추세요.

3. **테이블 생성 (마이그레이션)**  
   `v7` 폴더에서:
   ```bash
   npm run prisma:migrate
   ```

4. **개발 서버 실행**  
   ```bash
   npm run dev
   ```
   또는 포트 3002: `npm run dev:3002`  
   브라우저에서 **http://localhost:3000** (또는 3002) → 파일 선택으로 스코어보드 엑셀 업로드하면 DB에 적재됩니다.

업로드 시 **"Can't reach database server at localhost:5433"** 가 나오면 Postgres가 꺼져 있거나 해당 포트에 없는 것입니다. 위 2단계에서 DB를 띄우거나, Neon/Supabase URL을 `.env`에 넣은 뒤 3단계 마이그레이션을 실행하세요.

---

## 로컬 실행 (프로덕션 빌드)

```bash
npm install
npm run build
npm run start
```

→ http://localhost:3000

## 팀 공유용 퍼블리싱 (웹으로 배포)

팀원들에게 **웹 링크**로 공유하려면 Vercel에 배포하는 방법을 사용하세요.

**자세한 단계는 [docs/DEPLOY.md](docs/DEPLOY.md) 를 참고하세요.**

요약:

1. **클라우드 PostgreSQL** 만들기 (Neon / Supabase / Railway 등)
2. **GitHub**에 이 프로젝트 올리기
3. **Vercel**에서 저장소 연결 → 환경 변수 `DATABASE_URL` 설정 → Deploy
4. 배포용 DB에 **마이그레이션** 한 번 실행:  
   `DATABASE_URL="postgresql://..." npx prisma migrate deploy`
5. Vercel이 준 URL(예: `https://lls-scoreboard-xxx.vercel.app`)을 팀원에게 공유

환경 변수, 트러블슈팅, ngrok 테스트 방법 등은 모두 [docs/DEPLOY.md](docs/DEPLOY.md)에 정리되어 있습니다.
