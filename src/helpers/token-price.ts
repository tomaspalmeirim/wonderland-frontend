import axios from "axios";

export const getTokenPrice = (symbol: string): Promise<number> => {
  const url = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`;

  return axios
    .get(url)
    .then(({ data }) => data.USD)
    .catch(error => {
      console.error(error);
      return 0;
    });
};
