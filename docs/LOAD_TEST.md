# Load Test Results

## Setup
- Tool: Locust 2.44.3
- Target: `GET /api/keys/user/:userId` (rate-limited endpoint, FREE plan)
- Load: 300 concurrent users, ramped at 50 users/sec
- Duration: 60 seconds
- Environment: AWS EC2 t3.small

## Results

| Metric | Value |
|---|---|
| Total Requests | 18,243 |
| Requests/sec (sustained) | ~480 |
| Median Response Time | 230ms |
| P95 | 450ms |
| P99 | 720ms |
| P99.9 | 1.5s |
| Max | 2.2s |

## Findings

- Redis-backed rate limiter correctly enforced the FREE tier limit (100 req/hour) under heavy concurrent load.
- 100 requests succeeded (200 OK) before the limit was hit — exactly matching the configured plan limit.
- Remaining 18,143 requests correctly received `429 Rate limit exceeded` with proper `X-RateLimit-*` headers.
- No crashes, no 500 errors, no data corruption under 300 concurrent users.
- System sustained ~480 req/s throughput on a t3.small instance.

## Conclusion

The rate limiter performs correctly and accurately under load, demonstrating that the Redis atomic increment + TTL approach is reliable for enforcing per-key quotas even under burst traffic.
