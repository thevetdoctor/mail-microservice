# Implementation Plan: Serverless Lambda Refactor

## Overview

This plan converts the existing NestJS mail microservice into an AWS serverless architecture using the Serverless Framework, TypeScript Lambda handlers, DynamoDB for persistence, and EventBridge for async event processing. Tasks are ordered so each step builds on the previous, ending with integration wiring and tests.

## Tasks

- [x] 1. Set up project scaffolding and configuration
  - [x] 1.1 Create serverless project directory structure and package.json
    - Create `serverless/` directory at project root
    - Create `serverless/package.json` with dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-eventbridge`, `web-push`, `nodemailer`, `crypto-js`, `uuid`
    - Add devDependencies: `serverless`, `serverless-esbuild`, `serverless-offline`, `typescript`, `jest`, `ts-jest`, `@types/jest`, `fast-check`, `@types/node`, `@types/nodemailer`, `@types/web-push`, `@types/crypto-js`, `@types/uuid`
    - Add scripts: `test`, `test:integration`, `deploy`, `offline`
    - _Requirements: 9.1_

  - [x] 1.2 Create TypeScript configuration (tsconfig.json)
    - Create `serverless/tsconfig.json` with target ES2020, module commonjs, strict mode enabled
    - Configure paths for `src/` directory, outDir to `dist/`
    - Include `src/**/*.ts` and `tests/**/*.ts`
    - _Requirements: 9.1_

  - [x] 1.3 Create type definition files
    - Create `serverless/src/types/models.ts` with interfaces: `Subscription`, `SubscriptionItem`, `MailConfig`, `MailConfigItem`, `LoginErrorItem`
    - Create `serverless/src/types/events.ts` with interfaces: `MailEventDetail`, event type union type
    - Create `serverless/src/types/api.ts` with interfaces: `SubscribeRequest`, `FeedbackRequest`, `MailSendRequest`, `ApiResponse`, `ErrorResponse`
    - _Requirements: 1.2, 2.2, 3.3, 4.1, 6.1, 7.1_

- [x] 2. Implement shared utilities
  - [x] 2.1 Implement structured JSON logger
    - Create `serverless/src/utils/logger.ts`
    - Implement `Logger` class with methods: `info`, `warn`, `error`
    - Each log entry MUST output valid JSON with fields: `correlationId`, `timestamp`, `level`, `message`
    - Error entries MUST additionally include `stackTrace` and `inputSummary` fields
    - Generate correlation IDs using UUID v4
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 2.2 Implement constants and environment variable configuration
    - Create `serverless/src/utils/constants.ts`
    - Export typed config object reading from `process.env`: `SUBSCRIPTIONS_TABLE`, `MAIL_CONFIGS_TABLE`, `LOGIN_ERRORS_TABLE`, `EVENT_BUS_NAME`, `ENCRYPTION_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `ADMIN_EMAIL`, `MAX_ERRORS`, `ERROR_WINDOW_MS`, `JWT_SECRET`
    - _Requirements: 9.2_

  - [x] 2.3 Implement encryption module (CryptoJS AES)
    - Create `serverless/src/utils/encryption.ts`
    - Implement `encrypt(data: string, key: string): string` using CryptoJS AES
    - Implement `decrypt(ciphertext: string, key: string): string` using CryptoJS AES
    - _Requirements: 4.2, 7.3, 7.4_

  - [x] 2.4 Implement input validation utilities
    - Create `serverless/src/utils/validation.ts`
    - Implement `checkForRequiredFields(payload: Record<string, any>, requiredFields: string[]): { valid: boolean; missing: string[] }`
    - Implement `validateEmail(email: string): boolean` using regex pattern for `user@domain.tld`
    - _Requirements: 1.5, 2.4, 2.5, 3.3_

  - [x] 2.5 Implement email HTML templates
    - Create `serverless/src/utils/templates.ts`
    - Implement `mailTemplates` map from event type to `{ subject: string; html: (payload) => string }`
    - Support templates for event types: `user.login`, `user.signup`, `submit.feedback`, `mail.send`
    - _Requirements: 4.3_

  - [x] 2.6 Implement identity utility for client IP and device parsing
    - Create `serverless/src/utils/identity.ts`
    - Implement `extractClientIp(event: APIGatewayProxyEventV2): string` from request context or headers
    - Implement `extractDeviceInfo(event: APIGatewayProxyEventV2): string` from User-Agent header
    - _Requirements: 3.3_

