/**
 * Generic retry-with-backoff helper.
 * Retries up to maxRetries times on thrown errors.
 * Backoff: 500ms after 1st failure, 1000ms after 2nd.
 *
 * @param fn         - Async function to attempt
 * @param maxRetries - Max retry count (default 2)
 * @param batchIndex - Optional batch index for clearer error messages
 * @param isValid    - Optional predicate; if it returns false the result is treated as a failure
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  batchIndex?: number,
  isValid?: (result: T) => boolean
): Promise<T> {
  const delays = [500, 1000];
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();

      if (isValid && !isValid(result)) {
        throw new Error('Result failed validity check');
      }

      return result;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const delay = delays[attempt] ?? 1000;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  const batchTag = batchIndex !== undefined ? ` (batch #${batchIndex})` : '';
  throw new Error(
    `All ${maxRetries + 1} attempts failed${batchTag}: ${lastError?.message ?? 'Unknown error'}`
  );
}
