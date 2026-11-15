# Why I built a BigQuery analytics sink for this site

This portfolio now ships every tracked event to BigQuery - and it costs nothing.

The trick is avoiding *streaming inserts*, which are billed per byte. Instead, the
FastAPI backend buffers events in memory and flushes them through **batch load
jobs**, which are completely free:

- flush every `BQ_FLUSH_SECONDS` (default 300s) or `BQ_FLUSH_BATCH` (50) events
- failed flushes re-buffer the rows instead of dropping them
- a final flush runs at shutdown via `atexit`

Reads are protected too: every admin query sets `maximum_bytes_billed`, so a
rogue scan can never exceed the 1 TB/month free tier.

The result: real warehouse analytics on a $0 portfolio budget.
