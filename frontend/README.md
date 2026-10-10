# Frontend

LeetCode Progress web app — a React + Vite single-page application, served as
static files from S3 + CloudFront. Design direction is locked in
[`DESIGN.md`](./DESIGN.md) ("Nordic").

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn-style components (Radix primitives)
- TanStack Query (server state) · React Router
- Recharts (visualization) · react-oidc-context (Cognito auth)
- Vitest + React Testing Library + MSW (tests at the network boundary)

## Development

```bash
npm install
npm run dev        # Vite dev server
npm run build      # typecheck + production build → dist/
npm run preview    # preview the production build
npm test           # run the test suite (vitest)
npm run lint       # eslint
npm run format     # prettier --write
```

Configuration (API base URL, Cognito authority/client id) comes from Vite env
vars in `.env` (dev) and `.env.production` (prod); see `src/config/env.ts`.

## Deploy

`npm run build` emits static assets to `dist/`, which the CDK
`FrontendCdkStack` uploads to S3 and invalidates in CloudFront. Build the
frontend before `cdk deploy`.
