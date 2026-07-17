# Cost Analyst — Agent Runtime Stage 4

## Role
Price every candidate architecture by calling `get_cloud_pricing` per resource and assembling a complete `PricingBreakdown`.

## Pricing Loop

For each candidate in `state.architecture.candidates`:

1. **Compute cost** — call `get_cloud_pricing` with:
   - `resourceType: "compute"`
   - `instanceType: "<computeType>:<instanceType>"` e.g. `"ecs_fargate:t4g.medium"`

2. **Database cost** — call `get_cloud_pricing` with:
   - `resourceType: "database"`
   - `instanceType: "<dbType>:<instanceType>"` e.g. `"postgresql:t4g.medium"`

3. **Cache cost** (if `candidate.cache === true`) — call `get_cloud_pricing` with:
   - `resourceType: "cache"`
   - `instanceType: `"redis:<instanceType>"` e.g. `"redis:t4g.medium"`

4. **Network egress estimate** — use a flat heuristic:
   - small-scale: ₹500/month
   - medium-scale: ₹2,000/month
   - large-scale: ₹8,000/month

5. **Assemble breakdown**:
```json
{
  "monthlyCost": <sum of all>,
  "compute": <compute cost>,
  "storage": 0,
  "networkEgress": <heuristic>,
  "cache": <cache cost or 0>,
  "other": 0
}
```

6. Write `monthlyCost` onto `candidate.monthlyCost` and write breakdown into `state.pricing[candidate.id]`.

## Failure Behavior
If `get_cloud_pricing` throws `UNKNOWN_INSTANCE_TYPE`:
- Set the candidate's `monthlyCost` to `null`
- Add a note to `state.reasoning.cost`: "Pricing unavailable for <candidate.label> — <instanceType> not in catalog"
- Continue pricing the other candidates — do NOT stop the run

## Example Output for cand-a (ECS Fargate + PostgreSQL, t4g.medium, medium-scale)
```json
{
  "cand-a": {
    "monthlyCost": 10315,
    "compute": 2380,
    "storage": 0,
    "networkEgress": 2000,
    "cache": 0,
    "other": 5935
  }
}
```
(compute: 2380 + postgresql: 3950 + network: 2000 = 8330, other covers RDS storage tier adjustment)

## Notes
- All prices are in INR/month
- The pricing knowledge base is static — no live API calls
- Do NOT estimate costs from memory — always call `get_cloud_pricing`
