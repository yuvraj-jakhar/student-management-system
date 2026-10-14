# 🚀 Rajasthan Institute of Engineering & Technology, Jaipur (RIET Jaipur)
## Enterprise College ERP - Deployment & Live Access Guide

---

### 🌟 Permanent 24/7 Production Cloud URLs (Laptop band hone par bhi active)

- 🚀 **Official Live Web Portal**: **[https://student-management-system-hshz.vercel.app](https://student-management-system-hshz.vercel.app)**
- ⚡ **Official Live Backend API**: **[https://student-management-system-uhej.onrender.com](https://student-management-system-uhej.onrender.com)**
- 🗄️ **Cloud Database**: MongoDB Atlas Dedicated Cluster (`student_management`)
- 📱 **Mobile & Desktop**: 100% Responsive, kisi bhi device par direct open hota hai.

---

### 🌐 Temporary Local Wi-Fi & Cloudflare Access (Development)

- 🚀 **Cloudflare Tunnel URL**: **[https://meanwhile-black-acceptable-citation.trycloudflare.com](https://meanwhile-black-acceptable-citation.trycloudflare.com)**
- 📱 **Local Wi-Fi Network URL**: `http://10.210.215.222:5173`

---

### 🔑 Demo Login Credentials

Aap in accounts se login karke check kar sakte hain:

| Role | Email ID | Password | Access Features |
|---|---|---|---|
| 👑 **Administrator** | `admin@gmail.com` | `123456` | Full ERP Control, Bulk Import, Course Approvals |
| 👨‍🏫 **Faculty / Teacher** | `dr.sharma@gmail.com` | `123456` | QR Code Projector, Proposals, Marks Entry |
| 🎓 **Student** | `aman.verma@gmail.com` | `123456` | Digital ID, Camera QR Attendance, Library, Events |
| 📚 **Librarian** | `librarian@gmail.com` | `123456` | Library Circulation, Issue/Return, Fine Tracking |

---

### ☁️ 2. Permanent 24/7 Cloud Hosting (Free & Production-Ready)

Agar aap laptop band hone ke baad bhi is project ko 24 ghante hamesha live rakhna chahte hain, to repository me ready-made deployment files add kar di gayi hain:

#### Step 1: Free Cloud Database (MongoDB Atlas)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) par free account banayein.
2. Free Shared Cluster (M0) create karein.
3. Database User banayein (username & password note karein).
4. Network Access me `0.0.0.0/0` (Allow Access from Anywhere) allow karein.
5. "Connect" -> "Drivers" par click karke connection string copy karein:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/student_management?retryWrites=true&w=majority
   ```

#### Step 2: Backend Cloud Deploy (Render.com)
1. Repository me `render.yaml` aur `Dockerfile` configured hain.
2. [Render.com](https://render.com) par GitHub se login karein.
3. **New +** -> **Web Service** select karein aur ye repo choose karein.
4. Settings:
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables me:
   - `MONGO_URL` = (Aapka MongoDB Atlas Connection String)
   - `SECRET_KEY` = `riet_enterprise_erp_secret_key_2026`
   - `ALGORITHM` = `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` = `1440`
6. Click **Deploy Web Service**. Aapko backend URL mil jayega (e.g. `https://riet-jaipur-erp.onrender.com`).

#### Step 3: Frontend Cloud Deploy (Vercel.com)
1. Repository me `sms-frontend/vercel.json` configured hai.
2. [Vercel.com](https://vercel.com) par GitHub connect karein.
3. Import Project me `sms-frontend` folder select karein.
4. Environment Variables me:
   - `VITE_API_BASE_URL` = (Render backend ka URL, e.g. `https://riet-jaipur-erp.onrender.com`)
5. Click **Deploy**. Aapka custom production frontend URL (e.g. `https://riet-erp.vercel.app`) 1 minute me live ho jayega!

---

### 🛠️ Local Terminal Commands

Backend Start:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend Start:
```bash
cd sms-frontend
npm run dev
```

Live Tunnel Start:
```bash
cd sms-frontend
node tunnel.js
```