- [x] 3. Checkpoint - Verify scaffolding and utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement DynamoDB service layer
  - [x] 4.1 Implement DynamoDB client singleton and service class
    - Create `serverless/src/services/dynamodb.ts`
    - Initialize `DynamoDBDocumentClient` singleton using AWS SDK v3
    - Implement `getSubscriptionByEndpoint(endpoint: string): Promise<Subscription | null>` using QueryCommand on GSI
    - Implement `createSubscription(subscription: SubscriptionItem): Promise<void>` using PutCommand
    - Implement `deleteSubscription(id: string): Promise<void>` using DeleteCommand
    - Implement `getAllSubscriptions(): Promise<Subscription[]>` using ScanCommand
    - Implement `getMailConfigByEmail(email: string): Promise<MailConfig | null>` using QueryCommand on GSI
    - Implement `createMailConfig(config: MailConfigItem): Promise<void>` using PutCommand
    - Implement `getLoginErrors(windowStart: number): Promise<LoginErrorItem[]>` using QueryCommand
    - Implement `putLoginError(error: LoginErrorItem): Promise<void>` using PutCommand
    - Implement `clearLoginErrors(): Promise<void>` using BatchWriteCommand
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 5.5_

- [x] 5. Implement EventBridge service layer
  - [x] 5.1 Implement EventBridge publish helper
    - Create `serverless/src/services/eventbridge.ts`
    - Initialize `EventBridgeClient` singleton using AWS SDK v3
    - Implement `publishEvent(detailType: string, detail: Record<string, any>, source?: string): Promise<void>` using PutEventsCommand
    - Use `EVENT_BUS_NAME` from constants for the event bus
    - Default source to `mail-service`
    - _Requirements: 2.2, 3.3, 4.4, 9.5_

