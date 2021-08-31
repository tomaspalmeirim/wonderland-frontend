import { ethers } from "ethers";
import { getAddresses, BONDS } from "../../constants";
import { StakingContract, MemoTokenContract, BondingCalcContract } from "../../abi";
import { addressForAsset, contractForReserve, setAll, getTokenPrice } from "../../helpers";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@ethersproject/providers";

const initialState = {
  status: "idle",
};

export interface IApp {
  loading: boolean;
  stakingTVL: number;
  marketPrice: number;
  marketCap: number;
  circSupply: number;
  totalSupply: number;
  currentIndex?: string;
  currentBlock?: number;
  fiveDayRate?: number;
  treasuryBalance?: number;
  stakingAPY?: number;
  stakingRebase?: number;
  networkID?: number;
}

interface ILoadAppDetails {
  networkID: number;
  provider: JsonRpcProvider;
}

export const loadAppDetails = createAsyncThunk(
  "app/loadAppDetails",
  //@ts-ignore
  async ({ networkID, provider }: ILoadAppDetails) => {
    const price = await getTokenPrice("TIME");

    const stakingTVL = 0;
    const marketPrice = price;

    if (!provider) {
      console.error("failed to connect to provider, please connect your wallet");
      return {
        stakingTVL,
        marketPrice,
      };
    }
    const addresses = getAddresses(networkID);
    const currentBlock = await provider.getBlockNumber();

    const stakingContract = new ethers.Contract(addresses.STAKING_ADDRESS, StakingContract, provider);
    const memoContract = new ethers.Contract(addresses.MEMO_ADDRESS, MemoTokenContract, provider);
    const bondCalculator = new ethers.Contract(addresses.TIME_BONDING_CALC_ADDRESS, BondingCalcContract, provider);

    let token = contractForReserve(BONDS.mim, networkID, provider);
    const mimAmount = await token.balanceOf(addresses.TREASURY_ADDRESS);

    // token = contractForReserve(BONDS.mim_time, networkID, provider);
    // const mimTimeAmount = await token.balanceOf(addresses.TREASURY_ADDRESS);
    // const valuation = await bondCalculator.valuation(addressForAsset(BONDS.mim_time, networkID), mimTimeAmount);
    // const markdown = await bondCalculator.markdown(addressForAsset(BONDS.mim_time, networkID));
    // let mimTimeUSD = (valuation / Math.pow(10, 9)) * (markdown / Math.pow(10, 18));

    const treasuryBalance = mimAmount / Math.pow(10, 18); //+ mimTimeUSD;

    const epoch = await stakingContract.epoch();
    const stakingReward = epoch.distribute;
    const circ = await memoContract.circulatingSupply();
    const stakingRebase = stakingReward / circ;
    const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
    const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;

    const currentIndex = await stakingContract.index();

    return {
      currentIndex: ethers.utils.formatUnits(currentIndex, "gwei"),
      currentBlock,
      fiveDayRate,
      treasuryBalance,
      stakingAPY,
      stakingTVL,
      stakingRebase,
      marketPrice,
    };
  },
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    fetchAppSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAppDetails.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(loadAppDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.status = "idle";
      })
      .addCase(loadAppDetails.rejected, (state, { error }) => {
        state.status = "idle";
        console.log(error);
      });
  },
});

const baseInfo = (state: { app: IApp }) => state.app;

export default appSlice.reducer;

export const { fetchAppSuccess } = appSlice.actions;

export const getAppState = createSelector(baseInfo, app => app);
