/**
 * Wraps a promise with a timeout to prevent hanging operations.
 * @param promise The promise to wrap.
 * @param timeoutMs The timeout duration in milliseconds.
 * @param label An optional label for error messages.
 * @returns An object containing the result, timeout flag, and error message.
 */
export async function wrapWithTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  label: string = 'Operation'
): Promise<{ result: T | null; timedOut: boolean; error: string | null }> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`ETIMEDOUT: ${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return { result, timedOut: false, error: null };
  } catch (error: any) {
    clearTimeout(timeoutHandle!);
    
    const errorMessage = error.message || String(error);
    const timedOut = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timed out');
    
    // Format common network errors
    let formattedError = errorMessage;
    if (errorMessage.includes('ECONNREFUSED')) {
      formattedError = 'Connection refused by the host';
    } else if (errorMessage.includes('ECONNRESET')) {
      formattedError = 'Connection reset by the peer';
    } else if (errorMessage.includes('EHOSTUNREACH')) {
      formattedError = 'Host is unreachable';
    } else if (errorMessage.includes('socket hang up')) {
      formattedError = 'Socket hung up unexpectedly';
    }

    return { result: null, timedOut, error: formattedError };
  }
}
