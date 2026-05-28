import { saveMemory, retrieveMemory } from './memwal.js';
import { uploadToWalrus } from './walrus.js';

export interface Note {
  author: string;
  note: string;
}

export interface ArchiveRecord {
  blobId: string;
  topic: string;
}

export class Workspace {
  private workspaceId: string;
  private apiKey?: string;
  private sessionNotes: Note[] = [];

  /**
   * Creates an instance of Workspace.
   * 
   * @param workspaceId - The identifier for the workspace (maps to MemWal namespace).
   * @param apiKey - Optional API Key or Bearer Token for MemWal endpoints.
   */
  constructor(workspaceId: string, apiKey?: string) {
    if (!workspaceId) {
      throw new Error('workspaceId is required');
    }
    this.workspaceId = workspaceId;
    this.apiKey = apiKey;
  }

  /**
   * Adds a note to the workspace, caching it in the local session buffer
   * and saving it to MemWal for decentralized permanence.
   * 
   * @param payload - Object containing author and note content.
   */
  async addNote({ author, note }: { author: string; note: string }): Promise<void> {
    const payload: Note = { author, note };
    
    // Add to session notes immediately so getHistory() is updated synchronously
    this.sessionNotes.push(payload);
    
    // Persist to MemWal
    await saveMemory(this.workspaceId, payload, this.apiKey);
  }

  /**
   * Fetches the complete history for this workspace from MemWal and merges it
   * with the local session notes to ensure instant consistency regardless of indexing lag.
   * 
   * @returns A list of notes representing the whiteboard history.
   */
  async getHistory(): Promise<any[]> {
    // Retrieve historical notes from MemWal
    const remoteHistory = await retrieveMemory(this.workspaceId, this.apiKey);

    // Build deduplication keys for remote notes: "author|||note"
    const remoteKeys = new Set<string>();
    for (const item of remoteHistory) {
      if (item && typeof item === 'object' && 'author' in item && 'note' in item) {
        remoteKeys.add(`${item.author}|||${item.note}`);
      }
    }

    // Merge remote history with local session notes not yet reflected in remote
    const merged = [...remoteHistory];
    for (const localNote of this.sessionNotes) {
      const key = `${localNote.author}|||${localNote.note}`;
      if (!remoteKeys.has(key)) {
        merged.push(localNote);
      }
    }

    return merged;
  }

  /**
   * Archives a compiled report to Walrus Testnet and records an index note
   * in MemWal for future recall/injection.
   * 
   * @param reportText - The compiled markdown/text report content.
   * @param topic - The topic of the debate/report.
   * @returns The generated blob ID from Walrus.
   */
  async archiveReport(reportText: string, topic: string): Promise<string> {
    if (!reportText) {
      throw new Error('reportText cannot be empty');
    }
    if (!topic) {
      throw new Error('topic cannot be empty');
    }

    // 1. Upload report directly to Walrus Testnet
    const blobId = await uploadToWalrus(reportText);

    // 2. Format index metadata payload
    const archivePayload: ArchiveRecord = {
      blobId,
      topic,
    };

    // 3. Write System_Archive note back to the whiteboard workspace
    await this.addNote({
      author: 'System_Archive',
      note: JSON.stringify(archivePayload),
    });

    return blobId;
  }

  /**
   * Returns the Workspace ID (MemWal namespace).
   */
  getWorkspaceId(): string {
    return this.workspaceId;
  }

  /**
   * Returns current local session buffer notes.
   */
  getSessionNotes(): Note[] {
    return [...this.sessionNotes];
  }

  /**
   * Clears the local session buffer notes.
   */
  clearSessionNotes(): void {
    this.sessionNotes = [];
  }
}
