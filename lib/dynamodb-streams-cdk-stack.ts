import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Trigger } from "aws-cdk-lib/triggers";
import { Construct } from "constructs";

import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";

export class DynamodbStreamsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dbTable = new Table(this, "streams-demo", {
      partitionKey: { type: AttributeType.STRING, name: "PK" },
      sortKey: { type: AttributeType.STRING, name: "SK" },
      billingMode: BillingMode.PAY_PER_REQUEST,
      // pick what data you want in your stream
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const lambdaStreamEvent = new DynamoEventSource(dbTable, {
      // change the postion to TRIM_HORIZON to get updates on previous events
      startingPosition: StartingPosition.LATEST,
    });

    const streamHandlerFn = new NodejsFunction(this, "stream-handler-fn", {
      entry: "lambdas/stream-handler-fn.ts",
    });

    streamHandlerFn.addEventSource(lambdaStreamEvent);

    new CfnOutput(this, "lambda-arn", {
      value: streamHandlerFn.functionArn,
    });

    const insertRecordInDbFn = new NodejsFunction(
      this,
      "insert-db-records-fn",
      {
        entry: "lambdas/insert-records-in-ddb.ts",
        // events: [Trigger],
        environment: {
          TABLE_NAME: dbTable.tableName,
        },
      }
    );

    dbTable.grantWriteData(insertRecordInDbFn);

    new Trigger(this, "insert-db-records-trigger", {
      handler: insertRecordInDbFn,
    });
  }
}
