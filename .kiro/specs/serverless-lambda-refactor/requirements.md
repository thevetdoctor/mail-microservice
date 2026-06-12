# Requirements Document

## Introduction

This document defines the requirements for refactoring the existing NestJS mail microservice into an AWS serverless architecture. The refactor replaces NestJS HTTP endpoints with AWS Lambda functions behind API Gateway, replaces PostgreSQL/Sequelize with DynamoDB for persistence, replaces Kafka with Amazon EventBridge (or SNS/SQS) for event-driven processing, and retains Web Push notification functionality using the existing `web-push` library. The goal is to reduce infrastructure management overhead, improve scalability, and lower costs for the mail microservice.

## Glossary

- **Lambda_Function**: An AWS Lambda function that executes business logic in response to API Gateway requests or event triggers
- **API_Gateway**: AWS API Gateway that exposes HTTP endpoints and routes requests to Lambda functions
- **DynamoDB**: AWS DynamoDB NoSQL database used for persisting subscriptions, mail configurations, and event logs
- **EventBridge**: AWS EventBridge (or SNS/SQS) used as the event bus replacing Kafka for asynchronous event processing
- **Subscribe_Lambda**: The Lambda function handling push notification subscription registration
- **Feedback_Lambda**: The Lambda function handling user feedback submission
- **Mail_Send_Lambda**: The Lambda function handling external mail send requests (JWT-protected)
- **Event_Processor_Lambda**: The Lambda function consuming events from EventBridge and triggering email delivery
- **Notification_Service**: The module responsible for Web Push notification broadcasting using the web-push library
- **Mail_Service**: The module responsible for SMTP email delivery via Nodemailer with per-user encrypted configurations
- **Subscription_Table**: DynamoDB table storing push notification subscription records
- **MailConfig_Table**: DynamoDB table storing per-user encrypted SMTP configurations
- **Error_Tracker**: The component that tracks login error rates within a time window and triggers admin alerts

## Requirements

### Requirement 1: Push Notification Subscription via Lambda

**User Story:** As a client application, I want to register push notification subscriptions through a serverless endpoint, so that users can receive Web Push notifications without maintaining a persistent server.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/notification/subscribe` path, THE API_Gateway SHALL route the request to the Subscribe_Lambda
2. WHEN a valid subscription payload containing endpoint, keys, and deviceId is received, THE Subscribe_Lambda SHALL store the subscription in the Subscription_Table
3. WHEN a subscription with the same endpoint already exists in the Subscription_Table, THE Subscribe_Lambda SHALL return a 200 status with a message indicating the subscription exists
4. WHEN a new subscription is successfully stored, THE Subscribe_Lambda SHALL return a 201 status with a success message
5. IF the subscription payload is missing required fields (endpoint or keys), THEN THE Subscribe_Lambda SHALL return a 400 status with a descriptive error message

### Requirement 2: Feedback Submission via Lambda

**User Story:** As a user, I want to submit feedback through a serverless endpoint, so that my feedback is processed without relying on a long-running server.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/feedback` path, THE API_Gateway SHALL route the request to the Feedback_Lambda
2. WHEN a valid feedback payload containing name, email, and message is received, THE Feedback_Lambda SHALL publish a feedback event to EventBridge
3. WHEN the feedback event is successfully published, THE Feedback_Lambda SHALL return a 201 status with a confirmation message
4. IF the feedback payload is missing required fields (name, email, or message), THEN THE Feedback_Lambda SHALL return a 400 status with a descriptive error message
5. IF the email field contains an invalid email format, THEN THE Feedback_Lambda SHALL return a 400 status with a validation error message

### Requirement 3: External Mail Send via Lambda (JWT-Protected)

