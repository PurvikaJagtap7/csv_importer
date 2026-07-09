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
  fn: (currentBatch?: any[]) => Promise<T>,
  maxRetries = 2,
  batchIndex?: number,
  isValid?: (result: T) => boolean,
  batch?: any[]
): Promise<T> {
  const delays = [500, 1000];
  let lastError: Error | undefined;
  let validationOrJsonFailures = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn(batch);

      if (isValid && !isValid(result)) {
        throw new Error('Result failed validity check');
      }

      return result;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));

      const msg = lastError.message.toLowerCase();
      const isValidationOrJsonError =
        msg.includes('json') ||
        msg.includes('validation') ||
        msg.includes('validity') ||
        msg.includes('shape') ||
        msg.includes('non-array');

      if (isValidationOrJsonError) {
        validationOrJsonFailures++;
      }

      if (validationOrJsonFailures === 2 && batch && batch.length > 1) {
        const mid = Math.ceil(batch.length / 2);
        const left = batch.slice(0, mid);
        const right = batch.slice(mid);

        const leftResult = await retryWithBackoff(fn, maxRetries, batchIndex, isValid, left);
        const rightResult = await retryWithBackoff(fn, maxRetries, batchIndex, isValid, right);
        return [...(leftResult as any), ...(rightResult as any)] as unknown as T;
      }

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
