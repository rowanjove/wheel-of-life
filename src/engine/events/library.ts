import type { EventDefinition } from './schema'

export class EventLibrary {
  private events: Map<string, EventDefinition> = new Map()

  constructor(initialEvents: EventDefinition[] = []) {
    for (const ev of initialEvents) {
      this.addEvent(ev)
    }
  }

  public addEvent(event: EventDefinition): void {
    this.events.set(event.id, event)
  }

  public getEvent(id: string): EventDefinition | undefined {
    return this.events.get(id)
  }

  public hasEvent(id: string): boolean {
    return this.events.has(id)
  }

  public getAllEvents(): EventDefinition[] {
    return Array.from(this.events.values())
  }

  public getEventsByCategory(category: string): EventDefinition[] {
    return this.getAllEvents().filter((e) => e.category === category)
  }

  public size(): number {
    return this.events.size
  }
}
