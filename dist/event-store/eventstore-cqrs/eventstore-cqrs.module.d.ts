import { EventBus, CommandBus, QueryBus } from '@nestjs/cqrs';
import { DynamicModule } from '@nestjs/common';
import { EventStoreBusConfig } from './event-bus.provider';
import { ExplorerService } from '@nestjs/cqrs/dist/services/explorer.service';
import { EventStoreModuleAsyncOptions } from '../event-store.module';
export declare class EventStoreCqrsModule {
    private readonly explorerService;
    private readonly eventsBus;
    private readonly commandsBus;
    private readonly queryBus;
    constructor(explorerService: ExplorerService, eventsBus: EventBus, commandsBus: CommandBus, queryBus: QueryBus);
    onModuleInit(): void;
    static forRootAsync(options: EventStoreModuleAsyncOptions, eventStoreBusConfig: EventStoreBusConfig): DynamicModule;
}
