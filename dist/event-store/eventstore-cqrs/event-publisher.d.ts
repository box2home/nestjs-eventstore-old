import { AggregateRoot } from '@nestjs/cqrs';
import { EventBusProvider } from './event-bus.provider';
import { IAggregateEvent } from '../shared/aggregate-event.interface';
export interface Constructor<T> {
    new (...args: any[]): T;
}
export declare class EventPublisher {
    private readonly eventBus;
    constructor(eventBus: EventBusProvider);
    mergeClassContext<T extends Constructor<AggregateRoot<IAggregateEvent>>>(metatype: T): T;
    mergeObjectContext<T extends AggregateRoot<IAggregateEvent>>(object: T): T;
}
