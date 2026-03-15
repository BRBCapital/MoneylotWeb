# Azure CI/CD (GitHub → Azure App Service)

This repo is configured to deploy automatically to **Azure App Service** using **GitHub Actions**.

## 1) Azure prerequisites

- Create an **Azure App Service (Linux, Node)** for this Next.js app.
- In the Web App, set environment variables (App Settings):
  - `NEXT_PUBLIC_API_BASE_URL` = your API base URL
  - `NODE_ENV` = `production`
  - Optional but recommended for App Service build-on-deploy:
    - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`

## 2) GitHub secrets (required)

In GitHub → **Repo Settings → Secrets and variables → Actions**, add:

- `AZURE_WEBAPP_NAME`: Your Azure Web App name (e.g. `moneylot-web-prod`)
- `AZURE_WEBAPP_PUBLISH_PROFILE`: From Azure Portal → Web App → **Get publish profile**

## 3) Workflow

The workflow file is:

- `.github/workflows/azure-appservice-deploy.yml`

It deploys on:

- `push` to `main`
- manual run (`workflow_dispatch`)

## Notes

- If you prefer **OIDC** instead of publish-profile secrets, we can switch the workflow to `azure/login` + `azure/webapps-deploy` using a Federated Credential.

