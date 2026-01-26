/**
 * Simulates database failures for integration testing
 */
export class DatabaseSimulator {
  private shouldFail = false
  private failureCount = 0

  /**
   * Make next N database calls fail
   */
  simulateFailure(count: number): void {
    this.shouldFail = true
    this.failureCount = count
  }

  /**
   * Restore normal database behavior
   */
  restore(): void {
    this.shouldFail = false
    this.failureCount = 0
  }

  /**
   * Check if should fail this call
   */
  shouldFailThisCall(): boolean {
    if (!this.shouldFail || this.failureCount <= 0) {
      return false
    }
    this.failureCount--
    return true
  }
}
