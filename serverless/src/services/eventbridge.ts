import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { config as appConfig } from '../utils/constants';

const ebClient = new EventBridgeClient({});

/**
 * Publishes an event to the configured EventBridge event bus.
 *
 * @param detailType - The detail-type field for the event (e.g. 'user.login', 'mail.send')
 * @param detail - The event payload object (will be JSON-stringified)
 * @param source - The source of the event (defaults to 'mail-service')
 */
export async function publishEvent(
  detailType: string,
  detail: Record<string, any>,
  source: string = 'mail-service',
): Promise<void> {
  await ebClient.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: source,
          DetailType: detailType,
          Detail: JSON.stringify(detail),
          EventBusName: appConfig.EVENT_BUS_NAME,
        },
      ],
    }),
  );
}
