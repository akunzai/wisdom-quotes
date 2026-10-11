# Google Drive quote backup and restore

Design for [issue #6](https://github.com/akunzai/wisdom-quotes/issues/6), reviewed and confirmed on 2026-10-09. The issue specification records the confirmed manual backup and restore scope in place of the original cross-device sync acceptance criterion.

## Value and feasibility

The first release reduces the need to manage exported JSON files when recovering lost browser data or moving a collection to another device. Its incremental value is smaller for single-device users who already keep JSON backups. No usage evidence establishes demand or priority yet.

Manual backup and restore fit the existing static GitHub Pages deployment: Google Identity Services can issue a browser access token, and the browser can call Drive through REST and CORS. Access tokens expire and obtaining a replacement requires a user-driven event. The feature must not promise continued execution after the website closes.

The integration cost is authorization, cloud file operations, backup selection, recovery safeguards, and error handling. Bidirectional sync would additionally require deletion tracking, conflict semantics, and protection against concurrent writes. Current quote deletion physically removes rows, and JSON import merges by strictly newer `updatedAt`; neither constitutes a complete sync protocol.

## Confirmed scope

- Manual quote backup and restore; no bidirectional sync, automatic scheduling, or background execution after the website closes.
- Preserve the static deployment; no new backend or refresh-token service.
- Back up the complete quote collection and its quote fields using the existing JSON collection format. Device preferences such as language, theme, pets, and focus interval are excluded.
- Use Drive `appDataFolder` with only the `drive.appdata` scope. Backups are selected and restored through the app because this folder is hidden from the normal Drive file list.
- Each successful backup creates an independent backup version. Later backups do not overwrite earlier versions, and the first release does not automatically remove old backups.
- Preserve JSON export as an independent recovery and portability option.
- Keep access tokens only in memory for the current page session. Do not persist them in IndexedDB or local storage. Request authorization from a user action when needed; local quote management does not require Google authorization.

## Backup flow

The user requests a backup, authorizes Drive access if necessary, and the app exports the complete local quote collection to a new cloud backup version. Report success only after Drive confirms creation. A failed cloud operation must not change local quotes or existing backup versions.

## Restore flow

1. The user requests available backups and authorizes Drive access if necessary.
2. The user selects a backup version. Download and validate it before any local replacement.
3. Display its backup time, backed-up quote count, current local quote count, and a clear explanation that restore replaces the entire local collection.
4. Provide export of the current local collection. After starting the JSON download, require the user to explicitly confirm that they have saved it before enabling restore. Browser download initiation alone cannot prove the file was saved.
5. Replace the local collection in one IndexedDB transaction. Download, validation, or transaction failures leave the original collection intact.

For example, restoring a backup containing A and C over a local collection containing A and B results in A and C. Existing JSON import retains its merge behavior. Empty backup versions are valid, but the restore prompt must explicitly state that restoring them clears the local collection.

## Acceptance criteria

- A user can create an independent Drive backup and restore it from another device using the same Google account and configured application.
- Repeating backup preserves earlier backup versions.
- Backup contains all quote fields, preserves quote identities and timestamps, and excludes device preferences.
- Restore displays the selected backup's time and both collection counts before replacement.
- Restore requires exporting the current collection and explicit confirmation that it has been saved.
- A valid restore reproduces the selected collection exactly; it does not merge with local data.
- Empty-collection restore clearly warns that it clears the local collection.
- Authorization cancellation, download errors, invalid backup data, and transaction failures do not alter the local collection.
- Backup creation failure leaves previous backup versions intact and does not report success.
- Tokens are not persisted; expiry or a new page session can require another user-driven authorization request.
- Google access is optional for local quote management, and JSON import/export remains available.
- The UI does not claim cross-device sync or continuous background operation.

## Implementation verification

Follow [project verification guidance](../agents/verification.md). Exercise serialization, exact transactional replacement, invalid data, rollback, and cloud error handling with synthetic data. Browser checks should cover backup selection, export confirmation, empty restore, and authorization cancellation.

A real integration check additionally needs a configured Google Cloud project, enabled Drive API, OAuth consent configuration, web client ID, authorized origins, and a dedicated test account. Verify creation, listing, download, and restore across two independent browser storage contexts on a configured origin. Mocked APIs alone do not establish Google authorization or Drive integration feasibility in the deployed app. Mask account details and never capture tokens.

## Operational limits

Backups are not visible as ordinary Drive files, cannot be shared from `appDataFolder`, and can be removed by the user through Google's app-data controls. Independent JSON export remains useful even with cloud backup. Backup versions accumulate because automatic retention is excluded.

The documented standard Drive API usage has no additional cost, but quotas apply and Google has announced planned over-quota charging. Recheck the current terms and the actual Cloud project's quotas before release; do not promise unlimited free usage.

## Sources

- [Google Identity Services token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model): browser REST/CORS access and user-driven token renewal.
- [Google API client configuration](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid): web origins and client setup.
- [Drive application-specific data](https://developers.google.com/workspace/drive/api/guides/appdata): hidden app data, non-sensitive scope, file access, and folder restrictions.
- [Drive API quotas and pricing](https://developers.google.com/workspace/drive/api/guides/limits): current usage limits and planned charging changes.
- [Domain language](../../GLOSSARY.md).
- Repository evidence: `src/types/quote.ts`, `src/lib/storage/quotes.ts`, `src/lib/import-export/index.ts`, `src/lib/import-export/schema.ts`, and `astro.config.mjs`.
