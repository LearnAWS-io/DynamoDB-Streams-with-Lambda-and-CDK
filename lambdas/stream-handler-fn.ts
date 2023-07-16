import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamEvent } from "aws-lambda";

export const handler = async (event: DynamoDBStreamEvent) => {
  event.Records.forEach((record) => {
    // take action based on the event type
    switch (record.eventName) {
      case "INSERT":
        console.log("New Item has been added");
        break;
      case "MODIFY":
        console.log("An Item has been updated");
        break;
      case "REMOVE":
        console.log("An Item has been deleted");
        break;
      default:
        throw Error("Unable to determine event type");
    }
    if (!record.dynamodb) {
      throw Error("No DB record");
    }
    const { NewImage, OldImage, Keys } = record.dynamodb;
    const item = NewImage || OldImage || Keys;
    if (!item) {
      throw Error("No item found in DB record");
    }
    // convert DDB JSON to JSON
    const itemObj = unmarshall(item);
    console.log(itemObj);
  });
};
