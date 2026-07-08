import { aiExtractorService } from '../src/services/aiExtractor.service';
import { groqClientService } from '../src/services/groqClient.service';
import { retryWithBackoff } from '../src/utils/retry';

jest.mock('../src/services/groqClient.service', () => {
  return {
    groqClientService: {
      callGroq: jest.fn(),
    },
  };
});

describe('AiExtractorService', () => {
  const callGroqMock = groqClientService.callGroq as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call groqClient to extract fields for a batch', async () => {
    const mockOutput = [{ name: 'John Doe', email: 'john@example.com' }];
    callGroqMock.mockResolvedValueOnce(mockOutput);

    const rows = [{ Name: 'John Doe', Email: 'john@example.com' }];
    const result = await aiExtractorService.extractBatch(rows);

    expect(result).toEqual(mockOutput);
    expect(callGroqMock).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors and retry', async () => {
    const mockOutput = [{ name: 'John Doe', email: 'john@example.com' }];
    callGroqMock
      .mockRejectedValueOnce(new Error('Rate limit exceeded'))
      .mockResolvedValueOnce(mockOutput);

    const rows = [{ Name: 'John Doe', Email: 'john@example.com' }];
    const result = await retryWithBackoff(() => aiExtractorService.extractBatch(rows), 2);

    expect(result).toEqual(mockOutput);
    expect(callGroqMock).toHaveBeenCalledTimes(2);
  });
});
