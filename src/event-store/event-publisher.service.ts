import {
    createEventData,
    EventData,
} from 'node-eventstore-client';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { EventStore } from './event-store.class'; // ✅ on injecte cette classe

@Injectable()
export class EventPublisherService {
    private readonly configuredStreams = new Set<string>();
    private readonly logger = new Logger(EventPublisherService.name);

    constructor(private readonly eventStore: EventStore) {} // ✅ injection ici

    async publishWithMaxAge(event: any, streamName: string, maxAgeSeconds = 60) {
        const payload: EventData = createEventData(
            uuid(),
            event.constructor.name,
            true,
            Buffer.from(JSON.stringify(event)),
        );

        const conn = this.eventStore.getConnection(); // ✅ utiliser getConnection()

        await conn.appendToStream(streamName, -1, [payload]);

        if (!this.configuredStreams.has(streamName)) {
            const metadata = Buffer.from(JSON.stringify({ $maxAge: maxAgeSeconds }), 'utf8');
            await conn.setStreamMetadataRaw(streamName, -1, metadata);
            this.configuredStreams.add(streamName);
            this.logger.log(`Configured stream ${streamName} with $maxAge = ${maxAgeSeconds}`);
        }
    }
}
