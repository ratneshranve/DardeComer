import mongoose from "mongoose";
import { config } from "../src/config/env.js";
import { logger } from "../src/utils/logger.js";
import { FoodRestaurant } from "../src/modules/food/restaurant/models/restaurant.model.js";

const INTENDED_UNIQUE_INDEX_KEYS = ["restaurantNameNormalized", "ownerPhoneLast10"];
const PHONE_INDEX_KEYS = new Set(["ownerPhone", "ownerPhoneDigits", "ownerPhoneLast10", "primaryContactNumber"]);

const sameKeySet = (keys, expected) => {
  if (keys.length !== expected.length) return false;
  return keys.every((key, index) => key === expected[index]);
};

const isConflictingUniquePhoneIndex = (index) => {
  if (!index || !index.unique || !index.key || typeof index.key !== "object") {
    return false;
  }

  const keyNames = Object.keys(index.key);
  if (sameKeySet(keyNames, INTENDED_UNIQUE_INDEX_KEYS)) {
    return false;
  }

  return keyNames.some((key) => PHONE_INDEX_KEYS.has(key));
};

const main = async () => {
  if (!config.mongodbUri) {
    throw new Error("MONGO_URI / MONGODB_URI is missing in environment");
  }

  await mongoose.connect(config.mongodbUri);
  const collection = FoodRestaurant.collection;

  logger.info("Inspecting food_restaurants indexes for conflicting unique phone constraints...");
  const indexes = await collection.indexes();

  const conflictingIndexes = indexes.filter(isConflictingUniquePhoneIndex);

  if (!conflictingIndexes.length) {
    logger.info("No conflicting unique phone indexes found. Nothing to change.");
    await mongoose.disconnect();
    return;
  }

  for (const index of conflictingIndexes) {
    logger.warn(`Dropping conflicting unique index: ${index.name} ${JSON.stringify(index.key)}`);
    await collection.dropIndex(index.name);
  }

  logger.info("Re-syncing restaurant indexes from current Mongoose schema...");
  await FoodRestaurant.syncIndexes();

  const finalIndexes = await collection.indexes();
  logger.info(`Final index count: ${finalIndexes.length}`);
  finalIndexes.forEach((index) => {
    logger.info(`Index: ${index.name} ${JSON.stringify(index.key)}${index.unique ? " unique" : ""}`);
  });

  await mongoose.disconnect();
};

main()
  .then(() => {
    logger.info("Restaurant phone index fix completed successfully.");
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error(`Restaurant phone index fix failed: ${error.message}`);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
