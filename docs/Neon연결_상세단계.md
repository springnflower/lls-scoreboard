# Neon DB 연결하기 — 2단계부터 자세히

Neon 화면에서 **Connect to your database** 창까지 열어두신 상태에서 아래를 따라 하시면 됩니다.

---

## 2단계: 연결 주소(Connection string) 복사하기

1. **Show password** 버튼을 클릭합니다.  
   → 비밀번호가 `****` 대신 **실제 문자**로 보여야 합니다. (한 번만 보여주는 경우도 있으니 이때 복사하는 게 좋습니다.)

2. **Connection string** 아래에 있는 긴 주소 **전체**를 드래그해서 선택한 뒤 **복사(Cmd+C)** 합니다.  
   또는 **Copy snippet** 버튼이 있으면 그걸 눌러도 됩니다.

   복사된 내용은 대략 이런 형태입니다 (비밀번호는 여러 글자로 보입니다):
   ```
   postgresql://neondb_owner:실제비밀번호글자들@ep-muddy-resonance-addn9se8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

3. **중요:** 비밀번호가 `****************` 처럼 가려진 채로 복사되면 나중에 접속이 안 됩니다.  
   반드시 **Show password**를 누른 뒤, **실제 비밀번호가 보인 상태에서** 위 주소 전체를 다시 복사하세요.

---

## 3단계: Cursor에서 `.env` 파일 열기

1. Cursor 왼쪽 **파일 탐색기(Explorer)** 를 엽니다.  
   (열려 있지 않다면 상단 메뉴 **View → Explorer** 또는 단축키로 열 수 있습니다.)

2. **LLS_스코어보드** 폴더를 펼친 다음, 그 안에 있는 **v7** 폴더를 클릭해 펼칩니다.

3. **v7** 폴더 안에서 **`.env`** 파일을 찾아 **클릭**해서 엽니다.  
   - `.env`가 안 보이면: 숨김 파일이 보이도록 설정되어 있는지 확인하세요.  
   - `.env` 파일이 아예 없으면: **`.env.example`** 파일을 **우클릭 → Copy** 한 뒤 **Paste** 하면 `.env.example` 복사본이 생깁니다. 그 파일 이름을 **`.env`** 로 바꿔서 사용하세요.

4. 열린 `.env` 파일 내용이 에디터에 보이면 4단계로 넘어갑니다.

---

## 4단계: `.env` 내용 수정하기

1. `.env` 파일에서 **맨 위쪽**에 있는 다음 줄을 찾습니다.  
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/lls_scoreboard?schema=public"
   ```

2. **그 줄 전체**를 선택한 뒤 **삭제**합니다.

3. **같은 자리**에 아래 한 줄을 **새로 입력**합니다.  
   (2단계에서 복사한 Neon 연결 주소를 **그대로** 붙여넣습니다.)

   ```
   DATABASE_URL="여기에_2단계에서_복사한_전체_주소_붙여넣기"
   ```

   **붙여넣기 할 때 주의할 점:**
   - 맨 앞에 `DATABASE_URL="` 를 쓰고, 그 다음에 **복사한 주소**를 붙여넣고, 맨 끝에 `"` 를 넣어야 합니다.
   - 또는 복사한 주소가 이미 `postgresql://...` 로 시작하면, 아래처럼 한 줄로 만들면 됩니다.
     ```
     DATABASE_URL="postgresql://neondb_owner:실제비밀번호@ep-muddy-resonance-addn9se8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
     ```
   - **반드시 따옴표(`"`)로 감싸야** 합니다.  
   - 비밀번호에 특수문자(`#`, `@` 등)가 있으면 그대로 두고, 따옴표만 바깥에 하나씩 있는지 확인하세요.

4. **다른 줄은 건드리지 않아도 됩니다.**  
   `NEXT_PUBLIC_APP_NAME` 이나 `# Optional...` 같은 줄은 그대로 두세요.

5. **저장**합니다.  
   - **Cmd + S** (Mac) 또는 **Ctrl + S** (Windows)  
   - 또는 메뉴 **File → Save**

---

## 5단계: 터미널에서 마이그레이션 실행하기

1. Cursor 하단 **터미널(Terminal)** 을 엽니다.  
   (메뉴 **Terminal → New Terminal** 또는 단축키로 열 수 있습니다.)

2. 아래 명령을 **순서대로** 입력하고 Enter를 누릅니다.

   ```bash
   cd /Users/myoungsookim/LLS_스코어보드/v7
   ```

   그 다음:

   ```bash
   npm run prisma:migrate
   ```

3.  
   - **성공하면:** 터미널에 마이그레이션 적용 메시지가 나오고, 에러 없이 끝납니다.  
   - **실패하면:**  
     - `Can't reach database server at 'localhost:5433'` → `.env`가 아직 로컬 주소를 쓰고 있거나 저장이 안 된 경우입니다. 3·4단계를 다시 확인하고 저장 후 다시 실행하세요.  
     - `password authentication failed` → Neon에서 **Show password** 후 복사한 **전체 연결 주소**가 `.env`에 정확히 들어갔는지 확인하세요.

---

## 정리

- **2단계:** Neon에서 **Show password** → 연결 주소 **전체** 복사  
- **3단계:** Cursor에서 **v7** 폴더의 **`.env`** 파일 열기  
- **4단계:** `DATABASE_URL="..."` 줄을 **복사한 주소로 교체** 후 **저장**  
- **5단계:** 터미널에서 `cd ... v7` → `npm run prisma:migrate` 실행  

여기까지 되면 이후에는 `npm run dev` 또는 `npm run dev:3002` 로 앱을 실행하고 스코어보드 업로드를 사용하시면 됩니다.
