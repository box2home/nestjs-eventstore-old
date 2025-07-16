import { DynamicModule } from '@nestjs/common';
import { ConnectionSettings, TcpEndPoint } from 'node-eventstore-client';
export interface EventStoreModuleOptions {
    connectionSettings: ConnectionSettings;
    endpoint: TcpEndPoint;
}
export interface EventStoreModuleAsyncOptions {
    useFactory: (...args: any[]) => Promise<any> | any;
    inject?: any[];
}
export declare class EventStoreModule {
    static forRoot(settings: ConnectionSettings, endpoint: TcpEndPoint): DynamicModule;
    static forRootAsync(options: EventStoreModuleAsyncOptions): DynamicModule;
}
