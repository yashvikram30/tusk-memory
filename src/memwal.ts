/**
 * Store data in the MemWal decentralized relayer memory.
 * 
 * @param namespace - The memory namespace/workspace ID.
 * @param data - The memory payload to be stored.
 * @param apiKey - Optional API key/token for authorization.
 * @returns The parsed JSON response from the relayer.
 */
export async function saveMemory(
  namespace: string,
  data: any,
  apiKey?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = apiKey.includes(' ') ? apiKey : `Bearer ${apiKey}`;
  }

  const response = await fetch('https://api.memwal.ai/v1/memory', {
    method: 'POST',
    headers,
    body: JSON.stringify({ namespace, data }),
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      errorDetails = await response.text();
    } catch {
      // Ignore if text body reading fails
    }
    throw new Error(
      `Failed to save memory to MemWal (HTTP ${response.status}): ${response.statusText}${
        errorDetails ? ` - ${errorDetails}` : ''
      }`
    );
  }

  return response.json();
}

/**
 * Retrieve recent memories from the MemWal decentralized relayer for a namespace.
 * 
 * @param namespace - The memory namespace/workspace ID.
 * @param apiKey - Optional API key/token for authorization.
 * @returns The parsed JSON array of memories from the relayer.
 */
export async function retrieveMemory(
  namespace: string,
  apiKey?: string
): Promise<any[]> {
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers['Authorization'] = apiKey.includes(' ') ? apiKey : `Bearer ${apiKey}`;
  }

  const response = await fetch(`https://api.memwal.ai/v1/memory/${namespace}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      errorDetails = await response.text();
    } catch {
      // Ignore
    }
    throw new Error(
      `Failed to retrieve memory from MemWal (HTTP ${response.status}): ${response.statusText}${
        errorDetails ? ` - ${errorDetails}` : ''
      }`
    );
  }

  const result = await response.json();
  
  // Return the result array. Ensure we return an array.
  // The backend might return {"memories": [...]} or just [...] directly.
  // Let's inspect or normalize it:
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === 'object' && Array.isArray(result.memories)) {
    return result.memories;
  }
  if (result && typeof result === 'object' && Array.isArray(result.results)) {
    return result.results;
  }
  
  // Fallback to returning result wrapped as list if it's not already an array
  return result ? [result] : [];
}
