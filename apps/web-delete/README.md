# Web deletion page

Static page for the Play Store "data deletion" requirement:
`apps/web-delete/index.html` — host it at `https://dalex.app/delete`
(any static host works; the in-app route is Settings → Delete account,
which calls the `deleteAccount` Cloud Function).

The page offers deletion by email to `privacy@dalex.app` (update the
address when the real support mailbox exists) and documents what is erased.
