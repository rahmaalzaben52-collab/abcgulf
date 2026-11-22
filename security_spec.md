# Security Specification — Abc Gulf Productions

## 1. Data Invariants
1. **Default Deny**: All unspecified Firestore paths reject all reads and writes.
2. **Admin-Only Mutations**: Only verified Admin users (`email_verified == true` and either the bootstrapped owner email `rakannabale100@gmail.com` or an existing `/admins/{uid}` document) may write to `/siteConfig/public` or create/update/delete `/licenses/{licenseId}`.
3. **No Privilege Escalation**: Regular signed-in users cannot create or modify `/admins/{uid}` documents or grant themselves admin privileges.
4. **Public Read Scope**: Visitors may read `/siteConfig/public` (`get` only; no collection enumeration) and read `/licenses/{licenseId}` (`get` and `list` of official non-PII license records). `/admins/{uid}` is strictly non-listable (`allow list: if false`) and readable only by the matching user (`request.auth.uid == adminId`) or bootstrapped admin.
5. **Temporal & Identity Integrity**: All writes require `updatedAt == request.time`, `createdAt == request.time` on creation, `createdAt` immutable on updates, and `updatedBy == request.auth.uid`.
6. **Strict Schema & Bounds**: Every string field enforces `.size()` bounds; unexpected/shadow keys are rejected via `keys().hasAll(...) && keys().hasOnly(...)`.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated `setDoc` on `/siteConfig/public` attempting to change `youtube` or `phone`.
2. Signed-in non-admin user (`other@gmail.com`) attempting `updateDoc` on `/siteConfig/public`.
3. Bootstrapped admin email with `email_verified: false` attempting a write (spoofed unverified email).
4. Signed-in non-admin creating `/admins/{theirUid}` with `{ email: "other@gmail.com", role: "admin" }`.
5. Unauthenticated user attempting `addDoc`/`setDoc` on `/licenses/hacked-lic`.
6. Signed-in non-admin attempting `deleteDoc` on `/licenses/lic-media-01`.
7. Admin write to `/siteConfig/public` containing a shadow field `isSuperAdmin: true`.
8. Admin write to `/licenses/lic-1` with oversized `title` (> 200 chars) or invalid `status: "unknown"`.
9. Admin write to `/licenses/lic-1` with malformed `issueDate: "2026/01/01"` failing regex `^\\d{4}-\\d{2}-\\d{2}$`.
10. Admin write attempting to spoof `updatedBy` to another UID.
11. Admin update attempting to tamper with immutable `createdAt` on `/licenses/{id}`.
12. Unauthenticated or non-admin `list` query on `/admins` or `/siteConfig`.
