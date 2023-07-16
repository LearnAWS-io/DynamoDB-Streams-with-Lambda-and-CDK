import {
  BatchWriteItemCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { faker } from "@faker-js/faker";

const dbClient = new DynamoDBClient({});

const { TABLE_NAME } = process.env;

if (!TABLE_NAME) {
  throw "Table name not present in env";
}
export const handler = async () => {
  const animals = Array.from({ length: 15 }).map(() => {
    const animalKingdom = faker.animal.type();
    //@ts-ignore
    const animalName = faker.animal[animalKingdom]();

    return {
      PK: "ANIMAL",
      SK: `${animalKingdom.toUpperCase()}#${animalName}`,
      color: faker.color.human(),
      weight: faker.number.int({ min: 1, max: 300 }),
    };
  });

  const batchPutItemCmd = new BatchWriteItemCommand({
    RequestItems: {
      [TABLE_NAME]: animals.map((animal) => ({
        PutRequest: { Item: marshall(animal) },
      })),
    },
  });

  await dbClient.send(batchPutItemCmd);
  console.log("Table prefilled");
};

// handler();
