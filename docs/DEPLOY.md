# LLS 스코어보드 v7 — 팀 공유용 퍼블리싱 가이드

팀원들이 **브라우저로 접속**할 수 있는 **웹 주소**를 만드는 방법입니다.  
아래 **가장 쉬운 방법**만 따라 하면 됩니다.

> **퍼블리싱이 부담되면** → [README](../README.md)의 **「지금 상태 확인하기」**대로 `npm run dev` 로 로컬에서 먼저 사용하세요. (빌드 없이 바로 http://localhost:3000 에서 확인 가능)

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
5. **Configure Project** 화면에서 **Root Directory** 설정 (아래 ▼ "Root Directory 입력 방법"을 꼭 읽어 보세요).
6. **Environment Variables** 섹션으로 내려갑니다.

---

#### ▼ Root Directory 입력 방법 (입력이 안 될 때)

**먼저 확인:** GitHub 저장소에 **v7 폴더가 있고**, 그 안에 `package.json`, `app` 폴더 등이 있다면 → Root Directory를 **v7**로 설정해야 합니다.  
저장소 루트에 바로 `package.json`이 있다면( v7 폴더 없이 올린 경우 ) Root Directory는 **건드리지 않고** `./` 그대로 두면 됩니다.

Root Directory 칸이 비활성화되어 있거나 직접 입력이 안 되면 아래 순서대로 해 보세요.

**방법 1 — Edit 버튼으로 입력**

1. **Root Directory** 오른쪽에 있는 **Edit** 버튼을 클릭합니다.
2. 클릭하면 칸이 활성화되거나, 작은 창(모달)이 뜹니다.
3. **`./`** 를 지우고 **`v7`** 만 입력합니다. (앞뒤 공백 없이, 소문자 v7.)
4. **Continue** 또는 **확인** 버튼이 있으면 누릅니다.  
   없으면 그냥 다른 곳을 클릭해도 저장될 수 있습니다.
5. 다시 **Root Directory** 칸에 **v7** 이 보이면 됩니다.

**방법 2 — Edit을 눌러도 입력이 안 될 때**

- 일부 Vercel 화면에서는 **Root Directory**가 "폴더 선택" 형태일 수 있습니다.
  - **Edit** 클릭 후 **Browse** 또는 **Select directory** 같은 버튼이 있으면 누릅니다.
  - 목록에서 **v7** 폴더를 선택합니다.
- 또는 **Include source files from a subdirectory** 같은 체크박스가 있으면 체크한 뒤, 아래 나오는 입력란에 **v7** 을 넣어 봅니다.

**방법 3 — 배포 후 설정에서 바꾸기**

1. Root Directory는 **비워 두고** (즉, `./` 그대로 두고) **Deploy**를 먼저 누릅니다.
2. 배포는 실패할 수 있습니다 (루트에 package.json이 없으면). 괜찮습니다.
3. Vercel 대시보드 → 해당 프로젝트 클릭 → **Settings** 탭으로 이동.
4. 왼쪽 메뉴에서 **General** 선택.
5. **Root Directory** 항목을 찾아 **Edit** 클릭 → **v7** 입력 후 저장.
6. 상단 **Deployments** 탭 → 맨 위 배포 오른쪽 **⋯(점 3개)** → **Redeploy** 로 다시 배포합니다.

**방법 4 — GitHub 저장소 구조를 바꾸는 방법 (선택)**

- GitHub에 올릴 때 **v7 폴더 안의 파일만** 저장소 루트에 두면 Root Directory를 건드릴 필요가 없습니다.
  - 예: 새 저장소를 만든 뒤, `v7` 폴더 **안의 모든 파일**만 복사해서 루트에 올립니다 (폴더 이름 v7 없이).
  - 그러면 Vercel에서 Root Directory는 **비워 두거나 `./`** 로 두면 됩니다.

---
7. **Environment Variables** 에 변수 추가:
   - **Name:** `DATABASE_URL`  
   - **Value:** ① 단계에서 Neon에서 복사한 **Connection string 전체**를 붙여 넣기  
   - **Add** 클릭
8. 맨 아래 **Deploy** 버튼 클릭
9. 빌드가 끝날 때까지 1~2분 기다립니다.  
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

## 🔴 "여전히 안 돼" — 자주 나오는 두 가지

### 1. GitHub push 시 "Authentication failed" / "Password authentication is not supported"

**원인:** GitHub는 예전처럼 **비밀번호로 push**를 받지 않습니다. **Personal Access Token(PAT)** 이나 SSH를 써야 합니다.

**해결 순서:**

1. **GitHub에서 토큰 만들기**
   - https://github.com 로그인 → 오른쪽 위 **프로필 사진** 클릭 → **Settings**
   - 왼쪽 맨 아래 **Developer settings** → **Personal access tokens** → **Tokens (classic)** 또는 **Fine-grained tokens**
   - **Generate new token** (classic) 클릭
   - **Note:** `lls-scoreboard` 등 아무 이름
   - **Expiration:** 90 days 또는 No expiration
   - **Select scopes:** **repo** 에 체크 (저장소 전체 권한)
   - **Generate token** 클릭 후 **나온 토큰을 복사** (한 번만 보이므로 메모장에 붙여 넣기)

2. **터미널에서 push 할 때**
   - `git push -u origin main` 실행
   - **Username:** GitHub 아이디 입력
   - **Password:** 여기에 **비밀번호가 아니라 방금 복사한 토큰**을 붙여 넣기

3. **"remote origin already exists" 가 나온 경우**
   - `git remote add origin ...` 은 **다시 하지 마세요.** 이미 연결돼 있습니다.
   - 토큰만 제대로 넣고 `git push -u origin main` 만 다시 실행하면 됩니다.

---

### 2. Vercel 환경 변수에 EXAMPLE_NAME 만 있고 DATABASE_URL 이 없음

**원인:** 스코어보드 앱은 **DATABASE_URL** (Neon DB 주소)이 꼭 필요합니다. `EXAMPLE_NAME` 같은 예시 변수만 있으면 DB에 연결하지 못해 "Application error" 가 납니다.

**해결 순서:**

1. Vercel **New Project** 화면(또는 이미 만든 프로젝트 **Settings** → **Environment Variables**)으로 이동
2. **EXAMPLE_NAME** 행은 **삭제**하거나 무시
3. **Add** 또는 **+ Add More** 로 새 변수 추가:
   - **Key:** `DATABASE_URL`
   - **Value:** ① 단계에서 Neon에서 복사한 **Connection string 전체** (예: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. 저장 후 **Deploy** (새 프로젝트면 Deploy, 이미 있으면 **Redeploy**)

Neon을 아직 안 만들었다면, 가이드 ① 단계(Neon에서 DB 만들기)를 먼저 하고 위처럼 `DATABASE_URL`만 넣으면 됩니다.

---

| 증상 | 확인할 것 |
|------|------------|
| 배포 후 "Application error" | Vercel **Settings → Environment Variables**에 `DATABASE_URL`이 Neon 주소로 들어갔는지 확인. ④ 단계 마이그레이션을 실행했는지 확인. |
| "Cannot find module" | 터미널에서 `cd v7` 후 `rm -rf .next` → `npm run build` 실행. 그다음 `git add .` → `commit` → `push` 로 다시 배포. |
| GitHub push 시 비밀번호 오류 | GitHub 비밀번호 대신 **Personal access token** 사용. (위 "1. GitHub push 시" 참고) |

---

**요약:** ① Neon에서 DB 주소 복사 → ② GitHub에 v7 올리기 → ③ Vercel에서 Import 후 `DATABASE_URL` 넣고 Deploy → ④ 터미널에서 `DATABASE_URL="복사한주소" npx prisma migrate deploy` 한 번 실행 → 완료 후 Vercel URL을 팀원에게 공유하면 됩니다.
