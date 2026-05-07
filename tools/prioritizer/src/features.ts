// KBMesh AI Feature Backlog — sourced from the design discussion at
// https://github.com/tonylnng/kbmesh
// Each feature carries baseline scores (1=low, 5=high) which the user can override.
// Effort: implementation effort (1=small, 5=large).
// Value: business / user value (1=low, 5=high).
// Dependency: architectural dependency / blocking risk (1=independent, 5=highly coupled).
// Default scores reflect the discussion in the chat (S/M/L → numeric mapping).

export type Category =
  | 'ingestion'
  | 'retrieval'
  | 'agentic'
  | 'graph'
  | 'governance'
  | 'future'

export interface FeatureMeta {
  id: string
  name: string
  description: string
  category: Category
  onPrem: boolean
  // Baseline scores (1-5)
  effort: number
  value: number
  dependency: number
}

export const CATEGORY_META: Record<
  Category,
  { label: string; subtitle: string; color: string }
> = {
  ingestion: {
    label: 'Ingestion Intelligence',
    subtitle: 'AI features that run when content enters the mesh',
    color: '#01696F'
  },
  retrieval: {
    label: 'Retrieval & Answering',
    subtitle: 'The core "ask anything" loop — search, rerank, ground',
    color: '#006494'
  },
  agentic: {
    label: 'Agentic Workflows',
    subtitle: 'Tool-using agents that do things, not just answer',
    color: '#7A39BB'
  },
  graph: {
    label: 'Graph-Native',
    subtitle: 'Differentiators that only work because you have the mesh',
    color: '#D19900'
  },
  governance: {
    label: 'Governance & Trust',
    subtitle: 'Enterprise must-haves: audit, explainability, guardrails',
    color: '#A12C7B'
  },
  future: {
    label: 'Future / Optional',
    subtitle: 'Longer-horizon bets and stretch features',
    color: '#964219'
  }
}

