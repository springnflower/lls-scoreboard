# LLS 스코어보드 v7 — 팀 공유용 퍼블리싱 가이드

팀원들이 **브라우저로 접속**할 수 있는 **웹 주소**를 만드는 방법입니다.  
아래 **가장 쉬운 방법**만 따라 하면 됩니다.

---

# 🟢 가장 쉬운 방법 (추천)

**준비물:** GitHub 계정, 이메일(또는 GitHub)  
**결과:** 팀원에게 공유할 수 있는 고정 URL (예: `https://lls-scoreboard-xxx.vercel.app`)  
**비용:** 무료 (Neon + Vercel 무료 티어)

전체 흐름은 **4단계**입니다.

```
① Neon에서 DB 만들기 (2분)  →  ② GitHub에 코드 올리기 (2분)  →  ③ Vercel에서 배포 (3분)  →  ④ DB 테이블 한 번 생성 (1분)
```

---

## ① Neon에서 DB 만들기 (2분)

**왜 하나요?** 웹에 올린 앱이 데이터를 저장할 **인터넷용 DB**가 필요해서입니다. Neon은 가입만 하면 바로 주소를 줍니다.

1. 브라우저에서 **https://neon.tech** 접속
2. 오른쪽 위 **Sign up** 클릭  
   - **Continue with GitHub** 선택하면 가입이 가장 빠릅니다.
3. 로그인 후 **Create a project** (또는 **New Project**) 클릭
4. **Project name**에 `lls-scoreboard` 입력 (다른 이름도 가능) → **Create project** 클릭
5. 화면에 **Connection string** 이 보입니다.  
   - **Connection string** 이라고 써 있는 칸 옆에 긴 주소가 있습니다.  
   - 형태: `postgresql://사용자이름:비밀번호@ep-xxxx.neon.tech/neondb?sslmode=require`
6. 그 옆 **Copy** 버튼을 눌러 **전체 문자열을 복사**한 뒤, 메모장 등에 붙여 넣어 두세요.  
   - 나중에 **④ 단계**와 **Vercel 환경 변수**에 그대로 붙여 넣을 예정입니다.

**여기까지 하면:** 인터넷에서 접속 가능한 PostgreSQL 주소를 하나 만든 것입니다.

---

## ② GitHub에 코드 올리기 (2분)

**왜 하나요?** Vercel이 “어떤 코드를 배포할지” GitHub 저장소로 가져오기 때문입니다.

### 2-1. GitHub에 빈 저장소 만들기

1. **https://github.com** 접속 후 로그인
2. 오른쪽 위 **+** → **New repository** 클릭
3. **Repository name**에 `lls-scoreboard` 입력 (다른 이름도 가능)
4. **Public** 선택
5. **Create repository**만 누르고, “Add a README” 등은 **체크하지 마세요** (이미 코드가 있으므로)
6. 생성된 페이지에 **저장소 주소**가 보입니다.  
   - 예: `https://github.com/본인아이디/lls-scoreboard`  
   - 이 주소를 복사해 두세요.

### 2-2. 터미널에서 v7 폴더를 이 저장소로 올리기

Mac에서는 **Terminal(터미널)** 앱을 열고, 아래를 **한 줄씩** 실행하세요.  
`본인아이디`와 `lls-scoreboard`는 위에서 만든 GitHub 주소에 맞게 바꾸세요.

```bash
cd /Users/myoungsookim/LLS_스코어보드/v7
```

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "LLS Scoreboard v7 팀 공유용"
```

```bash
git remote add origin https://github.com/본인아이디/lls-scoreboard.git
```
※ `본인아이디/lls-scoreboard` 부분을 본인 저장소 주소로 바꾸세요.

```bash
git branch -M main
```

```bash
git push -u origin main
```

- 비밀번호를 묻으면 **GitHub 비밀번호**가 아니라 **Personal Access Token**을 써야 할 수 있습니다.  
  - GitHub → **Settings** → **Developer settings** → **Personal access tokens**에서 토큰을 만들고, 그 값을 비밀번호 자리에서 입력하면 됩니다.

**여기까지 하면:** GitHub에 v7 코드가 올라가 있습니다.

---

## ③ Vercel에서 배포하기 (3분)

**왜 하나요?** Vercel이 GitHub 코드를 가져와서 “웹 주소”를 만들어 줍니다.

1. **https://vercel.com** 접속
2. **Sign up** → **Continue with GitHub** 선택 (같은 GitHub로 하면 저장소 목록이 바로 보입니다)
3. 로그인 후 **Add New…** → **Project** 클릭
4. **Import Git Repository** 목록에서 방금 올린 **lls-scoreboard** (또는 지정한 이름) 선택 → **Import** 클릭
5. **Configure Project** 화면에서:
   - **Root Directory** 옆 **Edit** 클릭 → `v7` 입력 → **Continue**  
     (저장소 루트가 이미 v7 폴더만 있다면 이 단계는 건너뛰어도 됩니다.)
   - **Environment Variables** 섹션으로 내려갑니다.
6. **Environment Variables** 에 변수 추가:
   - **Name:** `DATABASE_URL`  
   - **Value:** ① 단계에서 Neon에서 복사한 **Connection string 전체**를 붙여 넣기  
   - **Add** 클릭
7. 맨 아래 **Deploy** 버튼 클릭
8. 빌드가 끝날 때까지 1~2분 기다립니다.  
   - **Congratulations** 화면이 나오면, **Visit** 버튼이 보입니다.  
   - 아직 DB 테이블을 안 만들었기 때문에, **Visit** 해도 에러가 날 수 있습니다. 다음 ④ 단계를 먼저 진행하세요.

**여기까지 하면:** Vercel이 “웹 주소”를 만들어 둔 상태입니다. 이 주소는 프로젝트 대시보드에서 항상 볼 수 있습니다.

---

## ④ DB 테이블 한 번만 만들기 (1분)

**왜 하나요?** Neon DB는 비어 있으므로, 앱이 쓰는 **테이블**을 한 번 생성해 줘야 합니다.

1. **터미널**을 다시 엽니다.
2. 아래 명령에서 **`여기에_Neon에서_복사한_주소_붙여넣기`** 부분을 ① 단계에서 복사한 **Connection string 전체**로 바꿉니다.  
   (따옴표까지 포함해서 한 줄로 넣습니다.)

```bash
cd /Users/myoungsookim/LLS_스코어보드/v7
```

```bash
DATABASE_URL="여기에_Neon에서_복사한_주소_붙여넣기" npx prisma migrate deploy
```

예시 (실제 값은 Neon 화면과 다름):

```bash
DATABASE_URL="postgresql://myuser:mypass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
```

3. **Applying migration …** 같은 메시지가 나오고, 에러 없이 끝나면 성공입니다.
4. 이제 Vercel 프로젝트 페이지에서 **Visit** (또는 **Go to Dashboard** → 해당 프로젝트 → **Visit**) 로 접속해 보세요.  
   스코어보드 첫 화면이 보이면 배포 완료입니다.

**공유할 주소:** Vercel 프로젝트 상단에 있는 URL (예: `https://lls-scoreboard-xxx.vercel.app`) 을 팀원에게 보내면 됩니다.

