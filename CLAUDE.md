# CLAUDE.md

## Agent Behavior

Say "🫡" in your first message to acknowledge you've read this document.

## Project Overview

Startup Sourcer is a Python/React application that crawls sources (HackerNews, GitHub) for interesting pre-seed investment opportunities and posts them to Slack for review.

- **Backend**: Python 3.14.3 with pixi for dependency management
- **Frontend**: React with Vite and TypeScript
- **Main code**: `src/` directory
- **Database**: GCP Cloud SQL PostgreSQL 17.7

### Production VM (Compute Engine)

| Property | Value |
|----------|-------|
| Instance name | pretzel |
| Zone | us-central1-a |
| URL | https://pretzel.commit.capital (behind GCP IAP) |
| Service account | 384481460486-compute@developer.gserviceaccount.com |
| Scopes | cloud-platform |
| IAM roles | secretmanager.secretAccessor |

### Cloud SQL Instance

| Property | Value |
|----------|-------|
| Instance name | hedgehog |
| Connection name | content-aggregator-460115:us-central1:hedgehog |
| Public IP | 34.56.125.191 |
| Port | 5432 |
| Region | us-central1-c |
| Authorized networks | 0.0.0.0/0 (all) |

### Demo Mode

The app supports a demo mode activated by `?demo` in the URL. In demo mode, all API calls route to `demo_*` prefixed tables (e.g., `demo_startups` instead of `startups`) via `src/dashboard/demoMode.ts`.

**Key files:**
- `src/dashboard/demoMode.ts` — `apiTable()` helper and `isDemo` flag
- `scripts/seed_demo_data.py` — creates demo tables and populates fake data

**Demo tables** (8 total): `demo_startups`, `demo_founders`, `demo_assessment_scores`, `demo_assessment_comments`, `demo_assessment_files`, `demo_entity_tags`, `demo_traction_snapshots`, `demo_audit_log`

**Schema sync:** Demo table schemas are derived from real tables at seed time using `CREATE TABLE demo_x (LIKE x ...)`. When you add/remove columns from a real table, re-run `pixi run python scripts/seed_demo_data.py --write` to rebuild demo tables. If the seed script's INSERT data references a removed column, it will fail — update the seed data dicts to match.

---

## Custom Agents (.claude/agents/)

| Agent | Purpose |
|-------|---------|
| `keith-amling-backend-reviewer` | Senior backend code review — use after implementing backend changes to review for correctness, performance, and maintainability |
| `derek-cicerone-frontend-reviewer` | Senior frontend code review — use after implementing React/TypeScript changes to review for bugs, edge cases, and long-term robustness |

## Shared AI Prompt Assets

The `.claude/` directory is the canonical home for shared agent and skill prompts in this repo, even when the active coding assistant is not Claude.

- Canonical agent prompts live in `.claude/agents/`
- Canonical skill prompts live in `.claude/skills/`
- Codex wrappers live in `.codex/skills/` and should point back to the canonical `.claude/` files rather than duplicating prompt content
- When a `.claude/skills/*/SKILL.md` file contains runtime-specific wording, interpret it in the closest equivalent way for the active runtime instead of forking the prompt
- Treat changes under `.claude/` as shared prompt updates for both Claude and Codex workflows

## Cross-Assistant Skill Rule

When creating a new skill under `.claude/skills/<name>/SKILL.md`, also create a matching Codex wrapper at `.codex/skills/<name>/SKILL.md`.

- `.claude/skills/` remains the canonical source
- `.codex/skills/` wrappers must be thin and should point back to the canonical `.claude/` files
- Do not duplicate full prompt content into the Codex wrapper unless runtime differences require a small adapter
- Prefer runtime-neutral wording in canonical skill files so both Claude and Codex can follow the same workflow

---

## Style Conventions (MUST FOLLOW)

### Python Strings and Types

