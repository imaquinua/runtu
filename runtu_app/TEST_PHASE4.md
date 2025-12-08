# Phase 4 Validation - Proactive Intelligence Features

## Overview

This document contains all testing materials for validating Phase 4: Proactive Intelligence features including Summaries, Alerts, and Reports systems.

---

## 1. Validation Checklist

### 1.1 Summaries System

| # | Feature | Expected Result | Status |
|---|---------|-----------------|--------|
| 1.1 | GET /api/summaries | Returns array of summaries | [ ] |
| 1.2 | POST /api/summaries | Generates new summary with Claude | [ ] |
| 1.3 | PATCH /api/summaries/[id] | Marks summary as read | [ ] |
| 1.4 | Weekly summary generation | Aggregates 7 days of data | [ ] |
| 1.5 | Daily summary generation | Aggregates 1 day of data | [ ] |
| 1.6 | Highlights extraction | Returns top 3-5 highlights | [ ] |
| 1.7 | Empty data handling | Returns appropriate message | [ ] |
| 1.8 | RLS policies | User only sees own data | [ ] |

### 1.2 Alerts System

| # | Feature | Expected Result | Status |
|---|---------|-----------------|--------|
| 2.1 | GET /api/alerts | Returns array of alerts | [ ] |
| 2.2 | PATCH /api/alerts/[id] | Marks alert as seen | [ ] |
| 2.3 | DELETE /api/alerts/[id] | Dismisses alert | [ ] |
| 2.4 | Priority levels | Displays high/medium/low correctly | [ ] |
| 2.5 | Alert types | All types (anomaly, trend, action, insight) work | [ ] |
| 2.6 | Unread count | Badge shows correct count | [ ] |
| 2.7 | RLS policies | User only sees own alerts | [ ] |

### 1.3 Reports System

| # | Feature | Expected Result | Status |
|---|---------|-----------------|--------|
| 3.1 | GET /api/reports | Returns list of reports | [ ] |
| 3.2 | POST /api/reports | Generates new report | [ ] |
| 3.3 | GET /api/reports/[id] | Returns single report | [ ] |
| 3.4 | GET /api/reports/[id]?format=html | Returns HTML export | [ ] |
| 3.5 | GET /api/reports/[id]?format=md | Returns Markdown export | [ ] |
| 3.6 | DELETE /api/reports/[id] | Deletes report | [ ] |
| 3.7 | Executive report type | 1-page summary format | [ ] |
| 3.8 | Detailed report type | Full analysis format | [ ] |
| 3.9 | Financial report type | Bank-ready format | [ ] |
| 3.10 | Operational report type | Operations focus | [ ] |
| 3.11 | Custom report type | Selectable sections | [ ] |
| 3.12 | Period: last_week | Correct date range | [ ] |
| 3.13 | Period: last_month | Correct date range | [ ] |
| 3.14 | Period: last_quarter | Correct date range | [ ] |
| 3.15 | Period: last_year | Correct date range | [ ] |
| 3.16 | Period: custom | Custom date range | [ ] |
| 3.17 | RLS policies | User only sees own reports | [ ] |

### 1.4 Chat Integration

| # | Feature | Expected Result | Status |
|---|---------|-----------------|--------|
| 4.1 | Report intent detection | "genera reporte" triggers report | [ ] |
| 4.2 | Type extraction from chat | "reporte ejecutivo" → executive | [ ] |
| 4.3 | Period extraction from chat | "del mes pasado" → last_month | [ ] |
| 4.4 | Report delivery in chat | Report appears in conversation | [ ] |

### 1.5 UI/UX

| # | Feature | Expected Result | Status |
|---|---------|-----------------|--------|
| 5.1 | /app/resumenes page | Loads without errors | [ ] |
| 5.2 | /app/alertas page | Loads without errors | [ ] |
| 5.3 | /app/reportes page | Loads without errors | [ ] |
| 5.4 | /app/reportes/[id] page | Report detail loads | [ ] |
| 5.5 | Generate Report modal | Opens and submits | [ ] |
| 5.6 | Report preview | Renders markdown correctly | [ ] |
| 5.7 | Export buttons | Download works | [ ] |
| 5.8 | Mobile responsiveness | All pages work on mobile | [ ] |

---

## 2. SQL Diagnostic Queries

Run these queries in Supabase SQL Editor to verify database state.

### 2.1 Table Existence

```sql
-- Verify all Phase 4 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('summaries', 'alerts', 'reports');
```

### 2.2 Summaries Statistics

```sql
-- Count summaries by type and status
SELECT
  type,
  is_read,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM summaries
GROUP BY type, is_read
ORDER BY type, is_read;
```

```sql
-- Recent summaries with highlights
SELECT
  id,
  type,
  period_start,
  period_end,
  highlights,
  is_read,
  created_at
FROM summaries
ORDER BY created_at DESC
LIMIT 10;
```

