import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { config as appConfig } from '../utils/constants';
import {
  Subscription,
  SubscriptionItem,
  MailConfig,
  MailConfigItem,
  LoginErrorItem,
} from '../types/models';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export class DynamoDBService {
  private client: DynamoDBDocumentClient;

  constructor(client?: DynamoDBDocumentClient) {
    this.client = client ?? docClient;
  }

  /**
   * Retrieve a subscription by its push endpoint URL using the endpoint-index GSI.
   */
  async getSubscriptionByEndpoint(endpoint: string): Promise<Subscription | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: appConfig.SUBSCRIPTIONS_TABLE,
        IndexName: 'endpoint-index',
        KeyConditionExpression: 'endpoint = :endpoint',
        ExpressionAttributeValues: { ':endpoint': endpoint },
        Limit: 1,
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return result.Items[0] as Subscription;
  }

  /**
   * Create a new push subscription in the Subscriptions table.
   */
  async createSubscription(subscription: SubscriptionItem): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: appConfig.SUBSCRIPTIONS_TABLE,
        Item: subscription,
      }),
    );
  }

  /**
   * Delete a subscription by its partition key (id).
   */
  async deleteSubscription(id: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: appConfig.SUBSCRIPTIONS_TABLE,
        Key: { id },
      }),
    );
  }

  /**
   * Retrieve all subscriptions from the Subscriptions table.
   */
  async getAllSubscriptions(): Promise<Subscription[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: appConfig.SUBSCRIPTIONS_TABLE,
      }),
    );

    return (result.Items ?? []) as Subscription[];
  }

  /**
   * Retrieve a mail configuration by email using the email-index GSI.
   */
  async getMailConfigByEmail(email: string): Promise<MailConfig | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: appConfig.MAIL_CONFIGS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
        Limit: 1,
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return result.Items[0] as MailConfig;
  }

  /**
   * Create a new mail configuration in the MailConfigs table.
   */
  async createMailConfig(mailConfig: MailConfigItem): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: appConfig.MAIL_CONFIGS_TABLE,
        Item: mailConfig,
      }),
    );
  }

  /**
   * Retrieve login errors with timestamp >= windowStart using a ScanCommand with FilterExpression.
   */
  async getLoginErrors(windowStart: number): Promise<LoginErrorItem[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: appConfig.LOGIN_ERRORS_TABLE,
        FilterExpression: '#ts >= :windowStart',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
        ExpressionAttributeValues: { ':windowStart': windowStart },
      }),
    );

    return (result.Items ?? []) as LoginErrorItem[];
  }

  /**
   * Store a login error record in the LoginErrors table.
   */
  async putLoginError(error: LoginErrorItem): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: appConfig.LOGIN_ERRORS_TABLE,
        Item: error,
      }),
    );
  }

  /**
   * Clear all login error records by scanning and batch-deleting them.
   */
  async clearLoginErrors(): Promise<void> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: appConfig.LOGIN_ERRORS_TABLE,
        ProjectionExpression: 'id, #ts',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
      }),
    );

    const items = result.Items ?? [];
    if (items.length === 0) {
      return;
    }

    // BatchWriteCommand supports up to 25 items per batch
    const batches: Record<string, any>[][] = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    for (const batch of batches) {
      await this.client.send(
        new BatchWriteCommand({
          RequestItems: {
            [appConfig.LOGIN_ERRORS_TABLE]: batch.map((item) => ({
              DeleteRequest: {
                Key: { id: item.id, timestamp: item.timestamp },
              },
            })),
          },
        }),
      );
    }
  }
}

/** Singleton instance for use across Lambda handlers */
export const dynamoDBService = new DynamoDBService();