```python
# ✓ DO
name = 'hello'
items: list[str] = []
user: User | None = None
config: dict[str, int] = {}
def get_metrics() -> dict[str, float]:
    return {'score': 0.5}

# ✗ DON'T
name = "hello"
items: List[str] = []
user: Optional[User] = None
config: dict = {}  # missing type parameters
def get_metrics() -> dict:  # untyped dict
    return {'score': 0.5}
```

- Use single quotes for strings (except docstrings)
- Use lowercase `list`, `dict`, `set` for type hints
- Use `X | None` instead of `Optional[X]`
- Always fully type collections: `dict[str, int]` not `dict`, `list[str]` not `list`
- Skip `is not None` checks unless the type explicitly includes `| None`
- **Never use quoted types** like `'SomeClass'` - always use actual type names
- For circular imports, use `from __future__ import annotations` with `TYPE_CHECKING`:

```python
# ✓ DO - for circular imports
from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.other.module import OtherClass

class MyClass:
    def method(self, other: OtherClass) -> None:  # actual type, not quoted
        pass

# ✗ DON'T - never use quoted types
class MyClass:
    def method(self, other: 'OtherClass') -> None:  # quoted string
        pass
```

### Imports

```python
# ✓ DO
from src.services.slack import SlackClient
from src.pretzel.linkedin.tools import LinkedInTools
import requests

# ✗ DON'T
from services.slack import SlackClient  # missing src prefix
from src.pretzel.linkedin import LinkedInTools  # importing from __init__.py
def my_function():
    import requests  # local import
```

- Fully qualify internal imports starting with `src.`
- Put all third-party imports at file top, never as local imports
- Import directly from source files, not from `__init__.py` (keep `__init__.py` empty or docstring-only)

### Classes

```python
# ✓ DO
class DatabaseClient:
    def __init__(self, host: str, port: int):
        self.__host = host
        self.__port = port

    @property
    def host(self) -> str:  # only if accessed externally
        return self.__host

# ✗ DON'T
class DatabaseClient:
    def __init__(self, host: str, port: int):
        self.host = host  # public attribute
        self._port = port  # single underscore
```

- Use `__private` double-underscore instance variables
- Only add `@property` for fields that need external access

### Dataclasses and Parameters

- Put dataclasses in separate files, not embedded in service/database files
- For ≤4 parameters, use keyword arguments instead of a dataclass
- `dry_run` parameter always goes last

### Tool Return Types

```python
# ✓ DO - Use dataclasses for tool return types with stable shapes
@dataclass
class DiscordServerInfo:
    success: bool
    server_name: str | None
    member_count: int

def get_server_info(self, invite: str) -> DiscordServerInfo:
    return DiscordServerInfo(success=True, ...)

def execute(self, tool_name: str, args: dict[str, Any]) -> dict[str, Any]:
    result = self.get_server_info(args['invite'])
    return asdict(result)

# ✗ DON'T - Use dict[str, Any] for stable return shapes
def get_server_info(self, invite: str) -> dict[str, Any]:
    return {'success': True, 'server_name': ...}
```

- Put dataclasses in `models.py` files within each module directory
- Use `dataclasses.asdict()` in `execute()` for JSON serialization
- Keep `dict[str, Any]` for: raw API responses, tool definitions, tool args, cache layer

### TypeScript and React

```tsx
// ✓ DO - Type all function parameters and return types
function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

// ✓ DO - Use an interface for component props (even internal components)
interface TagBadgeProps {
  tag: EntityTag;
  onRemove?: () => void;
}

function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return <span>{tag.tag_name}</span>;
}

// ✓ DO - Use `import type` for type-only imports
import type { Startup, Founder } from "./Dashboard";

// ✓ DO - Use `X | null` for nullable types, parameterize generics
const [data, setData] = useState<Startup[]>([]);
const [selected, setSelected] = useState<Startup | null>(null);

// ✓ DO - Descriptive callback arguments
const unique = rows.map(row => row.tag_name);
scores.filter(score => score.value >= 7);

// ✓ DO - Early returns over else blocks
function scoreBadgeClass(score: number): string {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

// ✗ DON'T - Untyped parameters or return types on non-trivial functions
function formatDate(value) { ... }

// ✗ DON'T - Use `any` (use `unknown` and narrow instead)
const data: any = await res.json();

// ✗ DON'T - Inline prop types on components (extract to an interface)
function TagBadge({ tag, onRemove }: { tag: EntityTag; onRemove?: () => void }) { ... }

// ✗ DON'T - Single-letter callback arguments
rows.map(r => r.tag_name);
scores.filter(s => s.value >= 7);
```

