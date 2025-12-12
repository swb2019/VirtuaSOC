# intel-standards

Domain primitives for VirtuaSOC intelligence production. The module exports:

- Source reliability scale (A-F) with NATO-style descriptors.
- Confidence levels (High/Moderate/Low).
- Risk assessment helper for a 5x5 likelihood x impact matrix that yields a numeric score and category.
- Action item factory enforcing owner/deadline requirements.

The module is pure and has no side effects, making it safe to reuse anywhere in the stack.
