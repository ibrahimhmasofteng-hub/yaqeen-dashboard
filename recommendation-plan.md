# Student Follow-Up Module

Provides recitation analysis and automated recommendations for students based on their recitation errors.

## Endpoints

All endpoints require `READ_STUDENT_FOLLOW_UP` permission.

### `GET /:studentId/recommendations`

Analyzes a student's recitations and returns recommendations.

| Query    | Type     | Required | Description               |
| -------- | -------- | -------- | ------------------------- |
| courseId | `string` | No       | Filter by specific course |

**Response:** `RecommendationResponseDTO`

- `pagesToReview` — Pages with BAD evaluations, Tajweed, Pronunciation, or Diacritical errors (prioritized)
- `pagesToMemorize` — Pages with Memorization errors
- `errorTypeSummary` — Error count per error type
- `weakSurahs` — Surahs sorted by error count descending

### `GET /:studentId/juzz-test`

Returns priority-scored Juzz test analysis per surah for focused revision.

| Query    | Type     | Required | Description               |
| -------- | -------- | -------- | ------------------------- |
| courseId | `string` | No       | Filter by specific course |

**Response:** `JuzzTestResponseDTO`

- `recommendations` — Per-surah analysis with `priorityScore`, `totalErrors`, and top 10 `problematicVerses`
- `totalErrorsFound` — Grand total of errors

> Scoring: BAD evaluation → base 5, otherwise 1. Severity multiplier: CRITICAL ×3, MAJOR ×2, MINOR ×1.

### `POST /:studentId/send-recommendation`

Generate and send a recommendation notification to the student immediately.

| Query    | Type     | Required | Description               |
| -------- | -------- | -------- | ------------------------- |
| courseId | `string` | No       | Filter by specific course |

**Response:** `{ message: "Recommendation notification sent" }`

## Automated Cron Job

Runs **every Monday at 10:00 AM** (`0 10 * * 1`).

- Fetches all students with at least one recitation error
- Generates recommendations per student
- Skips students with empty recommendations
- Sends `RECITATION_RECOMMENDATION` notification with top 5 review pages, top 5 memorize pages, and top 3 weak surahs

## Notification Types

| Purpose                      | Trigger                        | Sender   |
| ---------------------------- | ------------------------------ | -------- |
| `RECITATION_RECOMMENDATION`  | Manual send or weekly cron     | Teacher (manual) / none (cron) |

## Priority Logic

| Condition                                        | List              | Priority |
| ------------------------------------------------ | ----------------- | -------- |
| Recitation evaluated as BAD (entire page range)  | `pagesToReview`   | 3        |
| Memorization error on page                       | `pagesToMemorize` | 2        |
| Tajweed / Pronunciation / Diacritical error      | `pagesToReview`   | 1        |

Pages are deduplicated per list and sorted by priority descending.


read the api-graduation.json for the full api documentation