- **Always type function parameters and return types** for exported and non-trivial functions
- Use `X | null` instead of `X | undefined` for nullable state; use `undefined` only when an API or prop is genuinely optional
- Use `unknown` instead of `any`; narrow with type guards
- Extract component prop types into named interfaces (e.g., `TagBadgeProps`), don't use inline object types in the function signature
- Use `import type` for imports used only in type positions
- Use double quotes for strings (matches JSX convention and default formatter behavior)
- Define interfaces in the same file unless shared across multiple files
- Use `interface` for object shapes, `type` for unions and aliases
- **Never use single-letter callback arguments**: `rows.map(row => ...)` not `rows.map(r => ...)`
- **Avoid `else` blocks**; prefer early returns with `if` statements
- **Prefer `map`/`filter`/`flatMap`** over `for`/`while` loops
- **Prefer React Router `Link` components** over `navigate()` in onClick handlers to preserve native browser behavior (middle-click, right-click open in new tab)
- **No generic utility modules** (`utils.ts`, `helpers.ts`); use descriptive file names
- **Treat abbreviations as regular words** in identifiers: `HttpClient` not `HTTPClient`, `ApiResponse` not `APIResponse`
- **Organize files in order**: imports → constants → types/interfaces → exported functions → private functions
- ESLint is configured — run `npm run lint` to check

### Database Queries

```python
# ✓ DO
cursor.execute(f'SELECT * FROM users WHERE id = {self.__param_char}', (user_id,))

# ✗ DON'T
cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))  # hardcoded
```

- Use the stored `param_char` instead of hardcoding `%s`

### Database Transactions (CloudClient)

CloudClient uses `autocommit=False`, so every `cursor.execute()` opens an implicit transaction. You must understand the commit/rollback rules before writing database code.

**Connection lifecycle:**
- `_conn` property auto-reconnects if the connection died while idle (no pending writes)
- If the connection dies mid-transaction, `_conn` raises `ConnectionError` — uncommitted work is gone
- Long-lived sessions (e.g., Pretzel agent) survive idle disconnects transparently

**Read operations** — use `_read_cursor()` context manager:
```python
# ✓ DO — auto-commits on exit, auto-rolls-back on exception
with self._read_cursor() as cursor:
    cursor.execute('SELECT ...')
    rows = cursor.fetchall()
```

**Write operations** — use manual cursor + explicit `commit()`:
```python
# ✓ DO
cursor = self._conn.cursor(cursor_factory=RealDictCursor)
cursor.execute('INSERT INTO ... RETURNING id', (...))
result = cursor.fetchone()
self._conn.commit()
```

**Critical: `rollback()` kills the ENTIRE transaction, not just the last statement.**

```python
# ✗ WRONG — rollback nukes all prior inserts in the loop
for item in items:
    try:
        cursor.execute('INSERT ...', (item,))
    except Exception:
        self._conn.rollback()  # destroys ALL prior successful inserts

# ✓ DO — use SAVEPOINTs to isolate failures within a transaction
for item in items:
    try:
        cursor.execute('SAVEPOINT item_insert')
        cursor.execute('INSERT ...', (item,))
        cursor.execute('RELEASE SAVEPOINT item_insert')
    except Exception:
        cursor.execute('ROLLBACK TO SAVEPOINT item_insert')
self._conn.commit()  # commits all successful inserts
```

**`_log_audit()` does not commit** — it inserts into the caller's transaction. The caller's `commit()` persists both the main operation and the audit entry atomically.

### Exception Handling

- Don't catch and wrap exceptions unless explicitly instructed

### Comments

