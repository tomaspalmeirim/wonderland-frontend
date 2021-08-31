import { BONDS } from "../constants";
import { getAddresses } from "../constants";

export const lpURL = (bond: string, networkID: number): string => {
  const addresses = getAddresses(networkID);

  // if (bond === BONDS.mim_time) {
  //   return `https://app.sushi.com/add/${addresses.RESERVES.MIM}/${addresses.TIME_ADDRESS}`;
  // }

  throw Error(`LP url doesn't support: ${bond}`);
};
