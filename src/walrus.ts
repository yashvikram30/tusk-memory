/**
 * Upload content to the Walrus Testnet.
 * 
 * @param content - The raw string/markdown content to upload.
 * @returns The generated blob ID (blobId).
 */
export async function uploadToWalrus(content: string, epochs: number = 5): Promise<string> {
  const response = await fetch(
    `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=${epochs}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: content,
    }
  );

  if (!response.ok) {
    let errorDetails = '';
    try {
      errorDetails = await response.text();
    } catch {
      // Ignore
    }
    throw new Error(
      `Failed to upload to Walrus (HTTP ${response.status}): ${response.statusText}${
        errorDetails ? ` - ${errorDetails}` : ''
      }`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err: any) {
    throw new Error(`Failed to parse Walrus JSON response: ${err?.message || err}`);
  }

  // Parse blobId (checks newlyCreated or alreadyCertified)
  const blobId =
    data.newlyCreated?.blobObject?.blobId || data.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error(
      `Blob ID not found in Walrus response. Payload was: ${JSON.stringify(data)}`
    );
  }

  return blobId;
}

/**
 * Fetch raw content from the Walrus Testnet by its blob ID.
 * 
 * @param blobId - The Walrus blob identifier.
 * @returns The downloaded content as a string.
 */
export async function fetchFromWalrus(blobId: string): Promise<string> {
  const response = await fetch(
    `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`
  );

  if (!response.ok) {
    let errorDetails = '';
    try {
      errorDetails = await response.text();
    } catch {
      // Ignore
    }
    throw new Error(
      `Failed to fetch from Walrus (HTTP ${response.status}): ${response.statusText}${
        errorDetails ? ` - ${errorDetails}` : ''
      }`
    );
  }

  return response.text();
}