---

# ✅ 한 번에 복사해서 쓰는 명령어 (정리용)

아래는 **이미 GitHub 저장소를 만들었다고 가정**한 요약 명령어입니다.  
`본인아이디`와 `저장소이름`만 바꾸고, **DATABASE_URL** 은 Neon에서 복사한 값으로 바꿔서 사용하세요.

```bash
# 1) v7 폴더로 이동
cd /Users/myoungsookim/LLS_스코어보드/v7

# 2) GitHub에 올리기 (본인 저장소 주소로 수정)
git init
git add .
git commit -m "LLS Scoreboard v7"
git remote add origin https://github.com/본인아이디/저장소이름.git
git branch -M main
git push -u origin main

# 3) DB 테이블 생성 (Neon Connection string으로 수정)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Vercel은 웹에서 **Import → 환경 변수 DATABASE_URL 넣기 → Deploy** 만 하면 됩니다.

---

# 자주 묻는 질문

**Q. 팀원은 뭘 해야 하나요?**  
A. 아무것도 안 해도 됩니다. 받은 링크(예: `https://lls-scoreboard-xxx.vercel.app`)를 브라우저에 넣고 접속하면 됩니다.

**Q. 엑셀 파일은 어떻게 올리나요?**  
A. 배포된 스코어보드 화면에서 **엑셀 업로드** 기능으로 올리면 됩니다. 데이터는 위에서 만든 Neon DB에 저장됩니다.

**Q. 코드를 수정했는데 반영하려면?**  
A. `v7` 폴더에서 수정한 뒤, 터미널에서 `git add .` → `git commit -m "수정 내용"` → `git push` 하면 Vercel이 자동으로 다시 배포합니다.

**Q. 비밀번호에 @, # 같은 특수문자가 있는데요?**  
A. `DATABASE_URL` 안의 비밀번호에 특수문자가 있으면, 그 문자를 **URL 인코딩**해야 합니다.  
예: `@` → `%40`, `#` → `%23`. Neon에서는 보통 특수문자 없는 비밀번호를 주므로, 가능하면 그걸 쓰는 것이 편합니다.

---

# 다른 방법 (참고)

## 로컬에서만 확인하고 싶을 때

```bash
cd /Users/myoungsookim/LLS_스코어보드/v7
npm install
npm run build
npm run start
```

브라우저에서 **http://localhost:3000** 으로 접속. (팀원은 같은 PC가 아니면 접속 불가)

## 임시로 팀원에게 링크만 공유하고 싶을 때 (테스트용)

1. 위처럼 `npm run start` 로 실행한 뒤
2. [ngrok](https://ngrok.com) 가입 후 `ngrok http 3000` 실행
3. ngrok이 알려주는 주소(예: `https://abc123.ngrok.io`)를 팀원에게 전달

※ 무료 ngrok은 실행할 때마다 주소가 바뀌므로, **테스트용**으로만 쓰는 것이 좋습니다. 계속 쓰려면 위 **가장 쉬운 방법**으로 Vercel 배포를 하는 것이 좋습니다.

---

# 문제 해결

| 증상 | 확인할 것 |
|------|------------|
| 배포 후 "Application error" | Vercel **Settings → Environment Variables**에 `DATABASE_URL`이 Neon 주소로 들어갔는지 확인. ④ 단계 마이그레이션을 실행했는지 확인. |
| "Cannot find module" | 터미널에서 `cd v7` 후 `rm -rf .next` → `npm run build` 실행. 그다음 `git add .` → `commit` → `push` 로 다시 배포. |
| GitHub push 시 비밀번호 오류 | GitHub 비밀번호 대신 **Personal access token** 사용. (GitHub → Settings → Developer settings → Personal access tokens) |

---

**요약:** ① Neon에서 DB 주소 복사 → ② GitHub에 v7 올리기 → ③ Vercel에서 Import 후 `DATABASE_URL` 넣고 Deploy → ④ 터미널에서 `DATABASE_URL="복사한주소" npx prisma migrate deploy` 한 번 실행 → 완료 후 Vercel URL을 팀원에게 공유하면 됩니다.
