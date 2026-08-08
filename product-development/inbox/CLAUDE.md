# Inbox — integration drop zone

Files from meeting-transcription integrations (Zoom, Fireflies, Otter, Granola, Meet,
Teams — any tool that can drop a file, e.g. via an n8n webhook flow) land here for the
next `/context-update` sweep. A human can also drop a file here by hand. Pasting a
transcript in chat needs no file at all — `/process-meeting` takes it directly.

**Read this when:** You are wiring an integration to deliver transcripts, or wondering why
a file is sitting here.

## Arrival contract

- **Accepted:** `.md`, `.txt`, `.pdf`, `.docx`. Convert other formats (e.g. a `.vtt`
  subtitle file) before dropping — other extensions are invisible to the sweep.
- **Filename hint (recommended, not required):** `{YYYY-MM-DD}-{account-or-meeting-type}-{topic}.ext`.
  Integration filenames vary; date and classification are inferred from content when the
  hint is absent.
- **Lifecycle:** files here are **staging, not raw material**. `/context-update` sweeps
  discover them, gate junk and duplicates, and delegate the rest to `/process-meeting`,
  which detects the category, **moves** the file to its canonical `*/transcripts/` home,
  writes the summary, and ledgers the destination path. The inbox trends toward empty.
- **Junk / duplicates** are ledgered under their inbox path and left here — delete the
  file and its `governance/processed.txt` line together.
- **Unclassifiable files** (unknown account, no matching meeting type) stay here, are
  named in every sweep's run summary, and keep the session-start fold-backlog count
  nonzero until someone renames, files, or deletes them.

No per-file list is kept here — contents are transient by design.
