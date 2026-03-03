# DevCloud v0.1 (Feature scope v0.5)

DevCloud is a lightweight self-hosted control panel for files, media and developer operations with:
- Node.js + Fastify backend
- React + TailwindCSS frontend
- Flutter mobile starter
- SQLite storage

## Repository layout

```
devcloud/
 ├── server/           Backend API
 ├── client/           React admin panel
 ├── mobile/flutter_app Flutter mobile app starter
 └── docker-compose.yml
```

## Backend setup

1. Install dependencies

```bash
cd server
npm install
```

2. Copy environment variables

```bash
copy .env.example .env
```

3. Initialize database

```bash
npm run db:init
```

4. Start API

```bash
npm run dev
```

API default URL: `http://localhost:4000/api`

### Main endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /files`
- `POST /files/upload`
- `PATCH /files/:fileId/rename`
- `DELETE /files/:fileId`
- `POST /files/:fileId/share`
- `GET /files/shared/:token`
- `GET /media/video/:fileId`
- `POST /media/video/:fileId/transcode`
- `GET /dashboard/overview`
- `GET /dev/system-stats`
- `GET /dev/docker/containers`
- `GET /dev/git-status`
- WebSocket: `GET /api/ws/logs`

## Frontend setup

```bash
cd client
npm install
npm run dev
```

UI default URL: `http://localhost:5173`

If needed, override API URL:

```bash
set VITE_API_URL=http://localhost:4000/api
```

## Mobile setup

```bash
cd mobile/flutter_app
flutter pub get
flutter run
```

> The app expects backend on `http://localhost:4000/api` by default.
>
> Feature set (mobile):
> - login + JWT persistence
> - dashboard stats
> - file browsing with folder filter
> - upload and delete files
> - generate/copy share links
> - direct video streaming in app

## Production install on server

```bash
cd /path/to/devcloud
chmod +x install.sh
./install.sh
```

Skrypt `install.sh`:

- sprawdza dostępną wersję Docker Compose,
- tworzy `server/.env` na podstawie `server/.env.example`,
- nadpisuje losowe sekrety JWT,
- buduje i uruchamia kontenery (`server`, `client`).

Przydatne komendy:

```bash
./install.sh status
./install.sh restart
./install.sh stop
```

## Docker

From repository root:

```bash
docker-compose up --build
```

Services:
- API: `http://localhost:4000`
- UI: `http://localhost:8080`

## Security notes

- Use strong secrets in `.env`.
- Add HTTPS in production reverse proxy.
- Keep `JWT_REFRESH_SECRET` and `JWT_ACCESS_SECRET` secret.

## Notes for v1.0

The backend includes a runtime plugin loader (`server/services/plugin-loader.service.js`) that loads optional modules from `plugins/` directory.
This can be used for feature extension and external integrations.

### Mobile feature set

The Flutter starter now includes:
- Login with JWT persistence
- Dashboard stats
- File list
- Upload and delete file actions
- Share links for files
- In-app video playback from protected stream endpoint
- Folder filter and upload path targeting in file list