- Never reference past iterations of code in comments (e.g., "replaces X", "instead of Y")
- Comments describe what the code does now, not what it used to do

### Formatting

- Blank lines must be truly empty (no trailing whitespace)

### Testing

- Use `unittest.TestCase` with `self.assert*` methods (e.g., `self.assertIn`, `self.assertTrue`, `self.assertEqual`)
- **NEVER** skip or comment out failing tests to make them pass

### Verification (MUST DO before declaring work complete)

- Run `pixi run pyright` to check for type errors
- Run `pixi run pytest` to ensure all tests pass
- Run `pixi run ruff check` to check Python linting
- Run `npm run lint` to check TypeScript linting (if frontend files were changed)

---

## Dependency Management

### Adding Python Dependencies (pixi.toml)

1. Check if package exists on conda-forge first
2. Only use `pypi-dependencies` if not available on conda-forge
3. Verify latest stable version on PyPI or conda-forge before adding
4. Alphabetize entries
5. Pin exact versions (no `*` wildcards)

```toml
# ✓ DO
[dependencies]
openai = "1.52.0"
requests = "2.31.0"

# ✗ DON'T
[dependencies]
requests = "*"
openai = "1.52.0"  # not alphabetized
```

### Adding JS Dependencies (package.json)

1. Verify latest version on npm before adding
2. Alphabetize entries
3. Pin exact versions (no `^` carets)

```json
// ✓ DO
"dependencies": {
  "react": "18.2.0",
  "vite": "5.0.0"
}

// ✗ DON'T
"dependencies": {
  "vite": "^5.0.0",
  "react": "18.2.0"
}
```

---

## Commands Reference

### Python (via pixi)

```bash
pixi shell              # activate environment
pixi install            # install dependencies
pixi run pytest         # run all tests
pixi run pytest path/to/test.py  # run specific test
```

### Frontend (via npm)

```bash
npm install             # install dependencies
npm run dev             # development server
npm run build           # production build
npx serve -s dist -l 8080  # serve built app
```

### Initial Setup (Linux)

```bash
curl -fsSL https://pixi.sh/install.sh | sh
sudo apt install nodejs npm
```

---

## GitHub API Tools (Pretzel Agent)

| Tool | Purpose |
|------|---------|
| `github_get_repo_stats` | Repository statistics |
| `github_get_repo_activity` | Star velocity, commit frequency |
| `github_find_activity_spikes` | Trending repositories |
| `github_get_contributors` | Contributor profiles |
| `github_search_users` | Search by bio/company |
| `github_get_user_profile` | Detailed user profiles |
| `github_get_org_info` | Organization info: public member count, repos, creation date |
| `github_get_org_members` | List public members of an organization with profiles |
| `github_check_rate_limit` | API usage monitoring |
| `github_extract_repo_links` | Extract all social links from README and owner profile (Twitter, LinkedIn, Discord, etc.) |

## HackerNews API Tools (Pretzel Agent)

Free API, no authentication required. Uses the official HackerNews Firebase API.

| Tool | Purpose |
|------|---------|
| `hackernews_get_item` | Get item details (story, comment, job) by ID - use instead of browsing to HN item URLs |
| `hackernews_get_user` | Get user profile: karma, account age, about text - assess Show HN poster credibility |

## LinkedIn API Tools (Pretzel Agent)

Requires RapidAPI key in `auth/linkedin_api_auth.json`. See `auth/linkedin_api_auth.json.example`.

| Tool | Purpose |
|------|---------|
| `linkedin_get_user_profile` | Full profile with work history, education, skills |
| `linkedin_search_people` | Search by keywords, company, title, location |
| `linkedin_get_company_info` | Company details, size, industry |
| `linkedin_search_company_employees` | Find employees by title (founders, CEOs) |
| `linkedin_check_faang_background` | Check for FAANG/big tech experience |

## Twitter/X API Tools (Pretzel Agent)

Requires RapidAPI key in `auth/twitter_api_auth.json`. See `auth/twitter_api_auth.json.example`.

