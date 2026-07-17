# AI ↔ Backend Contract — Quick Reference

**Ownership boundary:** Track A (AI layer) decides *when* each tool is called and *what to do with the result*. Tracks B & C (backend) own making each tool return exactly the schema below, correctly, every time. No tradeoff logic may be embedded in any tool.

## Tool Contract Table

| Tool | Purpose | Called by | Preconditions | On Failure |
|---|---|---|---|---|
| `read_existing_infrastructure` | Surface existing `.tf` resources | Architecture Designer | `workingDir` exists | Empty `resources[]`, treat as greenfield |
| `read_company_policies` | Surface compliance rules | Policy Validator | `policy.yaml` present | Empty `rules[]`, dashboard flags "policy unavailable" |
| `get_cloud_pricing` | Price one resource/instance | Cost Analyst | `instanceType` in static catalog | `UNKNOWN_INSTANCE_TYPE`, candidate marked unpriceable |
| `estimate_resource_requirements` | Rough capacity sizing | Requirements Extractor, Architecture Designer | Workload description non-empty | `INSUFFICIENT_DESCRIPTION`, bubbles to Planner as clarifying question |
| `generate_candidate_architectures` | Produce 3 unpriced candidates | Architecture Designer | `requirements` fully populated | `CATALOG_EXHAUSTED`, relax least-critical constraint and flag |
| `compare_architectures` | Deterministic scoring | Coordinator | All 3 candidates priced and policy-checked | `INCOMPLETE_PRICING` / `INCOMPLETE_POLICY_RESULTS`, blocks Coordinator |
| `present_analysis` | Push to dashboard | Coordinator | Recommendation chosen, Terraform generated | `INVALID_PAYLOAD_SHAPE`, retry once with stricter prompt |
| `generate_terraform` | Emit HCL | Coordinator | Candidate is the chosen recommendation | `UNSUPPORTED_CANDIDATE_SHAPE`, fallback to minimal skeleton + note |
| `submit_approval` | Record human decision | Dashboard widget | `analysisId` exists, status `"pending"` | `ANALYSIS_NOT_FOUND` / `ALREADY_DECIDED` |
| `check_approval_status` | Poll for decision | Coordinator | `analysisId` exists | `ANALYSIS_NOT_FOUND` |
| `write_approved_changes` | Write HCL to disk | Approval event | Status is `"approved"` | `NOT_APPROVED` / `WRITE_FAILURE`, surfaced verbatim |

## Critical Rule

> If a backend tool ever starts making a recommendation-shaped decision (e.g. "this candidate is best"), that logic has leaked out of the Agent Runtime and belongs back in the Coordinator.

## Error Code Reference

| Error Code | Tool | Meaning | Recovery |
|---|---|---|---|
| `DIR_NOT_FOUND` | read_existing_infrastructure | Working dir missing | Return empty resources (greenfield) |
| `NO_TF_FILES` | read_existing_infrastructure | No .tf files found | Return empty resources |
| `PARSE_ERROR` | read_existing_infrastructure | HCL parse failed | Return empty resources |
| `POLICY_FILE_MISSING` | read_company_policies | policy.yaml absent | Return empty rules, set fallback: true |
| `YAML_PARSE_ERROR` | read_company_policies | YAML invalid | Return empty rules, set fallback: true |
| `UNKNOWN_INSTANCE_TYPE` | get_cloud_pricing | Instance not in catalog | Throw — caller handles |
| `UNKNOWN_RESOURCE_TYPE` | get_cloud_pricing | Resource type invalid | Throw — caller handles |
| `INSUFFICIENT_DESCRIPTION` | estimate_resource_requirements | Workload too vague | Throw — Planner asks for clarification |
| `CATALOG_EXHAUSTED` | generate_candidate_architectures | < 3 distinct options | Relax constraint, add note to reasoning |
| `INCOMPLETE_PRICING` | compare_architectures | Candidate missing monthlyCost | Throw — Cost Analyst must fix first |
| `INCOMPLETE_POLICY_RESULTS` | compare_architectures | Candidate missing policy checks | Throw — Policy Validator must fix first |
| `INVALID_PAYLOAD_SHAPE` | present_analysis | Malformed InfrastructureAnalysis | Throw — Coordinator retries with stricter prompt |
| `UNSUPPORTED_CANDIDATE_SHAPE` | generate_terraform | Candidate outside MVP catalog | Return minimal skeleton + manual-edit note |
| `ANALYSIS_NOT_FOUND` | submit_approval, check_approval_status, write_approved_changes | No analysis with given ID | Throw |
| `ALREADY_DECIDED` | submit_approval | Status already approved/rejected | Throw |
| `NOT_APPROVED` | write_approved_changes | Status is not "approved" | Throw |
| `WRITE_FAILURE` | write_approved_changes | Disk/permissions error | Throw — surfaced verbatim in chat |
