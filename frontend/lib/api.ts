import { ExtractResponse } from '@/types/crm.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ProgressEvent {
  batchIndex: number;
  totalBatches: number;
  status: 'done' | 'failed';
}

/**
 * Uploads a CSV file to the backend /api/extract endpoint with SSE streaming.
 * Calls onProgress for each batch completion event.
 * Resolves with the final ExtractResponse on the "complete" event.
 */
export async function extractCsv(
  file: File,
  onProgress?: (batchIndex: number, totalBatches: number, status: 'done' | 'failed') => void
): Promise<ExtractResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body?.error ?? `Server error ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';

  // ── SSE path ──────────────────────────────────────────────────────────────
  if (contentType.includes('text/event-stream')) {
    return new Promise<ExtractResponse>((resolve, reject) => {
      if (!response.body) {
        return reject(new Error('No response body for SSE stream'));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processChunk() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              return reject(new Error('SSE stream ended without a complete event'));
            }

            buffer += decoder.decode(value, { stream: true });

            // Split on double newline — SSE event boundary
            const events = buffer.split('\n\n');
            // Keep the last (potentially incomplete) chunk in the buffer
            buffer = events.pop() ?? '';

            for (const event of events) {
              const dataLine = event.split('\n').find((l) => l.startsWith('data:'));
              if (!dataLine) continue;

              const json = dataLine.slice('data:'.length).trim();
              let parsed: any;
              try {
                parsed = JSON.parse(json);
              } catch {
                continue;
              }

              if (parsed?.type === 'complete') {
                return resolve(parsed.result as ExtractResponse);
              }
              if (parsed?.type === 'error') {
                return reject(new Error(parsed.error ?? 'Extraction error'));
              }
              // Progress event
              if (
                typeof parsed?.batchIndex === 'number' &&
                typeof parsed?.totalBatches === 'number'
              ) {
                onProgress?.(parsed.batchIndex, parsed.totalBatches, parsed.status);
              }
            }

            processChunk();
          })
          .catch(reject);
      }

      processChunk();
    });
  }

  // ── JSON fallback (should not happen with default SSE) ────────────────────
  return response.json() as Promise<ExtractResponse>;
}
