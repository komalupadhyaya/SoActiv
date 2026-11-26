import { calculateEndDateFromStart } from './TransferServiceModal';

function runTests() {
  const tests = [
    {
      name: 'Example A: 91 days (3-month span)',
      startDate: '2026-09-10',
      duration: 91,
      expected: '2026-12-09',
    },
    {
      name: 'Example B: 30 days',
      startDate: '2026-02-10',
      duration: 30,
      expected: '2026-03-11',
    },
    {
      name: 'Example C: 31 days',
      startDate: '2026-02-10',
      duration: 31,
      expected: '2026-03-12',
    },
    {
      name: 'Example D: 60 days',
      startDate: '2026-02-10',
      duration: 60,
      expected: '2026-04-10',
    },
    {
      name: 'Example E: 180 days',
      startDate: '2026-02-10',
      duration: 180,
      expected: '2026-08-08',
    },
    {
      name: 'Example F: 365 days',
      startDate: '2026-02-10',
      duration: 365,
      expected: '2027-02-09',
    },
    {
      name: 'Leap Year Test: Feb 28 2028 + 10 days',
      startDate: '2028-02-28',
      duration: 10,
      expected: '2028-03-08',
    },
    {
      name: 'Month Boundary Test: Jan 31 2026 + 31 days',
      startDate: '2026-01-31',
      duration: 31,
      expected: '2026-03-02',
    },
    {
      name: 'Year Rollover: Dec 01 2026 + 90 days',
      startDate: '2026-12-01',
      duration: 90,
      expected: '2027-02-28',
    },
  ];

  let passed = 0;
  for (const t of tests) {
    const actual = calculateEndDateFromStart(t.startDate, t.duration);
    if (actual === t.expected) {
      console.log(`✓ PASS: ${t.name} -> ${actual}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${t.name} -> Expected ${t.expected}, Got ${actual}`);
    }
  }

  console.log(`\nResult: ${passed}/${tests.length} tests passed.`);
}

runTests();
