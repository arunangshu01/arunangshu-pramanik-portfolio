"""Optional BigQuery sink for analytics events.

Cost model: events are buffered in memory and flushed as newline-delimited JSON
through BigQuery *load jobs*, which are free (streaming inserts are billed, so
they are deliberately not used). Admin reads set ``maximum_bytes_billed`` so a
query can never scan more than the configured cap — keeping the feature inside
the free tier (1 TB/month of queries, 10 GB storage). Disabled unless
ANALYTICS_SINK=bigquery.
"""
import atexit
import io
import json
import time
from collections import deque
from datetime import datetime, timezone
from functools import cached_property
from threading import Lock

from utility.logger import Logger
from utility.settings import (
    ANALYTICS_SINK,
    BQ_ANALYTICS_DATASET,
    BQ_ANALYTICS_TABLE,
    BQ_FLUSH_BATCH,
    BQ_FLUSH_SECONDS,
    BQ_MAX_BYTES_BILLED,
    GOOGLE_CLOUD_PROJECT,
)

logger = Logger(__name__)

SCHEMA = [
    ("event", "STRING"),
    ("page", "STRING"),
    ("client", "STRING"),
    ("metadata", "STRING"),
    ("timestamp", "TIMESTAMP"),
]


class NullSink:
    enabled = False

    def record(self, record: dict) -> None:
        return None

    def summary(self, days: int) -> dict | None:
        return None


class BigQueryAnalyticsSink:
    """Buffered event recorder; flushes via free batch load jobs."""

    enabled = True

    def __init__(self):
        self._buffer = deque()
        self._lock = Lock()
        self._last_flush = time.monotonic()
        atexit.register(self._flush_safely)

    @cached_property
    def client(self):
        from google.cloud import bigquery
        return bigquery.Client(project=GOOGLE_CLOUD_PROJECT)

    @cached_property
    def table_ref(self) -> str:
        return f"{self.client.project}.{BQ_ANALYTICS_DATASET}.{BQ_ANALYTICS_TABLE}"

    def record(self, record: dict) -> None:
        row = {
            "event": str(record.get("event", ""))[:64],
            "page": record.get("page"),
            "client": record.get("client"),
            "metadata": json.dumps(record.get("metadata") or {}),
            "timestamp": datetime.fromtimestamp(
                record.get("timestamp", time.time()), timezone.utc
            ).isoformat(),
        }
        with self._lock:
            self._buffer.append(row)
            due = (len(self._buffer) >= BQ_FLUSH_BATCH
                   or time.monotonic() - self._last_flush >= BQ_FLUSH_SECONDS)
        if due:
            self._flush_safely()

    def _flush_safely(self) -> None:
        try:
            self._flush()
        except Exception as error:
            logger.warning(f"BigQuery analytics flush failed ({type(error).__name__}: {error})")

    def _flush(self) -> None:
        from google.cloud import bigquery
        with self._lock:
            if not self._buffer:
                return
            rows = list(self._buffer)
            self._buffer.clear()
            self._last_flush = time.monotonic()
        if not getattr(self, "_table_ready", False):
            dataset = bigquery.Dataset(f"{self.client.project}.{BQ_ANALYTICS_DATASET}")
            self.client.create_dataset(dataset, exists_ok=True)
            table = bigquery.Table(
                self.table_ref,
                schema=[bigquery.SchemaField(name, kind) for name, kind in SCHEMA])
            self.client.create_table(table, exists_ok=True)
            self._table_ready = True
        payload = "".join(json.dumps(row) + "\n" for row in rows).encode("utf-8")
        job_config = bigquery.LoadJobConfig(
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            autodetect=True,
        )
        try:
            job = self.client.load_table_from_file(
                io.BytesIO(payload), self.table_ref, job_config=job_config)
            job.result(timeout=60)
        except Exception:
            with self._lock:
                self._buffer.extendleft(reversed(rows))
            raise
        logger.info(f"Flushed {len(rows)} analytics events to {self.table_ref}")

    def summary(self, days: int = 14) -> dict:
        """Aggregated counts. maximum_bytes_billed caps scan cost at ~zero."""
        from google.cloud import bigquery
        query = f"""
            SELECT event, DATE(timestamp) AS day, COUNT(*) AS count
            FROM `{self.table_ref}`
            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
            GROUP BY event, day
        """
        job = self.client.query(
            query,
            job_config=bigquery.QueryJobConfig(
                maximum_bytes_billed=BQ_MAX_BYTES_BILLED,
                query_parameters=[
                    bigquery.ScalarQueryParameter("days", "INT64", days),
                ],
            ),
        )
        rows = job.result(timeout=60)
        totals: dict[str, int] = {}
        daily: dict[str, int] = {}
        for row in rows:
            totals[row.event] = totals.get(row.event, 0) + row.count
            daily[str(row.day)] = daily.get(str(row.day), 0) + row.count
        return {
            "table": self.table_ref,
            "days": days,
            "totals": dict(sorted(totals.items(), key=lambda kv: kv[1], reverse=True)),
            "daily": dict(sorted(daily.items())),
            "total_events": sum(totals.values()),
        }


analytics_sink = BigQueryAnalyticsSink() if ANALYTICS_SINK == "bigquery" else NullSink()
