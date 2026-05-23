export enum EventType {
  UserCreated = 'user.created',
  UserUpdated = 'user.updated',
  RewardPointsAwarded = 'reward.points.awarded',
  RewardPointsRedeemed = 'reward.points.redeemed',
  WalletCredited = 'wallet.credited',
  WalletDebited = 'wallet.debited',
  RedemptionRequested = 'redemption.requested',
  RedemptionCompleted = 'redemption.completed',
  RedemptionFailed = 'redemption.failed',
}

export interface DomainEvent {
  id: string;
  eventType: EventType;
  aggregateId: string;
  aggregateType: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

export interface MessagePublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

export interface MessageConsumer {
  subscribe(eventType: EventType, handler: (event: DomainEvent) => Promise<void>): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface MessageBroker {
  getPublisher(): MessagePublisher;
  getConsumer(): MessageConsumer;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
