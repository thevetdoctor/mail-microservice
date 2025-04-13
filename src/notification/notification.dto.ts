import { ApiProperty } from '@nestjs/swagger';

class PushMessage {
  @ApiProperty({ example: 'New Notification' })
  title: string;

  @ApiProperty({ example: 'You have an update!' })
  message: string;

  @ApiProperty({ example: 'https://www.google.com' })
  redirectUrl: string;
}

export class SamplePushDTO {
  @ApiProperty({ type: PushMessage })
  message: PushMessage;
}

class SubscriptionKeys {
  @ApiProperty({
    example:
      'BHinDvknQfzC3eCwSoo9oRI4CzcF3gmO0fwFbQHbRqtBhf4bl8eIt7jCn0GnOpTYiyOIPPha_-AQhpBe2OHCLXc',
  })
  p256dh: string;

  @ApiProperty({ example: 'Q7_0p3UDNDmDwHlP_EhHlA' })
  auth: string;
}

class SampleSubscription {
  @ApiProperty({
    example:
      'https://fcm.googleapis.com/fcm/send/e2b6DUIAwbQ:APA91bEg1vcN2Nivs1M3FkKkwhk4oagzr622MedO_HHZ05Oyyo9qwvajl9aYiHJoJhW8PxOQ3zfUrRzLuUK-BwHQ08-2JeslFVMFeV7lxazhEt6LeSQeFK6hYw5n4mA5IUigxOLpb-Cf',
  })
  endpoint: string;

  @ApiProperty()
  expirationTime: any;

  @ApiProperty({ type: SubscriptionKeys })
  keys: SubscriptionKeys;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  userAgent: string;

  @ApiProperty({ example: 'aff2d669-583c-4320-821d-9666affb579a' })
  deviceId: string;
}

export class SampleSubscriptionDTO {
  @ApiProperty({ type: SampleSubscription })
  subscription: SampleSubscription;

  @ApiProperty()
  userAgent: string;
}