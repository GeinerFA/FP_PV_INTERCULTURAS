This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

The admin workspace and persisted program flows require these environment variables:

- `MONGODB_URI`: Mongo connection used by programs and applications persistence.
- `MONGODB_SERVER_SELECTION_TIMEOUT_MS`: Optional Mongo server selection timeout override for web requests. Defaults to `2000` so connectivity failures surface quickly instead of hanging for the Mongoose 30s default.
- `APP_ORIGIN`: Canonical app origin for admin OAuth (for example `http://localhost:3000` or your public HTTPS domain). Google OAuth redirect URIs must not use a raw LAN/private IP host.
- `GOOGLE_CLIENT_ID`: Google OAuth client id for `/api/admin/auth/google`.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret for the callback exchange.
- `ADMIN_ALLOWED_EMAIL`: Single Google email allowed into `/{locale}/admin` after verification.
- `ADMIN_SESSION_SECRET`: Secret used to sign the admin session and OAuth state cookies.

Notes:

- The Google OAuth callback must allow `${APP_ORIGIN}/api/admin/auth/google/callback` in Google Cloud.
- Public program reads degrade to empty/null on Mongo connectivity or configuration failures, but admin/backend flows still throw the underlying error.
- `APP_ORIGIN` should point to `localhost` for local-machine development or to a public domain in shared environments. Raw IP origins such as `http://192.168.x.x:3001` are rejected for Google web OAuth redirect URIs.
- The current runtime locale is Spanish-only (`es`), so admin-facing runtime copy should stay aligned with that path.
- If `ADMIN_ALLOWED_EMAIL` or `ADMIN_SESSION_SECRET` is missing, the admin login flow intentionally fails with a configuration error instead of creating a partial session.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
