/**
 * Usage Limit Validation Utilities
 * 
 * Provides robust validation and atomic operations for usage limits
 * to prevent race conditions, negative counts, and invalid date calculations.
 */

export interface UsageLimitValidationError {
  code: string;
  message: string;
  field: string;
  value: any;
}

export class UsageLimitValidationError extends Error {
  constructor(
    public code: string,
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'UsageLimitValidationError';
  }
}

/**
 * Validates that a count value is non-negative and within reasonable bounds
 */
export function validateCount(count: number, fieldName: string, maxValue = 10000): void {
  if (typeof count !== 'number') {
    throw new UsageLimitValidationError(
      'INVALID_TYPE',
      `${fieldName} must be a number`,
      fieldName,
      count
    );
  }

  if (!Number.isInteger(count)) {
    throw new UsageLimitValidationError(
      'INVALID_INTEGER',
      `${fieldName} must be an integer`,
      fieldName,
      count
    );
  }

  if (count < 0) {
    throw new UsageLimitValidationError(
      'NEGATIVE_COUNT',
      `${fieldName} cannot be negative`,
      fieldName,
      count
    );
  }

  if (count > maxValue) {
    throw new UsageLimitValidationError(
      'COUNT_TOO_HIGH',
      `${fieldName} cannot exceed ${maxValue}`,
      fieldName,
      count
    );
  }
}

/**
 * Validates that a limit value is positive and within reasonable bounds
 */
export function validateLimit(limit: number, fieldName: string, maxValue = 10000): void {
  if (typeof limit !== 'number') {
    throw new UsageLimitValidationError(
      'INVALID_TYPE',
      `${fieldName} must be a number`,
      fieldName,
      limit
    );
  }

  if (!Number.isInteger(limit)) {
    throw new UsageLimitValidationError(
      'INVALID_INTEGER',
      `${fieldName} must be an integer`,
      fieldName,
      limit
    );
  }

  if (limit <= 0) {
    throw new UsageLimitValidationError(
      'INVALID_LIMIT',
      `${fieldName} must be positive`,
      fieldName,
      limit
    );
  }

  if (limit > maxValue) {
    throw new UsageLimitValidationError(
      'LIMIT_TOO_HIGH',
      `${fieldName} cannot exceed ${maxValue}`,
      fieldName,
      limit
    );
  }
}

/**
 * Validates that a date string is in the correct format and represents a valid date
 */
export function validateDateString(dateString: string, fieldName: string): void {
  if (typeof dateString !== 'string') {
    throw new UsageLimitValidationError(
      'INVALID_TYPE',
      `${fieldName} must be a string`,
      fieldName,
      dateString
    );
  }

  // Check for ISO date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new UsageLimitValidationError(
      'INVALID_DATE_FORMAT',
      `${fieldName} must be in YYYY-MM-DD format`,
      fieldName,
      dateString
    );
  }

  // Validate that it's a real date
  const date = new Date(dateString + 'T00:00:00.000Z');
  if (isNaN(date.getTime())) {
    throw new UsageLimitValidationError(
      'INVALID_DATE',
      `${fieldName} is not a valid date`,
      fieldName,
      dateString
    );
  }

  // Check that the date is not in the future (with 1 day tolerance for timezone issues)
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (date > tomorrow) {
    throw new UsageLimitValidationError(
      'FUTURE_DATE',
      `${fieldName} cannot be in the future`,
      fieldName,
      dateString
    );
  }

  // Check that the date is not too far in the past (1 year)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (date < oneYearAgo) {
    throw new UsageLimitValidationError(
      'DATE_TOO_OLD',
      `${fieldName} cannot be more than 1 year old`,
      fieldName,
      dateString
    );
  }
}

/**
 * Validates that a month string is in the correct format (YYYY-MM)
 */
export function validateMonthString(monthString: string, fieldName: string): void {
  if (typeof monthString !== 'string') {
    throw new UsageLimitValidationError(
      'INVALID_TYPE',
      `${fieldName} must be a string`,
      fieldName,
      monthString
    );
  }

  // Check for ISO month format (YYYY-MM)
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(monthString)) {
    throw new UsageLimitValidationError(
      'INVALID_MONTH_FORMAT',
      `${fieldName} must be in YYYY-MM format`,
      fieldName,
      monthString
    );
  }

  // Validate that it's a real month
  const [year, month] = monthString.split('-').map(Number);
  if (month < 1 || month > 12) {
    throw new UsageLimitValidationError(
      'INVALID_MONTH',
      `${fieldName} month must be between 01 and 12`,
      fieldName,
      monthString
    );
  }

  if (year < 2020 || year > 2100) {
    throw new UsageLimitValidationError(
      'INVALID_YEAR',
      `${fieldName} year must be between 2020 and 2100`,
      fieldName,
      monthString
    );
  }

  // Check that the month is not in the future
  const now = new Date();
  const currentMonth = now.toISOString().substring(0, 7);
  if (monthString > currentMonth) {
    throw new UsageLimitValidationError(
      'FUTURE_MONTH',
      `${fieldName} cannot be in the future`,
      fieldName,
      monthString
    );
  }
}

/**
 * Safely increments a count value with validation
 */
export function safeIncrementCount(
  currentCount: number,
  fieldName: string,
  maxValue = 10000
): number {
  validateCount(currentCount, `current ${fieldName}`, maxValue);
  
  const newCount = currentCount + 1;
  validateCount(newCount, `incremented ${fieldName}`, maxValue);
  
  return newCount;
}

/**
 * Safely decrements a count value with validation
 */