### 2.3 Alerts Statistics

```sql
-- Count alerts by type, priority and status
SELECT
  type,
  priority,
  is_seen,
  is_dismissed,
  COUNT(*) as count
FROM alerts
GROUP BY type, priority, is_seen, is_dismissed
ORDER BY priority DESC, type;
```

```sql
-- Active alerts (not dismissed)
SELECT
  id,
  type,
  priority,
  title,
  is_seen,
  created_at
FROM alerts
WHERE is_dismissed = false
ORDER BY
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  created_at DESC
LIMIT 20;
```

```sql
-- Alert distribution by business
SELECT
  b.name as business_name,
  COUNT(a.id) as total_alerts,
  COUNT(CASE WHEN a.priority = 'high' THEN 1 END) as high_priority,
  COUNT(CASE WHEN a.is_seen = false THEN 1 END) as unread
FROM businesses b
LEFT JOIN alerts a ON a.business_id = b.id AND a.is_dismissed = false
GROUP BY b.id, b.name
ORDER BY total_alerts DESC;
```

### 2.4 Reports Statistics

```sql
-- Count reports by type and period
SELECT
  type,
  period,
  COUNT(*) as count,
  MAX(generated_at) as latest
FROM reports
GROUP BY type, period
ORDER BY type, period;
```

```sql
-- Recent reports
SELECT
  id,
  type,
  period,
  title,
  LENGTH(content) as content_length,
  generated_at
FROM reports
ORDER BY generated_at DESC
LIMIT 10;
```

```sql
-- Reports per business
SELECT
  b.name as business_name,
  COUNT(r.id) as total_reports,
  COUNT(CASE WHEN r.type = 'executive' THEN 1 END) as executive,
  COUNT(CASE WHEN r.type = 'financial' THEN 1 END) as financial
FROM businesses b
LEFT JOIN reports r ON r.business_id = b.id
GROUP BY b.id, b.name
ORDER BY total_reports DESC;
```

### 2.5 RLS Policy Verification

```sql
-- Check RLS is enabled on tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('summaries', 'alerts', 'reports');
```

```sql
-- List RLS policies
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('summaries', 'alerts', 'reports');
```

### 2.6 Database Functions

```sql
-- List Phase 4 functions
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'cleanup_expired_summaries',
  'cleanup_expired_reports',
  'get_unread_summary_count',
  'get_unseen_alerts_count',
  'get_recent_alerts',
  'get_recent_summaries',
  'get_recent_reports'
);
```

### 2.7 Data Integrity

```sql
-- Check for orphaned records (no business)
SELECT 'summaries' as table_name, COUNT(*) as orphans
FROM summaries s
LEFT JOIN businesses b ON s.business_id = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 'alerts', COUNT(*)
FROM alerts a
LEFT JOIN businesses b ON a.business_id = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 'reports', COUNT(*)
FROM reports r
LEFT JOIN businesses b ON r.business_id = b.id
WHERE b.id IS NULL;
```

---

## 3. Test Cases

### 3.1 Summary Generation Test Cases

| Case | Input | Expected Output |
|------|-------|-----------------|
| TC-S01 | POST weekly summary with data | Summary with highlights array |
| TC-S02 | POST weekly summary without data | Summary with "no data" message |
| TC-S03 | POST daily summary | Single day summary |
| TC-S04 | GET summaries empty | Empty array [] |
| TC-S05 | GET summaries with data | Array of SummaryListItem |
| TC-S06 | PATCH mark as read | is_read becomes true |
| TC-S07 | PATCH already read | No error, stays read |

### 3.2 Alert Test Cases

| Case | Input | Expected Output |
|------|-------|-----------------|
| TC-A01 | GET alerts empty | Empty array [] |
| TC-A02 | GET alerts with filters | Filtered results |
| TC-A03 | PATCH mark as seen | is_seen becomes true |
| TC-A04 | DELETE dismiss alert | Alert removed from active list |
| TC-A05 | High priority alert | Shows correct icon/style |
| TC-A06 | Alert with action_url | Link is clickable |
| TC-A07 | Alert with metadata | Metadata displayed |

### 3.3 Report Test Cases

| Case | Input | Expected Output |
|------|-------|-----------------|
| TC-R01 | POST executive report | 1-page markdown summary |
| TC-R02 | POST detailed report | Multi-section analysis |
| TC-R03 | POST financial report | Bank-ready metrics |
| TC-R04 | POST operational report | Operations focus |
| TC-R05 | POST custom report | Selected sections only |
| TC-R06 | GET report HTML export | Full HTML document |
| TC-R07 | GET report MD export | Markdown with frontmatter |
| TC-R08 | POST report no data | Report with "insufficient data" |
| TC-R09 | DELETE report | 204 No Content |
| TC-R10 | GET deleted report | 404 Not Found |

### 3.4 Integration Test Cases

