#!/bin/bash
# SessionStart: Constitution Injection (short)

cat << 'EOF'
PROLE-ISLAND Dev Constitution (2025-12-31)
==========================================

IRON RULES:
1) Issue-Driven: Start from an Issue (run /investigate first)
2) DoD Gates: Bronze=PR OK / Silver=Merge OK / Gold=Deploy OK
3) Pre-mortem: Identify 3+ failure causes BEFORE implementation

ISSUE CREATION:
- MUST use --body-file <path>  (stdin: --body-file - is prohibited)
- MUST include: Investigation Report Link
- MUST include: DoD Level (Bronze/Silver/Gold)
- MUST include: Acceptance Criteria

PROHIBITED:
- Direct push to main/master
- Force push to main/master
- Merge without tests
- Commit secrets/credentials

ENFORCED BY HOOKS (exit 2 = BLOCKED)
Ref: https://github.com/PROLE-ISLAND/.github/wiki
EOF