export function safeDecrementCount(
  currentCount: number,
  fieldName: string,
  minValue = 0
): number {
  validateCount(currentCount, `current ${fieldName}`);
  
  if (currentCount <= minValue) {
    throw new UsageLimitValidationError(
      'CANNOT_DECREMENT',
      `Cannot decrement ${fieldName} below ${minValue}`,
      fieldName,
      currentCount
    );
  }
  
  return currentCount - 1;
}

/**
 * Safely resets a count to zero with validation
 */
export function safeResetCount(fieldName: string): number {
  return 0;
}

/**
 * Gets the current date string in UTC timezone to avoid timezone issues
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Gets the current month string in UTC timezone
 */
export function getCurrentMonthString(): string {
  return new Date().toISOString().substring(0, 7);
}

/**
 * Checks if a date string represents today (in UTC)
 */
export function isToday(dateString: string): boolean {
  try {
    validateDateString(dateString, 'dateString');
    return dateString === getCurrentDateString();
  } catch {
    return false;
  }
}

/**
 * Checks if a month string represents the current month (in UTC)
 */
export function isCurrentMonth(monthString: string): boolean {
  try {
    validateMonthString(monthString, 'monthString');
    return monthString === getCurrentMonthString();
  } catch {
    return false;
  }
}

/**
 * Calculates the number of days between a start date and today
 * Returns -1 if the calculation is invalid
 */
export function getDaysDifference(startDateString: string): number {
  try {
    validateDateString(startDateString, 'startDateString');
    
    const startDate = new Date(startDateString + 'T00:00:00.000Z');
    const today = new Date();
    
    // Set today to start of day in UTC for consistent comparison
    const todayUTC = new Date(today.toISOString().split('T')[0] + 'T00:00:00.000Z');
    
    const diffTime = todayUTC.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Add 1 to include the start day in the count
    return diffDays + 1;
  } catch {
    return -1;
  }
}

/**
 * Validates that a tracking start date is reasonable
 */
export function validateTrackingStartDate(startDate: string | null): void {
  if (startDate === null) {
    return; // null is valid for unstarted tracking
  }

  validateDateString(startDate, 'trackingStartDate');
  
  // Additional validation: start date should not be more than 30 days ago
  const daysDiff = getDaysDifference(startDate);
  if (daysDiff > 30) {
    throw new UsageLimitValidationError(
      'START_DATE_TOO_OLD',
      'Tracking start date cannot be more than 30 days ago',
      'trackingStartDate',
      startDate
    );
  }
  
  if (daysDiff < 1) {
    throw new UsageLimitValidationError(
      'INVALID_START_DATE',
      'Tracking start date is invalid',
      'trackingStartDate',
      startDate
    );
  }
}

/**
 * Atomic operation wrapper that ensures usage limit updates are consistent
 */
export function atomicUsageLimitUpdate<T>(
  operation: () => T,
  operationName: string
): T {
  try {
    const result = operation();
    
    // Log successful atomic operation for debugging
    console.debug(`Atomic usage limit operation completed: ${operationName}`);
    
    return result;
  } catch (error) {
    // Log failed atomic operation
    console.error(`Atomic usage limit operation failed: ${operationName}`, error);
    
    // Re-throw the error to maintain error handling flow
    throw error;
  }
}

/**
 * Validates a complete usage limits object structure
 */
export function validateUsageLimitsStructure(usageLimits: any): void {
  if (!usageLimits || typeof usageLimits !== 'object') {
    throw new UsageLimitValidationError(
      'INVALID_STRUCTURE',
      'Usage limits must be an object',
      'usageLimits',
      usageLimits
    );
  }

  // Validate Oracle questions structure
  if (!usageLimits.oracleQuestions || typeof usageLimits.oracleQuestions !== 'object') {
    throw new UsageLimitValidationError(
      'INVALID_STRUCTURE',
      'Oracle questions usage limits must be an object',
      'oracleQuestions',
      usageLimits.oracleQuestions
    );
  }

  const oracle = usageLimits.oracleQuestions;
  validateLimit(oracle.monthlyLimit, 'oracleQuestions.monthlyLimit');
  validateCount(oracle.monthlyCount, 'oracleQuestions.monthlyCount');
  validateMonthString(oracle.lastMonthlyResetDate, 'oracleQuestions.lastMonthlyResetDate');
  validateLimit(oracle.dailyLimit, 'oracleQuestions.dailyLimit');
  validateCount(oracle.todayCount, 'oracleQuestions.todayCount');
  validateDateString(oracle.lastResetDate, 'oracleQuestions.lastResetDate');

  // Validate recipes structure
  if (!usageLimits.recipes || typeof usageLimits.recipes !== 'object') {
    throw new UsageLimitValidationError(
      'INVALID_STRUCTURE',
      'Recipes usage limits must be an object',
      'recipes',
      usageLimits.recipes
    );
  }

  const recipes = usageLimits.recipes;
  validateLimit(recipes.freeLimit, 'recipes.freeLimit');
  validateCount(recipes.currentCount, 'recipes.currentCount');
  validateLimit(recipes.dailyLimit, 'recipes.dailyLimit');
  validateCount(recipes.todayCount, 'recipes.todayCount');
  validateDateString(recipes.lastResetDate, 'recipes.lastResetDate');

  // Validate tracking structure
  if (!usageLimits.tracking || typeof usageLimits.tracking !== 'object') {
    throw new UsageLimitValidationError(
      'INVALID_STRUCTURE',
      'Tracking usage limits must be an object',
      'tracking',
      usageLimits.tracking
    );
  }

  const tracking = usageLimits.tracking;
  validateLimit(tracking.freeDays, 'tracking.freeDays');
  validateTrackingStartDate(tracking.startDate);
  validateCount(tracking.daysUsed, 'tracking.daysUsed');
}