| Case | Input | Expected Output |
|------|-------|-----------------|
| TC-I01 | Chat: "genera reporte ejecutivo" | Report generated |
| TC-I02 | Chat: "reporte del mes pasado" | last_month period |
| TC-I03 | Chat: "análisis financiero" | financial type |
| TC-I04 | Chat: "resumen de la semana" | Weekly summary |
| TC-I05 | Chat: unrelated message | Normal response |

---

## 4. Cron Job Testing

### 4.1 Summary Generation Cron

The summary cron should generate periodic summaries. Test manually:

```bash
# Test cron endpoint locally
curl -X POST http://localhost:3000/api/cron/summaries \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected behavior:**
- Generates summaries for businesses with recent activity
- Skips businesses without data in the period
- Logs generation results

### 4.2 Alerts Analysis Cron

```bash
# Test alerts analysis
curl -X POST http://localhost:3000/api/cron/alerts \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected behavior:**
- Analyzes conversations for anomalies
- Creates alerts based on patterns
- Assigns correct priority levels

### 4.3 Cleanup Cron

```bash
# Test cleanup of expired records
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Expected behavior:**
- Removes summaries past expires_at
- Removes reports past expires_at
- Returns count of deleted records

### 4.4 Vercel Cron Configuration

Verify `vercel.json` contains:

```json
{
  "crons": [
    {
      "path": "/api/cron/summaries",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/alerts",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

---

## 5. Metrics to Monitor

### 5.1 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Summary generation time | < 10s | API response time |
| Report generation time | < 30s | API response time |
| Alert analysis time | < 5s per business | Cron execution time |
| Database query time | < 100ms | Supabase logs |

### 5.2 Usage Metrics

| Metric | Query |
|--------|-------|
| Summaries generated/day | `SELECT DATE(created_at), COUNT(*) FROM summaries GROUP BY 1` |
| Reports generated/day | `SELECT DATE(generated_at), COUNT(*) FROM reports GROUP BY 1` |
| Alerts created/day | `SELECT DATE(created_at), COUNT(*) FROM alerts GROUP BY 1` |
| Read rate (summaries) | `SELECT COUNT(*) FILTER (WHERE is_read) * 100.0 / COUNT(*) FROM summaries` |
| Seen rate (alerts) | `SELECT COUNT(*) FILTER (WHERE is_seen) * 100.0 / COUNT(*) FROM alerts` |

### 5.3 Error Metrics

| Metric | Source |
|--------|--------|
| Generation failures | Application logs |
| Claude API errors | Claude API response codes |
| Database errors | Supabase logs |
| Export failures | Application logs |

### 5.4 Business Metrics

| Metric | Description |
|--------|-------------|
| Report types distribution | Which types are most used |
| Period preferences | Which periods users prefer |
| Alert engagement | How many alerts lead to action |
| Summary usefulness | Read rate over time |

---

## 6. Running Tests

### 6.1 Automated Test Script

```bash
# Install dependencies
npm install dotenv

# Set environment variables
export TEST_BASE_URL="http://localhost:3000"
export TEST_AUTH_TOKEN="your-test-user-token"

# Run tests
npx ts-node scripts/test-proactive.ts
```

### 6.2 Manual API Testing

Using cURL:

```bash
# List summaries
curl http://localhost:3000/api/summaries \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Generate summary
curl -X POST http://localhost:3000/api/summaries \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly"}'

# List alerts
curl http://localhost:3000/api/alerts \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Generate report
curl -X POST http://localhost:3000/api/reports \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "executive", "period": "last_week"}'

# Export report
curl "http://localhost:3000/api/reports/REPORT_ID?format=html" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

### 6.3 Browser Testing

1. Open Chrome DevTools Network tab
2. Navigate to each page
3. Verify API calls succeed (200 status)
4. Check console for JavaScript errors
5. Test all interactive elements

---

## 7. Troubleshooting

### 7.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid/expired token | Re-login, check cookie |
| 403 Forbidden | RLS policy blocking | Verify business_id ownership |
| 404 Not Found | Missing record or route | Check ID exists, check API route |
| 500 Server Error | Backend error | Check server logs |
| Empty results | No data for period | Verify data exists in period |
| Slow generation | Claude API latency | Check API status, retry |

### 7.2 Debug Queries

```sql
-- Check user's business access
SELECT
  u.email,
  b.id as business_id,
  b.name as business_name
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN businesses b ON b.id = ur.business_id
WHERE u.email = 'test@example.com';

-- Check recent errors in logs
SELECT *
FROM pg_stat_activity
WHERE state = 'active'
AND query LIKE '%summaries%' OR query LIKE '%alerts%' OR query LIKE '%reports%';
```

---

## 8. Sign-off

| Reviewer | Date | Status |
|----------|------|--------|
| Developer | | [ ] Passed |
| QA | | [ ] Passed |
| Product | | [ ] Approved |

---

*Document generated for Runtu Phase 4: Proactive Intelligence Features*
