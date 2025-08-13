import { cn } from '../cn';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('bg-red-500', 'text-white');
    expect(result).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should merge conflicting Tailwind classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined inputs', () => {
    const result = cn('base-class', null, undefined, 'other-class');
    expect(result).toBe('base-class other-class');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'active': true,
      'disabled': false,
      'selected': true,
    });
    expect(result).toBe('active selected');
  });

  it('should merge complex Tailwind conflicts', () => {
    const result = cn(
      'px-4 py-2',
      'px-6', // Should override px-4
      'text-sm',
      'text-lg' // Should override text-sm
    );
    expect(result).toBe('py-2 px-6 text-lg');
  });
});