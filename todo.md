# Project TODO

- [x] Fix vite.config.ts (__dirname → import.meta.dirname for ESM compatibility)
- [x] Fix main.tsx - resolve merge conflict, add tRPC provider and superjson
- [x] Fix Home.tsx - remove undefined useAuth reference
- [x] Fix storageProxy.ts - add type assertion for req.params[0]
- [x] Fix Contracts.tsx - add missing ContractTemplate type and hooks to api.ts
- [x] Fix command.tsx - remove unsupported showCloseButton prop
- [x] Add vite-env.d.ts for import.meta.env type support
- [x] Update package.json scripts to use new server/_core/index.ts entry point
- [x] Verify all 19 contract templates are present in database
- [x] Verify all APIs working (clients, projects, CRM, contracts, invoices, templates)
- [x] Verify UI rendering correctly (dashboard, CRM, contracts page)
- [x] Fix pnpm-lock.yaml mismatch with package.json for deployment
- [x] Fix: deployed site shows only 5 contract templates instead of 19
- [x] Improve PDF output formatting to match original contract documents
