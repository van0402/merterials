# Errors

Command failures and integration errors.

---


## 2026-07-31 14:14 - Refferq Socket.IO custom server crash

- Context: Tried to switch Next dev script from next dev to tsx server.ts to host Socket.IO beside Next 16.
- Failure: Docker app restarted in a loop with Invariant AsyncLocalStorage accessed in runtime where it is not available from Next app-render async-local-storage under Node 20.
- Lesson: For this project, do not replace next dev with a TSX custom Next server without validating Next 16 runtime compatibility. Prefer keeping Next dev stable and use a separate realtime sidecar or fallback REST/polling first.

## 2026-08-01 - PowerShell command separator
- Context: While verifying Refferq auth changes, command failed because this PowerShell host did not accept bash-style &&.
- Fix: Run sequential commands with semicolons or separate exec calls in Windows PowerShell.

