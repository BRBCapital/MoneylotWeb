# MoneylotWeb — API Endpoints (by flow)

This document lists **every HTTP endpoint this web app can call** (implemented under `src/services/*` and used by pages/components).

## Base URL

All **relative** endpoints are called via:

- `API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || https://brbmoneylotwebapi-ezavaeh4a8egdjhk.southafricanorth-01.azurewebsites.net`

Auth behavior:

- Automatically attaches `Authorization: Bearer <token>` when available.
- Any **401** triggers logout + redirect to `/login`.

## Flows

### Login (`/login`)

- `POST /api/v1/security/login`

### Onboarding / Get Started (`/get-started`)

**Stage 1 — Account Creation**

- `GET /api/v1/account/types`
- `POST /api/v1/signup/account-creation-web`

**Email OTP modal**

- `POST /api/v1/otp/web-generate-otp`
- `POST /api/v1/otp/web-validate-otp`

**Stage 2 — Identity & Address**

- `GET /api/v1/verification/get-country`
- `POST /api/v1/webinvestment/validate-identity-address`

**Stage 3 — Bank Details**

- `GET /api/v1/withdrawal/get-banks`
- `POST /api/v1/withdrawal/validate-account`
- `POST /api/v1/withdrawal/create`
- `POST /api/v1/pin/create`

**Stage 4/5 — Create Investment**

- `GET /api/v1/webinvestment/get-rate`
- `POST /api/v1/webinvestment/get-expected-return`
- `POST /api/v1/webinvestment/create`

**Stage 6 — Initiate Payment**

- `POST /api/v1/investment/fund`

### Dashboard — Portfolio (`/dashboard`)

- `POST /api/v1/webinvestment/get-portfolio-summary`
- `POST /api/v1/webinvestment/get-investment-list`

### Dashboard — Investment Details (`/dashboard/investments/[id]`)

- `GET /api/v1/webinvestment/get-investment-detail/{investmentId}`

### Dashboard — New Investment (`/dashboard/new-investment`)

- `GET /api/v1/webinvestment/get-rate`
- `POST /api/v1/webinvestment/get-expected-return`
- `POST /api/v1/webinvestment/create`
- `POST /api/v1/investment/fund`

### Dashboard — Transactions (`/dashboard/transactions`)

- `POST /api/v1/webinvestment/get-transaction-list`

### Dashboard — Withdrawals (`/dashboard/withdrawals`, `/dashboard/withdrawals/[id]`, `/dashboard/withdrawals/[id]/confirm`)

**Eligible investments**

- `GET /api/v1/webinvestment/get-withdrawal-eligible`

**Request withdrawal breakdown**

- `POST /api/v1/webinvestment/withdrawal-request`

**Finalize withdrawal**

- `POST /api/v1/investment/withdrawal`

**Supporting (bank account fallback)**

- `GET /api/v1/withdrawal/get`

### Dashboard — Rollover (`/dashboard/investments/[id]/rollover`)

- `GET /api/v1/webinvestment/get-rate`
- `GET /api/v1/webinvestment/get-investment-detail/{investmentId}`
- `POST /api/v1/webinvestment/get-expected-return`
- `POST /api/v1/investment/reinvest`

### Dashboard — Profile / Bank Accounts (`/dashboard/profile`)

**Personal details**

- `GET /api/v1/accountManagement/get-personal-detail`

**Withdrawal accounts**

- `GET /api/v1/withdrawal/get`

**Add New Account modal**

- `GET /api/v1/withdrawal/get-banks`
- `POST /api/v1/withdrawal/validate-account`
- `POST /api/v1/withdrawal/create`

### Dashboard — Settings (`/dashboard/settings`)

**Password settings**

- `POST /api/v1/webinvestment/change-password`

**Change Transaction PIN**

- `POST /api/v1/pin/update`

**Reset Transaction PIN**

- `POST /api/v1/otp/web-generate-otp`
- `POST /api/v1/otp/web-validate-otp`
- `POST /api/v1/pin/reset-pin`

### Identity Verification (modal)

- `GET /api/v1/verification/get-identity-type`
- `POST /api/v1/verification/verify-NIN`

External upload (used by the verification modal):

- `POST https://www.filestackapi.com/api/store/S3?key=AvAAxXFCT7CEcaQE74ks7z`

### Forgot Password (`/forgot-password`, `/forgot-password/otp`)

- `POST /api/v1/otp/web-generate-otp`
- `POST /api/v1/otp/web-validate-otp`

Note: the current “Reset Password” screen is UI-only (no backend password reset call is implemented yet).

## Present in services but not currently referenced by UI

- `POST /api/v1/otp/generate`
- `POST /api/v1/otp/validate/{userId}`
