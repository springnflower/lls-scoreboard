# LLS 스코어보드 v7

매출·정산·광고비·재고를 한 화면에서 보고, 목표·수수료 룰·채널별 실적을 관리하는 대시보드입니다.

## 로컬 실행

```bash
npm install
npm run build
npm run start
```

개발 모드: `npm run dev` → http://localhost:3000

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
