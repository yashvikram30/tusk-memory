# tusk-memory

A production-ready, strongly-typed TypeScript SDK for decentralized multi-agent shared memory layers (powered by MemWal) and permanent report/artifact archiving (powered by Mysten Labs' Walrus Testnet).

This SDK is fully compatible with Node 18+ environments, including serverless environments and frameworks like Next.js (Server Actions, API Routes) or FastAPI/Node orchestrators. It has zero external runtime dependencies and uses native global `fetch`.

## Features

- **Decentralized Whiteboard**: Share state, context, and debates between multiple AI agents using a SUI-based vector database relayer (MemWal).
- **Indexing Lag Mitigation**: Built-in local session memory buffer automatically merges write-operations with semantic query recalls so updates are immediately consistent for the active run context.
- **Permanent Archival**: Upload structured executive summaries or markdown logs directly to the Walrus Testnet and retrieve them by their cryptographic Blob ID.
- **Strictly Typed**: Full TypeScript support with exported types (`Note`, `ArchiveRecord`) and modern ES6 compilation outputs (ESM + CommonJS).

---

## Installation

Install via npm:

```bash
npm install tusk-memory
```

Or via yarn/pnpm:

```bash
yarn add tusk-memory
# or
pnpm add tusk-memory
```

---

## Quickstart

The following example demonstrates how to instantiate a `Workspace`, add agent debate notes, retrieve history, and archive final executive reports.

```typescript
import { Workspace } from 'tusk-memory';

async function main() {
  // 1. Initialize a Workspace (maps to a MemWal namespace)
  // Optional: Provide a Bearer Token or API key as the second parameter if required by the relayer
  const workspace = new Workspace('sui-research', process.env.MEMWAL_API_KEY);

  console.log(`Initialized Workspace: ${workspace.getWorkspaceId()}`);

  // 2. Add notes to the whiteboard (simulating a Researcher and Risk Manager agent)
  await workspace.addNote({
    author: 'Researcher',
    note: 'Sui network transaction throughput exceeded 10k TPS with sub-second finality this week.',
  });

  await workspace.addNote({
    author: 'Risk_Manager',
    note: 'Double-check congestion fee scaling and validators stability under this peak load.',
  });

  // 3. Fetch whiteboard history (instantly merges remote history and local buffer)
  const history = await workspace.getHistory();
  console.log('--- Whiteboard History ---');
  for (const item of history) {
    console.log(`[${item.author}]: ${item.note}`);
  }

  // 4. Archive a structured executive report to Walrus
  const reportContent = `
# Sui peak transaction throughput analysis
Compiled by Investment Committee Writer Agent.

- **Catalyst**: Peak transaction throughput has crossed 10k TPS.
- **Counter-argument**: Potential validator fee spikes.
- **Thesis**: Bullish, pending verification of validator gas stabilization.
  `;

  console.log('\nArchiving report to Walrus Testnet...');
  const blobId = await workspace.archiveReport(reportContent, 'Sui Peak TPS Debate');
  console.log(`Report successfully archived! Permanent Blob ID: ${blobId}`);
}

main().catch(console.error);
```

---

## API Reference

### `Workspace` Class

#### `new Workspace(workspaceId: string, apiKey?: string)`
Creates a new workspace interface connected to a MemWal namespace.

- `workspaceId`: The unique namespace ID for the memory index.
- `apiKey`: (Optional) Bearer authentication token passed to the MemWal relayer.

#### `workspace.addNote({ author: string, note: string }): Promise<void>`
Adds a note to the workspace. The note is cached in the local memory buffer immediately and sent to MemWal.

#### `workspace.getHistory(): Promise<Note[]>`
Retrieves all historical notes. It queries the remote MemWal storage and merges it with any unsaved/un-indexed session notes, deduplicating using the `(author, note)` combination.

#### `workspace.archiveReport(reportText: string, topic: string): Promise<string>`
Uploads the raw report text/markdown directly to the Walrus Testnet, receives the unique `blobId`, and adds a `System_Archive` indexing note to the workspace whiteboard containing the `blobId` and `topic` in JSON format.

---

## Under the Hood Helper Utilities

For advanced control, you can import the underlying REST wrappers directly:

```typescript
import { 
  saveMemory, 
  retrieveMemory, 
  uploadToWalrus, 
  fetchFromWalrus 
} from 'tusk-memory';
```

- `saveMemory(namespace, data, apiKey)`: POSTs to `https://api.memwal.ai/v1/memory`
- `retrieveMemory(namespace, apiKey)`: GETs from `https://api.memwal.ai/v1/memory/{namespace}`
- `uploadToWalrus(content)`: PUTs to `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=1`
- `fetchFromWalrus(blobId)`: GETs from `https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}`

---

## License

MIT License. Built for the MemWal Hackathon.
