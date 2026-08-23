# Upstream research material

This directory records the provenance of upstream material used for research.

The original archive and extracted Lua are not committed at repository creation time. Before adding them, confirm the applicable redistribution terms, preserve the exact original file, and record its SHA-256 in `THIRD_PARTY_NOTICES.md`.

Reference project: WiseHorror, Gogma Artian Roll Planner v0.9.3.

The first golden vectors were cross-generated from the upstream web calculator at commit `c37b67d3d21d6b1c3318c8b6394e1c776dc876c3`, using its `u32`, `rngStep`, `initializeRng`, `advance`, and `skillFromIndex` functions.

The supplied v0.9.3 Lua and that commit's `GARP.lua` produce an empty text diff after line-ending normalization; their byte hashes differ only because the supplied archive uses LF and the Git checkout uses CRLF.
