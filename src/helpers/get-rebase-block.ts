import { EPOCH_INTERVAL } from "../constants";

export const getRebaseBlock = (currentBlock: number) => {
  return currentBlock + EPOCH_INTERVAL - (currentBlock % EPOCH_INTERVAL);
};
