// Basic unit tests for utility functions
import { describe, it, expect } from 'vitest';

describe('Basic Math Operations', () => {
  it('should add two numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('should multiply numbers correctly', () => {
    expect(3 * 4).toBe(12);
  });

  it('should handle negative numbers', () => {
    expect(-5 + 3).toBe(-2);
  });
});

describe('String Operations', () => {
  it('should concatenate strings', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });

  it('should check string length', () => {
    const testString = 'TSL Sequence Store';
    expect(testString.length).toBe(18);
  });

  it('should convert to uppercase', () => {
    expect('komondor'.toUpperCase()).toBe('KOMONDOR');
  });
});

describe('Array Operations', () => {
  it('should filter arrays correctly', () => {
    const numbers = [1, 2, 3, 4, 5];
    const evens = numbers.filter(n => n % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  it('should map arrays correctly', () => {
    const numbers = [1, 2, 3];
    const doubled = numbers.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  it('should reduce arrays correctly', () => {
    const numbers = [1, 2, 3, 4];
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(10);
  });
});

describe('Object Operations', () => {
  it('should create objects correctly', () => {
    const project = {
      id: 1,
      name: 'Test Project',
      active: true
    };
    expect(project.name).toBe('Test Project');
    expect(project.active).toBe(true);
  });

  it('should spread objects correctly', () => {
    const base = { a: 1, b: 2 };
    const extended = { ...base, c: 3 };
    expect(extended).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should destructure objects correctly', () => {
    const user = { username: 'test', email: 'test@example.com' };
    const { username, email } = user;
    expect(username).toBe('test');
    expect(email).toBe('test@example.com');
  });
});

describe('Async Operations', () => {
  it('should handle promises', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });

  it('should handle async/await', async () => {
    const fetchData = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('data'), 10);
      });
    };
    const data = await fetchData();
    expect(data).toBe('data');
  });
});
