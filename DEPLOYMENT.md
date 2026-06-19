# TeamCRM Deployment

## Localhost

Backend:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Backend health: `http://localhost:5000/`

## MongoDB Atlas

Create an Atlas cluster and set `MONGODB_URI` on Render:

```env
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@cluster0.utvatqi.mongodb.net/?appName=Cluster0
```

Allow Render to connect by adding Render outbound IPs to Atlas, or use `0.0.0.0/0` during initial testing and tighten it later.

## Render Backend

Use the root `render.yaml` blueprint, or create a Web Service manually:

- Root directory: `backend`
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/`

Do not use `npm build` as the Render build command. The correct command is `npm ci --include=dev && npm run build`.

Required Render environment variables:

```env
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
CLIENT_URL=https://<your-vercel-app>.vercel.app
CORS_ORIGIN=https://<your-vercel-app>.vercel.app
```

Optional:

```env
REDIS_URL=<redis connection string>
```

## Vercel Frontend

Import the repo in Vercel and set the project root directory to `frontend`.

Required Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://<your-render-service>.onrender.com
```

After Vercel gives you the final frontend URL, update Render's `CLIENT_URL` and `CORS_ORIGIN` to match it, then redeploy the backend.

## Notes

- Email is currently mocked and logs verification/reset/invite links in the backend console.
- Uploaded files are stored on the backend filesystem. Render's filesystem is ephemeral, so use object storage before relying on uploads in production.