| Tool | Purpose |
|------|---------|
| `twitter_search_tweets` | Search tweets by keywords ("just launched", "building in public") |
| `twitter_search_users` | Search users by bio keywords ("ex-Google", "founder") |
| `twitter_get_user_profile` | Get user details (followers, bio, engagement) |

## npm Registry Tools (Pretzel Agent)

Free API, no authentication required.

| Tool | Purpose |
|------|---------|
| `npm_search_packages` | Search packages by keywords, author, maintainer |
| `npm_get_package_info` | Get package details (author, maintainers, repo link) |
| `npm_get_download_stats` | Download counts and growth trend (traction signal) |
| `npm_get_maintainer_packages` | Find all packages by a specific maintainer |

## PyPI Registry Tools (Pretzel Agent)

Free API, no authentication required.

| Tool | Purpose |
|------|---------|
| `pypi_get_package_info` | Get package details (author, repo link, classifiers) |
| `pypi_get_download_stats` | Download counts and growth trend (traction signal) |
| `pypi_get_package_releases` | Release history and development cadence |

## VS Code Marketplace Tools (Pretzel Agent)

Free API, no authentication required.

| Tool | Purpose |
|------|---------|
| `vscode_get_extension_info` | Get extension details: install count, rating, publisher, repository, trending metrics |
| `vscode_search_extensions` | Search marketplace by keywords, sort by installs/rating/trending |
| `vscode_get_publisher_extensions` | Find all extensions by a specific publisher |

## Discord API Tools (Pretzel Agent)

Free API, no authentication required. Works with public invite links.

| Tool | Purpose |
|------|---------|
| `discord_get_server_info` | Get server metrics from invite link: member count, online count, activity ratio |

## Reddit API Tools (Pretzel Agent)

Free API, no authentication required. Uses Reddit's public JSON endpoints.

| Tool | Purpose |
|------|---------|
| `reddit_get_user_profile` | Get user karma, account age, verification status |
| `reddit_get_user_posts` | Get user's post/comment history, subreddit breakdown, startup-related activity |

## Crunchbase API Tools (Pretzel Agent)

Requires Bright Data API token in `auth/crunchbase_auth.json`. See `auth/crunchbase_auth.json.example`.

| Tool | Purpose |
|------|---------|
| `crunchbase_get_company` | Full company profile: funding, founders, investors, tech stack, traffic |
| `crunchbase_search_companies` | Search by keyword (SLOW: 3-5 min, only use when user explicitly asks for Crunchbase search) |
| `crunchbase_get_funding` | Detailed funding history with rounds, amounts, and investors |

## SEC EDGAR Tools (Pretzel Agent)

Free API, no authentication required. Searches Form D filings to determine if a company has raised funding.

| Tool | Purpose |
|------|---------|
| `sec_check_company_raised` | Check if a company has filed Form D (indicates they've raised funding) |
| `sec_search_form_d` | Search for Form D filings by company name or get recent filings |
| `sec_get_recent_filings` | Get Form D filings from the past 7-30 days to discover new fundraises |
| `sec_get_company_form_d_history` | Get complete Form D history for a company by CIK |
| `sec_lookup_company_cik` | Look up a company's SEC CIK number by name |

## Document Tools (Pretzel Agent)

Tesseract OCR auto-installed by `./pretzel` on first run (needed for images/scanned docs).

| Tool | Purpose |
|------|---------|
| `extract_document_text` | Extract text from local files or URLs (PDFs, Word docs, PowerPoint, images, EPUB) |

## Slack Channel Tools (Pretzel Agent)

Uses the Slack Bot token from `auth/slack_auth.json` (GCP Secret Manager).

| Tool | Purpose |
|------|---------|
| `get_slack_message` | Fetch a Slack message by URL, optionally with thread replies |
| `send_slack_message` | Send a message to a Slack channel (requires user approval) |
| `slack_get_channel_history` | Fetch recent messages from a channel with optional time filter and thread expansion |
| `slack_search_messages` | Search for messages containing keywords in a channel (case-insensitive) |
| `slack_list_channels` | List all channels accessible to the bot with member counts and purposes |
