import { MemWal } from '@mysten-incubation/memwal';

declare var process: any;

let memwalClient: MemWal | null = null;

function getClient(): MemWal {
  if (memwalClient) return memwalClient;

  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;

  if (!key || !accountId) {
    throw new Error('MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID must be set in the environment');
  }

  memwalClient = MemWal.create({
    key,
    accountId,
  });
  return memwalClient;
}

/**
 * Store data in the MemWal decentralized relayer memory.
 * 
 * @param namespace - The memory namespace/workspace ID.
 * @param data - The memory payload to be stored.
 * @param apiKey - Unused parameter retained for signature compatibility.
 * @returns The parsed JSON response from the relayer.
 */
export async function saveMemory(
  namespace: string,
  data: any,
  apiKey?: string
): Promise<any> {
  const client = getClient();
  const text = JSON.stringify(data);
  const accepted = await client.remember(text, namespace);
  // Wait for the background job to complete to match retrieveMemory consistency
  await client.waitForRememberJob(accepted.job_id);
  return accepted;
}

/**
 * Retrieve recent memories from the MemWal decentralized relayer for a namespace.
 * 
 * @param namespace - The memory namespace/workspace ID.
 * @param apiKey - Unused parameter retained for signature compatibility.
 * @returns The parsed JSON array of memories from the relayer.
 */
export async function retrieveMemory(
  namespace: string,
  apiKey?: string
): Promise<any[]> {
  const client = getClient();
  const recallResult = await client.recall('*', 50, namespace);

  return recallResult.results.map((r) => {
    try {
      return JSON.parse(r.text);
    } catch {
      return { author: 'System_Raw', note: r.text };
    }
  });
}