- [x] 6. Implement Lambda handlers
  - [x] 6.1 Implement Subscribe Lambda handler
    - Create `serverless/src/handlers/subscribe.ts`
    - Parse request body, validate required fields (endpoint, keys) using validation utility
    - Check for existing subscription by endpoint using DynamoDB service
    - If exists: return 200 with "subscription already exists" message
    - If new: generate UUID, store subscription with createdAt/updatedAt timestamps, return 201
    - Wrap in try/catch with structured error logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 Implement Feedback Lambda handler
    - Create `serverless/src/handlers/feedback.ts`
    - Parse request body, validate required fields (name, email, message)
    - Validate email format using `validateEmail`
    - Publish `submit.feedback` event to EventBridge with feedback payload and correlation ID
    - Return 201 on success, 400 on validation error
    - Wrap in try/catch with structured error logging
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.3 Implement Mail Send Lambda handler
    - Create `serverless/src/handlers/mailSend.ts`
    - Parse request body, validate required fields (from, to, and either message or template)
    - Extract caller identity from JWT claims in request context
    - Extract client IP and device info using identity utility
    - Publish `mail.send` event to EventBridge with payload, caller identity, client IP, and device info
    - On publish failure: attempt to publish `mail-send-error` event, return 400
    - Return 201 on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.4 Implement Event Processor Lambda handler
    - Create `serverless/src/handlers/eventProcessor.ts`
    - Parse EventBridge event detail, extract event type and payload
    - Route by event type: `user.login`, `user.signup`, `submit.feedback`, `mail.send`, `user.login.error`
    - For email events: retrieve SMTP config by sender email, decrypt password, create Nodemailer transporter, send email using appropriate template
    - For `user.login.error`: delegate to error tracker service
    - On successful send: publish `mail.sent` confirmation event
    - Handle missing SMTP config: log warning, skip delivery
    - Handle SMTP delivery failure: log error with full context
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 6.5 Implement Error Tracker service
    - Create `serverless/src/services/errorTracker.ts`
    - Implement `trackLoginError(errorEvent: LoginErrorEvent): Promise<{ alertTriggered: boolean }>`
    - Store error timestamp in LoginErrors DynamoDB table
    - Query errors within configured time window
    - If count >= MAX_ERRORS: send alert email to admin, reset error records, return `{ alertTriggered: true }`
    - If count < MAX_ERRORS: log error, return `{ alertTriggered: false }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.6 Implement Notify All Lambda handler (push notification broadcast)
    - Create `serverless/src/handlers/notifyAll.ts`
    - Create `serverless/src/services/notification.service.ts`
    - Retrieve all active subscriptions from DynamoDB
    - Configure web-push with VAPID keys from constants
    - Send push notification to each subscription
    - On 410 response: delete expired subscription from DynamoDB
    - Return count of successful deliveries
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Checkpoint - Verify handlers compile and pass basic tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement infrastructure configuration
  - [x] 8.1 Create serverless.yml with Lambda functions and API Gateway
    - Create `serverless/serverless.yml`
    - Configure service name, provider (aws, nodejs18.x, region)
    - Configure serverless-esbuild plugin for TypeScript bundling
    - Define functions: `subscribe`, `feedback`, `mailSend`, `eventProcessor`, `notifyAll`
    - Configure HTTP API (v2) events for subscribe (POST /notification/subscribe), feedback (POST /feedback), mailSend (POST /mail/send)
    - Configure JWT authorizer on `/feedback` and `/mail/send` endpoints using `JWT_SECRET`
    - Configure EventBridge rules to trigger `eventProcessor` on events from `mail-service-bus`
    - Define environment variables for all Lambda functions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 8.2 Define DynamoDB tables in serverless.yml resources
    - Add CloudFormation resources for Subscriptions table with UUID partition key and endpoint-index GSI
    - Add CloudFormation resources for MailConfigs table with UUID partition key and email-index GSI
    - Add CloudFormation resources for LoginErrors table with UUID partition key, timestamp sort key, and TTL on `ttl` attribute
    - Configure IAM role statements for Lambda to access DynamoDB tables and EventBridge
    - _Requirements: 6.1, 6.2, 6.4, 7.1, 7.2, 5.5, 9.1_

  - [x] 8.3 Configure EventBridge rules and Dead Letter Queue
    - Define EventBridge event bus `mail-service-bus` as CloudFormation resource
    - Define EventBridge rules for routing events by detail-type to `eventProcessor`
    - Configure SQS Dead Letter Queue for failed event processing
    - _Requirements: 9.5, 4.1_

- [x] 9. Implement property-based tests
  - [x] 9.1 Write property test for required field validation (Property 1)
    - **Property 1: Required field validation rejects incomplete payloads**
    - **Validates: Requirements 1.5, 2.4**
    - Create `serverless/tests/unit/validation.test.ts`
    - Use fast-check to generate arbitrary objects with random subsets of required fields removed
    - Assert that `checkForRequiredFields` returns error listing missing fields for any incomplete payload
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x] 9.2 Write property test for encryption round-trip (Property 2)
    - **Property 2: Encryption round-trip preserves password**
    - **Validates: Requirements 4.2, 7.3, 7.4**
    - Create `serverless/tests/unit/encryption.test.ts`
    - Use fast-check to generate arbitrary non-empty strings as passwords and keys
    - Assert that `decrypt(encrypt(password, key), key) === password` for all generated inputs
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x] 9.3 Write property test for error rate threshold (Property 3)
    - **Property 3: Error rate threshold triggers alert exactly at boundary**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Create `serverless/tests/unit/errorTracker.test.ts`
    - Use fast-check to generate sequences of error timestamps within and outside the time window
    - Assert: count >= MAX_ERRORS within window → alert triggered; count < MAX_ERRORS → no alert
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x] 9.4 Write property test for expired subscription cleanup (Property 4)
    - **Property 4: Expired subscription cleanup on 410**
    - **Validates: Requirements 6.3, 8.3**
    - Create `serverless/tests/unit/notification.test.ts`
    - Use fast-check to generate lists of subscriptions with random 410/success status assignments
    - Assert: all 410-status subscriptions are deleted, no non-410 subscriptions are deleted
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x] 9.5 Write property test for broadcast delivery count (Property 5)
    - **Property 5: Broadcast delivery count invariant**
    - **Validates: Requirements 8.2, 8.4**
    - Add to `serverless/tests/unit/notification.test.ts`
    - Use fast-check to generate subscription lists with random delivery success/failure outcomes
    - Assert: returned count = total subscriptions - failed deliveries
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x] 9.6 Write property test for structured JSON logging (Property 6)
    - **Property 6: Structured JSON logging completeness**
    - **Validates: Requirements 10.1, 10.3, 10.4**
    - Create `serverless/tests/unit/logger.test.ts`
    - Use fast-check to generate arbitrary message strings and metadata objects
    - Assert: all log output is valid JSON with `correlationId`, `timestamp`, `level`
    - Assert: error logs additionally contain `stackTrace` and `inputSummary`
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

  - [x] 9.7 Write property test for email format validation (Property 7)
    - **Property 7: Email format validation**
    - **Validates: Requirements 2.5**
    - Add to `serverless/tests/unit/validation.test.ts`
    - Use fast-check to generate strings that match/don't match email format
    - Assert: `validateEmail` accepts valid emails and rejects invalid ones
    - Use `fc.assert(fc.property(...), { numRuns: 100 })`

- [x] 10. Implement unit tests
  - [x] 10.1 Write unit tests for Lambda handlers
    - Create `serverless/tests/unit/subscribe.test.ts` — test 200/201/400 responses with mocked DynamoDB
    - Create `serverless/tests/unit/feedback.test.ts` — test 201/400 responses with mocked EventBridge
    - Create `serverless/tests/unit/mailSend.test.ts` — test 201/400 responses with mocked EventBridge
    - Create `serverless/tests/unit/eventProcessor.test.ts` — test email routing, missing config handling, delivery failure logging
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 4.1, 4.3, 4.5, 4.6_

  - [x] 10.2 Write unit tests for templates module
    - Create `serverless/tests/unit/templates.test.ts`
    - Test each event type maps to correct subject and html output
    - _Requirements: 4.3_

- [x] 11. Implement integration tests
  - [x] 11.1 Write integration tests for API endpoints
    - Create `serverless/tests/integration/subscribe.test.ts` — POST /notification/subscribe end-to-end with serverless-offline
    - Create `serverless/tests/integration/feedback.test.ts` — POST /feedback with valid/invalid JWT
    - Create `serverless/tests/integration/mailSend.test.ts` — POST /mail/send with valid/invalid JWT, verify EventBridge event published
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 9.3, 9.4_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design using fast-check
- Unit tests validate specific examples and edge cases using Jest with mocked AWS services
- Integration tests require serverless-offline or a deployed stack
- The `serverless/` directory coexists with the existing NestJS project to enable incremental migration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["4.1", "5.1"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.5"] },
    { "id": 5, "tasks": ["6.4", "6.6"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3", "9.6", "9.7"] },
    { "id": 9, "tasks": ["9.4", "9.5", "10.1", "10.2"] },
    { "id": 10, "tasks": ["11.1"] }
  ]
}
```
