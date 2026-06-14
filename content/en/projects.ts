import type { Project } from '@/lib/types'

export const projects: Project[] = [
  {
    id: 'minecraft-butler-ai',
    name: 'Minecraft Butler AI',
    description:
      'LLM agent integrated into Minecraft through a custom mod. The JWT-authenticated backend exposes a LangGraph agent with RAG that understands the game context and decides and executes actions inside the world.',
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'RAG', 'WebSocket', 'Java'],
    repoUrls: [
      { label: 'Backend', url: 'https://github.com/migue0418/minecraft-butler-ai-backend' },
      { label: 'Mod', url: 'https://github.com/migue0418/minecraft-butler-ai-mod' },
    ],
    featured: true,
    detail: {
      summary: [
        'MinecraftButlerAI is a FastAPI backend that brings a butler ("Alfred") to life inside Minecraft: it understands natural-language questions (by text or by voice), answers with real game knowledge, and executes in-world actions. Rather than a single LLM call, it\'s an agentic architecture where each piece solves a concrete problem, from intent routing to knowledge retrieval and voice synthesis.',
        'The butler combines a LangGraph agent with persistent memory, a multilingual RAG system over the game documentation, and a local voice pipeline, all exposed through a JWT-authenticated HTTP API designed for production (rate-limiting, migrations, observability).',
      ],
      sections: [
        {
          heading: 'Agent architecture',
          paragraphs: [
            'The butler is modeled as a graph of nodes with LangGraph: a first node classifies the user\'s intent and the graph deterministically routes (a plain intent → node dictionary, not "LLM magic") to one of three branches: answer a question with RAG, move to a set of coordinates, or chat.',
            'The graph state (ButlerState) is a typed TypedDict whose messages field uses LangGraph\'s add_messages reducer, which accumulates history automatically. The graph compiles once (a singleton guarded by an asyncio.Lock) with an AsyncRedisSaver checkpointer: each session persists its state in Redis with a TTL, giving multi-turn conversational memory per player without any client-side management.',
            'Intent classification runs on Claude Haiku 4.5 (fast and cheap) using structured output (a validated Pydantic object, not free text to parse), while the final answer uses Claude Sonnet 4.6. Both models are obtained through a factory that abstracts by role ("classifier"/"responder") and by provider (Anthropic or OpenAI), so the code asks for capabilities, not concrete models.',
          ],
        },
        {
          heading: 'Multilingual RAG',
          paragraphs: [
            'Game knowledge is indexed in English from PrismarineJS/minecraft-data and Minecraft Wiki extracts, but users ask in Spanish. To bridge that language gap, dense cross-lingual embeddings (paraphrase-multilingual-MiniLM-L12-v2) are used with cosine-similarity search in Qdrant.',
            'The original design included a full hybrid pipeline (a sparse BM42 branch + a FlashRank reranker), which was dropped after validating with real data: both components are lexical and English-only, so with Spanish queries the sparse branch returned noise and the reranker could not reorder ES→EN results. The measured conclusion, documented in the code, is that dense multilingual retrieval alone is superior in both languages.',
            'For wiki mechanics, Parent Document Retrieval is used: small chunks (~800 characters) are indexed for precise embeddings, but the full parent block (~2000 characters) is retrieved and passed to the LLM, resolving the tension between retrieval precision and context sufficiency.',
          ],
        },
        {
          heading: 'Voice & production',
          paragraphs: [
            'The response is streamed over Server-Sent Events sentence by sentence (not token by token), because the client synthesizes it as speech (TTS) and a TTS needs complete sentences to sound natural; this gives a sense of immediacy without chopping the audio.',
            'Voice transcription runs on-device with faster-whisper in int8 quantization (faster and using half the memory of float32, with no noticeable quality loss), with the model pre-warmed at startup to avoid cold-start and without ever sending the user\'s audio to third parties.',
            'The backend is built for production: JWT authentication with roles, rate-limiting with SlowAPI, Alembic migrations, slice architecture (router/schemas/service/repository), and optional per-run observability of the agent with LangSmith.',
          ],
        },
      ],
      links: [
        {
          label: 'Technical architecture',
          url: 'https://github.com/migue0418/minecraft-butler-ai-backend/blob/main/ARCHITECTURE.md',
        },
      ],
    },
  },
  {
    id: 'tfm-sexism-classifier',
    name: "Master's Thesis: Detecting Sexism on Social Media with BERT and LLMs",
    description:
      "Master's thesis comparing fine-tuned BERT/ModernBERT models against zero/few-shot LLMs for detecting explicit and implicit sexist language on social media.",
    stack: ['Python', 'PyTorch', 'Transformers', 'BERT', 'ModernBERT', 'FastAPI', 'React', 'SQLite'],
    repoUrl: 'https://github.com/migue0418/TFM-Miguel-Angel',
    featured: true,
    detail: {
      summary: [
        'Sexism on social media shows up both explicitly and implicitly, which makes automatic moderation hard: current systems often confuse sexist content with posts that simply report or criticize it, and performance drops sharply when moving from one domain (e.g. Twitter) to another (e.g. forums or Reddit).',
        'This thesis starts from the hypothesis that a BERT-style model fine-tuned specifically for this task can be competitive with, or even outperform, general-purpose LLMs used in zero-shot or few-shot settings, while needing significantly less training data.',
      ],
      sections: [
        {
          heading: 'Datasets',
          paragraphs: [
            'EDOS (SemEval-2023 Task 10): a Reddit and Gab dataset with 5,000 to 20,000 labeled examples, used in its binary, 3-class, and 4-class variants to evaluate different levels of granularity in sexism detection.',
            'RedditBIAS: around 3,000 sentences focused on gender bias, used to evaluate how well the model generalizes to a domain different from the one it was trained on.',
            'Synthetic sentence set: 15 sentences designed specifically for this thesis, spread across 3 classes, enabling a quick qualitative check of model behaviour on edge cases.',
          ],
        },
        {
          heading: 'Methodology',
          paragraphs: [
            'Preprocessing of the datasets (text cleaning, balancing classes 50/50 to avoid bias from class imbalance) and splitting into training, validation, and test sets with a 70/10/20 ratio.',
            'Hyperparameter search via a grid search over 54 combinations (learning rate, batch size, number of epochs, etc.) to find the optimal fine-tuning configuration for the BERT and ModernBERT models.',
            'Evaluation of LLMs via few-shot prompting (k=6 examples for binary classification, k=12 for 4-class classification) using logits masking to restrict model output to valid classes.',
            'Evaluation metrics: macro F1, precision, recall, and accuracy, computed consistently across all models and datasets.',
          ],
        },
        {
          heading: 'Conclusions',
          paragraphs: [
            'Fine-tuned BERT-style models consistently outperform un-tuned LLMs: even the best result obtained with Mistral-7B-Instruct in few-shot (F1 = 0.413) is more than 40 percentage points below the fine-tuned models.',
            'Reducing the EDOS training set from 20,000 to 10,000 examples is viable: it saves roughly 87% of GPU-hours at the cost of only 4 percentage points of F1.',
            'Identified limitations: confusion between critical/reporting content and sexist content, difficulty detecting irony and sarcasm, and the lack of multilingual evaluation, which remains open as future work.',
          ],
        },
        {
          heading: 'Web Application',
          paragraphs: [
            'The binary ModernBERT-base model (trained on reduced_10k) was integrated into a full-stack application that demonstrates its use in a real scenario: a FastAPI microservice with a React frontend, SQLite persistence, and JWT authentication with three roles: admin (full management of users and roles), sexism_detection (run and view analyses), and analytics (read-only access to analytics).',
            'The sexism detector offers three analysis modes: free text (split into sentences, with an overall result and a per-sentence breakdown), URL (analyzes the text content of a page, with an optional filter by HTML tag), and full domain (respects robots.txt, locates the sitemap.xml, extracts indexable URLs, and runs inference on them in parallel).',
            'The analytics module consolidates results in three views: a global dashboard (analyzed URLs and sentences, estimated sexism %, top-5 most sexist sentences, and a severity histogram), a list of analyzed domains, and a paginated list of URLs per domain with access to the sentence-by-sentence detail of each one.',
            "As a proof of concept, the University of Granada's main portal (www.ugr.es) was analyzed: across 590 URLs and 12,643 sentences, only 22 sentences (≈0.002%) were flagged as sexist, and manual review confirmed they were false positives (sentences talking about gender discrimination, not perpetrating it). That's the expected result for an institutional website, and a sign that the model does not over-flag content indiscriminately.",
          ],
        },
      ],
      results: [
        { label: 'F1 (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'Recall (ModernBERT-base, EDOS-10k)', value: '0.853' },
        { label: 'Accuracy (ModernBERT-base, EDOS-10k)', value: '0.843' },
        { label: 'F1 (bert-base-uncased, EDOS-10k)', value: '0.836' },
        { label: 'F1 (bert-base-uncased, EDOS-20k)', value: '0.7876' },
        { label: 'F1 (Mistral-7B-Instruct, few-shot)', value: '0.413' },
        { label: 'F1 (synthetic sentences, BERT)', value: '0.95-0.96' },
      ],
      images: [
        {
          src: '/images/projects/tfm-sexism-classifier/binary-results-diagram.png',
          alt: 'Bar chart comparing macro F1 across models on the EDOS, RedditBIAS, and synthetic-sentence datasets',
          caption: 'F1 (macro) comparison by model and dataset in binary classification',
          width: 3600,
          height: 1800,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/login-page.png',
          alt: 'Application login screen with username and password fields',
          caption: 'Application login screen',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-text.png',
          alt: 'Free-text analysis result showing the overall percentage of sexist sentences and a per-sentence breakdown',
          caption: 'Free-text analysis with overall result and per-sentence breakdown',
          width: 1920,
          height: 1228,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-url.png',
          alt: "Analysis result of a URL's text content, with an overall summary and per-sentence detail",
          caption: 'Text content analysis of a URL',
          width: 1919,
          height: 1079,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/sexism-detection-domain.png',
          alt: 'Analysis result of a full domain, showing the located sitemaps and the detected URLs',
          caption: 'Full domain analysis from its sitemap.xml',
          width: 1920,
          height: 1772,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/analytics-global.png',
          alt: 'Global analytics dashboard with analyzed URLs and sentences, sexism percentage, top-5 most sexist sentences, and a severity histogram',
          caption:
            'Global analytics dashboard: analyzed URLs/sentences, sexism %, top-5 sentences, severity histogram',
          width: 1916,
          height: 939,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/domains-list.png',
          alt: 'List of analyzed websites with search and access to each domain detail',
          caption: 'List of analyzed domains',
          width: 1920,
          height: 650,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/urls-domain.png',
          alt: 'Paginated list of URLs for a domain with their sexism percentage and classification',
          caption: 'Paginated list of URLs for a domain with their classification',
          width: 1920,
          height: 945,
        },
        {
          src: '/images/projects/tfm-sexism-classifier/url-analysis.png',
          alt: "Sentence-by-sentence detail of a URL's analysis, with search and classification filters",
          caption: "Sentence-by-sentence detail of a URL's analysis",
          width: 1919,
          height: 945,
        },
      ],
      links: [
        {
          label: 'Thesis (PDF)',
          url: 'https://github.com/migue0418/TFM-Miguel-Angel/blob/main/TFM%20-%20LLMs%20para%20detecci%C3%B3n%20autom%C3%A1tica%20de%20lenguaje%20sexista%20en%20redes%20sociales.pdf',
        },
      ],
    },
  },
  {
    id: 'autoparts-inventory-platform',
    name: 'Inventory & Operations Platform for an Auto Parts Store',
    description:
      'Full-stack inventory and operations platform for an auto parts store: syncs and extends the Factusol/SDELsol API, automates supplier invoice processing with OCR, cross-references equivalent products across brands to surface alternatives, and turns staff phones into real-time connected PDAs.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'PostgreSQL', 'SQLAlchemy', 'OCR', 'Docker', 'Caddy'],
    featured: true,
    detail: {
      summary: [
        "Internal management application for an auto parts store, built on top of Factusol Cloud (SDELsol), the ERP the business uses for invoicing and accounting. The project was driven end to end, as both developer and product manager, from deciding which parts of the daily workflow were worth automating to designing the migration from the previous system, the Factusol integration layer, and the final deployment on the business's local network.",
        "Factusol exposes a narrow admin API (read/write tables, run queries) with no concept of cross-brand product equivalence, automatic invoice reading, or using a phone as a warehouse terminal. The project adds that layer on top: a PostgreSQL sync layer, a cross-brand equivalence index for finding alternatives with the same use, an OCR pipeline for supplier invoices that writes straight back into Factusol, and a web app served over HTTPS on the local network that any phone can use as a PDA.",
      ],
      sections: [
        {
          heading: 'Sync layer & business logic on top of Factusol',
          paragraphs: [
            "An async HTTP client authenticates against the Factusol API (a JWT token cached and refreshed automatically) and exposes generic operations: reading tables, running SQL-like queries, and writing, updating or deleting records over the ERP's tables (articles, suppliers, price lists, stock, invoices...). On top of that client, a syncer mirrors those tables into PostgreSQL either incrementally (only records modified since the last sync) or in full, schedulable per table with a background scheduler.",
            "Having a local PostgreSQL copy enables analysis tools Factusol doesn't offer: a margin analysis by product family (comparing list price against cost price) and a supplier rate-sheet comparison (matching tariff Excel files against the catalog by reference or barcode).",
            "The most valuable piece of this layer is the cross-brand equivalent-articles relationship: the same part (say, a brake pad or a filter for a specific car model) is manufactured by several suppliers under their own different references, and Factusol stores an 'equivalent code' per article but offers no way to make use of it. An equivalence index was built that, given an article, shows at a glance the alternatives from other brands covering the same use, along with their stock, price and margin, useful both for offering an alternative when the requested article is out of stock and for picking the best-margin option among several valid alternatives.",
          ],
        },
        {
          heading: 'Supplier invoice OCR',
          paragraphs: [
            "Purchase invoices arriving from suppliers (PDF or image) are processed through an OCR pipeline that extracts header and line items: reference, description, quantity, unit cost and discounts. Each line is matched against the catalog using the supplier's reference or the article's barcode.",
            "Recognized lines are written directly into Factusol through its API: cost prices get updated and, where needed, the article gets created, so purchase costs stay up to date without any manual typing. Lines that aren't recognized automatically fall into a manual review queue, where staff link them to an existing article or create a new one.",
            "Before this, every supplier invoice meant typing each line item into Factusol by hand; now that work is reduced to reviewing the handful of lines the system doesn't recognize.",
          ],
        },
        {
          heading: 'Migration from the previous system',
          paragraphs: [
            'The business came from a previous management system (not Factusol), whose database was fully migrated to Factusol Cloud: article catalog, suppliers, customers, price lists, and the history of issued and received invoices and delivery notes.',
            "Data from the previous system was staged in PostgreSQL, cleaned and normalized (including AI-assisted classification to fill in incomplete article descriptions and families), manually reviewed for quality, and finally exported to the Excel templates Factusol Cloud's import tool expects.",
            'Because the business kept operating while the migration was being prepared, the process was designed to be incremental: new transactions (invoices, delivery notes, price lists) generated while the rest of the catalog was being cleaned up were folded into the same staging area over successive passes, so the final dump into Factusol Cloud reflected the full catalog and history up to the last day of activity on the previous system.',
          ],
        },
        {
          heading: 'Local deployment: Caddy & mobile devices as PDAs',
          paragraphs: [
            "The whole application (a FastAPI backend serving the React build, plus PostgreSQL) runs in containers via Docker Compose, behind Caddy as a reverse proxy. Caddy automatically issues and renews TLS certificates for an internal hostname on the business's local network, with no public domain required.",
            "With those certificates trusted on the store's phones, any employee can open the app from their phone's browser over HTTPS and use the camera as a barcode scanner (the BarcodeDetector API with a WASM polyfill so it also works on iOS), turning the phone into a PDA connected in real time to both the Factusol API and the synced PostgreSQL database.",
            'The result is real-time stock, pricing and inventory lookups from any phone on the shop floor, with no app to install and no dedicated hardware to buy.',
          ],
        },
      ],
    },
  },
  {
    id: 'fastapi-react-template',
    name: 'FastAPI + React Template',
    description:
      'Full stack template with SDD and development best practices. Includes pre-commit hooks, Git Flow, Docker, and modular structure for production projects.',
    stack: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'],
    repoUrl: 'https://github.com/migue0418/fastapi-react-template',
    featured: true,
    detail: {
      summary: [
        'A production-ready full-stack template: a FastAPI backend with async SQLAlchemy, Alembic, and role-based JWT authentication, a React + TypeScript + Vite frontend, and deployment via Docker Compose behind Caddy as a reverse proxy. It also ships with a Spec-Driven Development (OpenSpec) workflow built in from the first commit.',
        'The goal is to start any new project on a solid foundation (authentication, user and role management, modular architecture, migrations, pre-commit hooks, and versioned documentation) instead of rebuilding that infrastructure from scratch every time.',
      ],
      sections: [
        {
          heading: 'Slice architecture',
          paragraphs: [
            'Both the backend and the frontend organize code by feature ("slice") rather than by technical layer: each backend feature lives in app/features/<feature>/ with its router.py, schemas.py, service.py, repository.py, and, when needed, models.py files; each frontend feature lives in src/features/<feature>/ with api.ts, types.ts, and its page components.',
            'This organization keeps each feature self-contained and easy to locate, and makes it predictable which files a change (e.g. adding a new resource) will touch on either side.',
            'When a new SQLAlchemy model is added, it is imported in core/database.py::import_model_modules and the corresponding migration is generated with Alembic (alembic revision --autogenerate followed by alembic upgrade head), so the database schema stays versioned alongside the code.',
          ],
        },
        {
          heading: 'Auth & roles',
          paragraphs: [
            'Authentication combines a short-lived JWT access token (15 minutes) with a refresh token stored in an HTTP-only cookie, and passwords are stored using argon2 hashing (via pwdlib).',
            'Roles are modeled as a many-to-many relationship between User and Role through the user_roles join table, allowing a single user to hold multiple roles and reusing the same roles table for different access policies.',
            'The template ships with production-ready business rules: usernames are unique (a duplicate attempt returns 409) and a "last admin" safeguard prevents deleting, deactivating, or demoting the last active admin user in the system.',
          ],
        },
        {
          heading: 'Built-in Spec-Driven Development',
          paragraphs: [
            'The template includes a complete Spec-Driven Development workflow based on OpenSpec: /opsx:explore to clarify an idea, /opsx:propose to generate the proposal and its artifacts (specs, design, tasks), a file-level technical plan before implementing, /opsx:apply to execute the tasks, and /opsx:archive to merge the specs when closing the change.',
            'It includes specialized agents (backend-developer, frontend-developer, product-strategy-analyst) and reusable skills (openspec-*, enrich-us, write-pr-report) that automate recurring steps of the development cycle, from drafting user stories to opening the pull request.',
            'Project documentation is versioned alongside the code in docs/ (development_guide.md, base-standards.md, frontend-standards.md, backend-standards.md, data-model.md, among others), so conventions and the data model evolve in the same repository and under the same change control as the application.',
          ],
        },
      ],
    },
  },
]
