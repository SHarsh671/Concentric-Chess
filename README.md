## Getting Started

First, run the frontend development server:

```bash
npx wrangler d1 migrations apply capstone --local
npm run dev
```

Next, run the backend development server (in a separate terminal):

```bash
cd do
npx wrangler dev --local --persist-to ../.wrangler/state
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
