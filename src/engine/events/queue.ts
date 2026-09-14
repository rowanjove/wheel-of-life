export class EventQueue {
  private queue: string[] = []

  constructor(initialItems: string[] = []) {
    this.queue = [...initialItems]
  }

  public push(eventId: string): void {
    this.queue.push(eventId)
  }

  public pop(): string | undefined {
    return this.queue.shift()
  }

  public peek(): string | undefined {
    return this.queue[0]
  }

  public isEmpty(): boolean {
    return this.queue.length === 0
  }

  public size(): number {
    return this.queue.length
  }

  public items(): string[] {
    return [...this.queue]
  }

  public clear(): void {
    this.queue = []
  }
}
