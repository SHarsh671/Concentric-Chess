## For TA

The production app can be accessed at [https://capstone.mrvillage.dev](https://capstone.mrvillage.dev). There is a test user with username `test` and password `12345678`. Please reach out to me if you have any issues ([grafj1@mcmaster.ca](mailto:grafj1@mcmaster.ca)) or Josef Graf on Teams.

## Running Locally

First, copy `.dev.vars.example` to `.dev.vars` and fill in a [Resend](https://resend.com) API key (used to send email verification and password reset emails; safe to leave as a placeholder if you don't need to test emails locally — sends are skipped with a console warning when unset).

Then, run the frontend development server:

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

## Running Tests

To run unit tests, run the following commands:

```bash
npm run test
npm run test:do
```

To run integration tests, first start the frontend and backend dev servers then run:

```bash
npm run cypress:open
```