**User Story:** As an authenticated API consumer, I want to send emails through a serverless endpoint protected by JWT authentication, so that only authorized users can trigger email delivery.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/mail/send` path, THE API_Gateway SHALL validate the JWT token before routing to the Mail_Send_Lambda
2. IF the JWT token is missing or invalid, THEN THE API_Gateway SHALL return a 401 status without invoking the Mail_Send_Lambda
3. WHEN a valid mail send request with fields (from, to, message or template) is received, THE Mail_Send_Lambda SHALL publish a mail-send event to EventBridge containing the payload, caller identity, client IP, and device info
4. WHEN the mail-send event is successfully published, THE Mail_Send_Lambda SHALL return a 201 status with a confirmation message
5. IF the event publishing fails, THEN THE Mail_Send_Lambda SHALL publish a mail-send-error event to EventBridge and return a 400 status with the error message

### Requirement 4: Event-Driven Email Processing via Lambda

**User Story:** As the system, I want a Lambda function that processes email events from EventBridge, so that emails are sent asynchronously without blocking API responses.

#### Acceptance Criteria

1. WHEN an event with type user-login, user-signup, feedback, or mail-send is received from EventBridge, THE Event_Processor_Lambda SHALL retrieve the SMTP configuration for the sender from the MailConfig_Table
2. WHEN the SMTP configuration is retrieved, THE Event_Processor_Lambda SHALL decrypt the stored SMTP password using the encryption key
3. WHEN a valid transporter is created, THE Event_Processor_Lambda SHALL send the email using Nodemailer with the appropriate template for the event type
4. WHEN an email is successfully sent, THE Event_Processor_Lambda SHALL publish a mail-sent confirmation event to EventBridge
5. IF the SMTP configuration is not found for the sender, THEN THE Event_Processor_Lambda SHALL log the error and skip email delivery for that event
6. IF email delivery fails, THEN THE Event_Processor_Lambda SHALL log the failure details including event type, recipient, and error message

### Requirement 5: Login Error Rate Tracking and Admin Alerts

**User Story:** As an administrator, I want the system to track login error rates and alert me when error frequency exceeds a threshold, so that I can respond to potential security incidents.

#### Acceptance Criteria

1. WHEN a user-login-error event is received from EventBridge, THE Event_Processor_Lambda SHALL increment the error count within the configured time window
2. WHILE the error count within the time window is below the maximum threshold, THE Event_Processor_Lambda SHALL log the error without sending an alert
3. WHEN the error count within the time window reaches or exceeds the maximum threshold, THE Event_Processor_Lambda SHALL send an alert email to the configured admin email address
4. WHEN an admin alert is sent, THE Error_Tracker SHALL reset the error count and timestamps to zero
5. THE Error_Tracker SHALL store error timestamps in DynamoDB to maintain state across Lambda invocations

### Requirement 6: DynamoDB Data Storage for Subscriptions

**User Story:** As the system, I want push notification subscriptions stored in DynamoDB, so that subscription data persists reliably without managing a PostgreSQL database.

#### Acceptance Criteria

1. THE Subscription_Table SHALL store each subscription with fields: id (partition key), endpoint, keys, deviceId, userAgent, createdAt, and updatedAt
2. WHEN a subscription is queried by endpoint, THE Subscription_Table SHALL support efficient lookup using a Global Secondary Index on the endpoint field
3. WHEN a subscription endpoint expires (push delivery returns 410 status), THE Notification_Service SHALL delete the subscription from the Subscription_Table
4. THE Subscription_Table SHALL use a UUID as the partition key for each subscription record

### Requirement 7: DynamoDB Data Storage for Mail Configurations

**User Story:** As the system, I want per-user SMTP configurations stored in DynamoDB, so that each user's mail settings persist without a relational database.

#### Acceptance Criteria

1. THE MailConfig_Table SHALL store each configuration with fields: id (partition key), email (unique), smtpHost, smtpPort, smtpUser, smtpPass (encrypted), createdAt, and updatedAt
2. WHEN a mail configuration is queried by email, THE MailConfig_Table SHALL support efficient lookup using a Global Secondary Index on the email field
3. THE Mail_Service SHALL encrypt SMTP passwords before storing them in the MailConfig_Table using the configured encryption key
4. THE Mail_Service SHALL decrypt SMTP passwords retrieved from the MailConfig_Table before creating SMTP transporters

### Requirement 8: Web Push Notification Broadcasting

**User Story:** As the system, I want to broadcast Web Push notifications to all active subscribers, so that users receive real-time notifications through their browsers.

#### Acceptance Criteria

1. WHEN a push notification broadcast is triggered, THE Notification_Service SHALL retrieve all active subscriptions from the Subscription_Table
2. THE Notification_Service SHALL send a Web Push notification to each active subscription using the web-push library with configured VAPID keys
3. WHEN a push notification delivery returns a 410 (Gone) status, THE Notification_Service SHALL remove the expired subscription from the Subscription_Table
4. WHEN push notification broadcasting completes, THE Notification_Service SHALL return the count of successful deliveries

### Requirement 9: Infrastructure as Code Deployment

**User Story:** As a developer, I want the serverless infrastructure defined as code, so that deployments are repeatable, version-controlled, and automated.

#### Acceptance Criteria

1. THE deployment configuration SHALL define all Lambda functions, API Gateway routes, DynamoDB tables, EventBridge rules, and IAM roles using a serverless framework (AWS SAM or Serverless Framework)
2. THE deployment configuration SHALL define environment variables for SMTP credentials, VAPID keys, encryption keys, admin email, error thresholds, and JWT secret
3. WHEN deployed, THE API_Gateway SHALL expose three HTTP POST endpoints: `/notification/subscribe`, `/feedback`, and `/mail/send`
4. THE deployment configuration SHALL configure the JWT authorizer on the `/mail/send` and `/feedback` endpoints
5. THE deployment configuration SHALL configure EventBridge rules to route events to the Event_Processor_Lambda based on event type

### Requirement 10: Structured Logging

**User Story:** As a developer, I want structured logging in all Lambda functions, so that I can monitor and debug the system using CloudWatch.

#### Acceptance Criteria

1. THE Lambda_Function SHALL log each incoming request with a correlation ID, timestamp, and request metadata
2. WHEN an email is sent successfully, THE Event_Processor_Lambda SHALL log the event type, recipient, and timestamp
3. WHEN an error occurs in any Lambda function, THE Lambda_Function SHALL log the error with full context including correlation ID, input payload summary, and stack trace
4. THE Lambda_Function SHALL use structured JSON format for all log entries to enable CloudWatch Insights queries