// Effort baseline mapping from the chat (S=2, M=3, L=4)
export const FEATURES: FeatureMeta[] = [
  // ---- INGESTION ----
  {
    id: 'auto-classify',
    name: 'Auto-classification + human-in-loop',
    description:
      'LLM proposes a category for each new doc with confidence; low-confidence items queue for admin review.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 5,
    dependency: 2
  },
  {
    id: 'taxonomy-evolve',
    name: 'Hierarchical taxonomy auto-evolution',
    description:
      'Detect clusters of unfilled topics and propose new taxonomy nodes so the mesh grows on its own.',
    category: 'ingestion',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 4
  },
  {
    id: 'entity-extract',
    name: 'Entity & relationship extraction',
    description:
      'Extract person/org/system/policy entities and edges; feeds the LightRAG graph.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 5,
    dependency: 3
  },
  {
    id: 'dedup',
    name: 'Duplicate / near-duplicate detection',
    description:
      'Embedding cosine + MinHash before insert; merge-or-link decision keeps the mesh clean.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'auto-summary',
    name: 'Auto-summarisation at 3 lengths',
    description:
      'Generate a TL;DR, executive paragraph, and full summary for every doc on ingest.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 1
  },
  {
    id: 'multimodal-ingest',
    name: 'Multi-modal ingestion (image / audio / video)',
    description:
      'OCR + caption (LLaVA / Qwen-VL), Whisper for audio, frame-sample + transcript for video.',
    category: 'ingestion',
    onPrem: true,
    effort: 3,
    value: 5,
    dependency: 3
  },
  {
    id: 'diagram-tables',
    name: 'Diagram & table understanding',
    description:
      'Extract structured data from PNGs/PDFs — architecture diagrams, org charts, financial tables.',
    category: 'ingestion',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'auto-tag',
    name: 'Auto-tagging with controlled vocabulary',
    description:
      'LLM tags constrained to your taxonomy so tags stay consistent and never drift.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 3
  },
  {
    id: 'pii-prescan',
    name: 'PII / secret pre-scan at ingest (warn-only)',
    description:
      'Flag risky docs at upload time — even though redaction itself stays at egress.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'freshness',
    name: 'Freshness / staleness scoring',
    description:
      'LLM judges whether a doc is still current vs outdated; auto-archive candidates surface for review.',
    category: 'ingestion',
    onPrem: true,
    effort: 2,
    value: 3,
    dependency: 2
  },

  // ---- RETRIEVAL ----
  {
    id: 'hybrid-rerank',
    name: 'Hybrid search + cross-encoder rerank',
    description:
      'BM25 + dense + graph signals fed into bge-reranker-v2-m3 for sharper top-k.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 5,
    dependency: 3
  },
  {
    id: 'query-rewrite',
    name: 'Query rewriting & expansion',
    description:
      'Resolve pronouns, expand acronyms (e.g. "MRN" → "medical record number"), translate EN ↔ 中文.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'hyde',
    name: 'HyDE — hypothetical document embeddings',
    description:
      'LLM drafts an ideal answer, embeds that for retrieval — large recall boost on terse queries.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'graph-walk',
    name: 'Multi-hop graph reasoning (kb.graph_walk)',
    description:
      'LightRAG-backed multi-hop traversal exposed as an MCP tool for agents.',
    category: 'retrieval',
    onPrem: true,
    effort: 3,
    value: 5,
    dependency: 4
  },
  {
    id: 'citations',
    name: 'Citation-grounded answers',
    description:
      'Every sentence cites a source chunk_id; refuse to answer when there is no support in retrieved context.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 5,
    dependency: 2
  },
  {
    id: 'self-check',
    name: 'Self-check / hallucination guard',
    description:
      'Second LLM pass verifies each claim against retrieved chunks; flags or strips unsupported statements.',
    category: 'retrieval',
    onPrem: true,
    effort: 3,
    value: 5,
    dependency: 3
  },
  {
    id: 'conv-memory',
    name: 'Conversational memory per user',
    description:
      'Short-term scratchpad plus long-term per-user / per-role preferences for multi-turn coherence.',
    category: 'retrieval',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'clarify-agent',
    name: 'Clarifying-question agent',
    description:
      'When the query is ambiguous, ask back instead of guessing — improves precision dramatically.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 3,
    dependency: 2
  },
  {
    id: 'semantic-cache',
    name: 'Answer cache with semantic key',
    description:
      'Cache final answers keyed by (query embedding, KB version hash) — major latency and cost win.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 3,
    dependency: 2
  },
  {
    id: 'multi-lang',
    name: 'Multi-language answering',
    description:
      'Always reply in the user\'s language regardless of source-document language.',
    category: 'retrieval',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 1
  },

  // ---- AGENTIC ----
  {
    id: 'mcp-tool-agent',
    name: 'Tool-using agent on the MCP gateway',
    description:
      'Agents that DO things — open tickets, update Notion, draft email — gated by RBAC.',
    category: 'agentic',
    onPrem: true,
    effort: 3,
    value: 5,
    dependency: 4
  },
  {
    id: 'kb-crawl',
    name: 'Scheduled knowledge crawls',
    description:
      'Daily agent re-reads top-N folders, finds stale docs, drafts updates for review.',
    category: 'agentic',
    onPrem: true,
    effort: 3,
    value: 3,
    dependency: 3
  },
  {
    id: 'onboarding-bot',
    name: 'Onboarding bot',
    description:
      'New employee asks "what do I need to know about X" → personalised reading list from the mesh.',
    category: 'agentic',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'meeting-pipeline',
    name: 'Meeting → KB pipeline',
    description:
      'Whisper + speaker diarization → action items → mesh nodes with assignees and dates.',
    category: 'agentic',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'digest',
    name: 'Daily / weekly per-role digest',
    description:
      'Per-role summary of new knowledge ("HR: 3 new policy updates this week").',
    category: 'agentic',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'channel-persona',
    name: 'WhatsApp / Telegram Q&A persona',
    description:
      'Same KB, conversational tone, RBAC-aware — runs through the existing n8n channel bridges.',
    category: 'agentic',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'proactive-suggest',
    name: 'Proactive suggestions (Copilot-style)',
    description:
      'While the user drafts a doc or ticket, the agent surfaces relevant KB nodes inline.',
    category: 'agentic',
    onPrem: true,
    effort: 4,
    value: 4,
    dependency: 4
  },
  {
    id: 'workflow-synth',
    name: 'Workflow / SOP synthesis',
    description:
      '"How do I onboard a new hospital client?" → agent assembles an SOP from scattered nodes.',
    category: 'agentic',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },

  // ---- GRAPH-NATIVE ----
  {
    id: 'mesh-viz',
    name: 'Mesh visualisation UI',
    description:
      'Force-directed graph — click a node to see neighbours, evidence, and recent edits.',
    category: 'graph',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'impact-analysis',
    name: '"What if I delete this?" impact analysis',
    description:
      'Show downstream nodes and policies that depend on a given doc before destructive changes.',
    category: 'graph',
    onPrem: true,
    effort: 3,
    value: 3,
    dependency: 3
  },
  {
    id: 'contradictions',
    name: 'Contradiction detection',
    description:
      'LLM compares related nodes and flags when two policies disagree.',
    category: 'graph',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 4
  },
  {
    id: 'gap-detect',
    name: 'Knowledge gap detection',
    description:
      'Find weakly-connected nodes or queries with no good answer; suggest new content to author.',
    category: 'graph',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'auto-link',
    name: 'Auto-link suggestions',
    description:
      '"This new doc looks related to these 5 existing nodes — confirm links?" — keeps the mesh dense.',
    category: 'graph',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 3
  },
  {
    id: 'semantic-diff',
    name: 'Versioned diff with semantic explanation',
    description:
      'Not just text diff — LLM explains what changed in MEANING between two versions of a node.',
    category: 'graph',
    onPrem: true,
    effort: 2,
    value: 3,
    dependency: 2
  },

  // ---- GOVERNANCE ----
  {
    id: 'audit-trail',
    name: 'Per-answer audit trail',
    description:
      'Caller, role, query, retrieved chunks, redactions applied, model + version — captured every call.',
    category: 'governance',
    onPrem: true,
    effort: 2,
    value: 5,
    dependency: 1
  },
  {
    id: 'explainability',
    name: 'Explainability panel',
    description:
      '"Why this answer?" highlights matching chunks, shows confidence, surfaces alternative interpretations.',
    category: 'governance',
    onPrem: true,
    effort: 2,
    value: 4,
    dependency: 2
  },
  {
    id: 'topic-guardrails',
    name: 'Bias / sensitive-topic guardrails',
    description:
      'Rule-based + LLM classifier blocks medical-advice, legal-advice, HR-disciplinary queries from non-authorised roles.',
    category: 'governance',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'prompt-injection',
    name: 'Prompt-injection defence',
    description:
      'Strip instructions found inside retrieved chunks; structural prompt isolation between system / context / user.',
    category: 'governance',
    onPrem: true,
    effort: 2,
    value: 5,
    dependency: 2
  },
  {
    id: 'redteam-eval',
    name: 'Red-team / eval harness',
    description:
      'Canned adversarial queries run on every model swap — regression-tests answer quality and leakage.',
    category: 'governance',
    onPrem: true,
    effort: 3,
    value: 4,
    dependency: 3
  },
  {
    id: 'drift-monitor',
    name: 'Quality drift monitoring',
    description:
      'Track answer quality over time as the KB grows; alert on regressions and metric drift.',
    category: 'governance',
    onPrem: true,
    effort: 3,
    value: 3,
    dependency: 3
  },

  // ---- FUTURE / OPTIONAL ----
  {
    id: 'voice',
    name: 'Voice interface (Whisper + Piper)',
    description:
      'Whisper-in, Piper / Coqui TTS-out. Fully on-prem voice loop without cloud dependencies.',
    category: 'future',
    onPrem: true,
    effort: 3,
    value: 3,
    dependency: 3
  },
  {
    id: 'lora',
    name: 'Local fine-tuning (LoRA)',
    description:
      'LoRA on your own corpus over Qwen / Llama — improves tone, jargon, and abbreviations.',
    category: 'future',
    onPrem: true,
    effort: 4,
    value: 3,
    dependency: 3
  },
  {
    id: 'multi-tenant',
    name: 'Multi-tenant mesh',
    description:
      'Per-department subgraphs with cross-tenant query policy and isolation guarantees.',
    category: 'future',
    onPrem: true,
    effort: 4,
    value: 4,
    dependency: 5
  },
  {
    id: 'federated',
    name: 'Federated mesh between sites',
    description:
      'Two KBMesh instances exchange REDACTED embeddings only — e.g. HK ↔ SG offices.',
    category: 'future',
    onPrem: true,
    effort: 4,
    value: 3,
    dependency: 5
  },
  {
    id: 'active-learn',
    name: 'Active learning loop',
    description:
      'Thumbs-down on answers becomes labeled data for reranker fine-tune — closes the quality loop.',
    category: 'future',
    onPrem: true,
    effort: 3,
    value: 3,
    dependency: 3
  }
]
