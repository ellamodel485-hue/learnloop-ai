# LearnLoop AI

LearnLoop AI is a student-friendly learning companion that turns one question into a focused video lesson, concise flashcards, and a simple review loop.

## The learning loop

**Search topic → Find videos → Learn → Generate flashcards → Review**

The prototype includes:

- Topic search with realistic educational video recommendations
- Video descriptions, chapter timestamps, and focused lesson state
- Key learning points
- Interactive AI-style flashcards
- “I know this” and “I need to review this” actions
- Live study progress and a completion state
- A `VideoSearchAdapter` seam ready for a future Oriane-backed implementation

## Run locally

```bash
pnpm install
pnpm --filter @workspace/learnloop-ai run dev
```

The app is a frontend-only prototype and uses local demo content when a live video-search integration is not connected.