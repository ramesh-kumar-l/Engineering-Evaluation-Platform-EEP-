import { describe, expect, it } from 'vitest';
import { REPORT_SCHEMA_VERSION, reportSchema } from './report.schema.js';

const validReport = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: 'report-001',
  experimentId: 'experiment-001',
  title: 'ECC vs native baseline — pilot results',
  evaluationIds: ['evaluation-001'],
  generatedAt: '2026-09-13T00:00:00Z',
};

describe('reportSchema', () => {
  it('accepts a valid report', () => {
    expect(reportSchema.parse(validReport).limitations).toEqual([]);
  });

  it('rejects a report with no evaluations behind it', () => {
    expect(() => reportSchema.parse({ ...validReport, evaluationIds: [] })).toThrow();
  });
});
