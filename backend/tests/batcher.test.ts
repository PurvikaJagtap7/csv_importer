import { batcherService } from '../src/services/batcher.service';

describe('BatcherService', () => {
  it('should batch raw rows into configured batch sizes', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    const batches = batcherService.batchRows(rows, 2);

    expect(batches.length).toBe(3);
    expect(batches[0]).toEqual([{ id: 0 }, { id: 1 }]);
    expect(batches[1]).toEqual([{ id: 2 }, { id: 3 }]);
    expect(batches[2]).toEqual([{ id: 4 }]);
  });

  it('should handle rows that do not divide evenly by batch size', () => {
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const batches = batcherService.batchRows(rows, 10);

    expect(batches.length).toBe(1);
    expect(batches[0].length).toBe(3);
  });
});
