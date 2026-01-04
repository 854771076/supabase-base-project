# Subscription and Quota System Design

## Overview
This system provides a framework for managing user subscription plans, feature permissions, and usage quotas.

## Data Model

```mermaid
erDiagram
    plans ||--o{ subscriptions : "has"
    users ||--o{ subscriptions : "holds"
    users ||--o{ usage_records : "tracks"

    plans {
        uuid id PK
        text name "e.g. Free, Pro"
        text description
        jsonb features "Permission flags: { ai_gen: true }"
        jsonb quotas "Usage limits: { requests: 100 }"
        timestamp created_at
    }

    subscriptions {
        uuid id PK
        uuid user_id FK "auth.users"
        uuid plan_id FK "plans"
        text status "active, expired, trailing"
        timestamp current_period_end
        timestamp created_at
    }

    usage_records {
        uuid id PK
        uuid user_id FK "auth.users"
        text feature_name "e.g. ai_gen_count"
        int current_usage
        timestamp reset_at
        timestamp updated_at
    }
```

## Business Logic
1. **Authorization**: Check `plans.features` for permission flags.
2. **Quota Check**: Compare `usage_records.current_usage` with `plans.quotas`.
3. **Usage Tracking**: Increment `usage_records` after successful feature operation.

## Demo and Verification
1. **Demo Page**: Accessible at `/dashboard/demo`.
2. **Quota Tracking**: The demo page shows real-time usage of `api_request` features.
3. **Reset Mechanism**: A SQL function `reset_daily_quotas()` handles the daily reset of usage counts.

## Security (RLS)
- `plans`: Readable by all users.
- `subscriptions`: Users can only read their own subscription.
- `usage_records`: Users can read their own usage, but modifications are handled by Server Actions or specific functions (`increment_usage`).
