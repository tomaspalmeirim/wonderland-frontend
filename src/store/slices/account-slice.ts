import { ethers } from "ethers";
import { getAddresses } from "../../constants";
import { MimTokenContract, TimeTokenContract, MemoTokenContract } from "../../abi/";
import { setAll } from "../../helpers";

import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider } from "@ethersproject/providers";

interface IState {
  status: string;
}

const initialState: IState = {
  status: "idle",
};

interface IAccountProps {
  address: string;
  networkID: number;
  provider: JsonRpcProvider;
}

export interface IAccount {
  balances: {
    mim: string;
    memo: string;
    time: string;
  };
  staking: {
    timeStake: number;
    memoUnstake: number;
  };
}

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IAccountProps) => {
    const addresses = getAddresses(networkID);
    const memoContract = new ethers.Contract(addresses.MEMO_ADDRESS, MemoTokenContract, provider);
    const memoBalance = await memoContract.balanceOf(address);
    const timeContract = new ethers.Contract(addresses.TIME_ADDRESS, TimeTokenContract, provider);
    const timeBalance = await timeContract.balanceOf(address);
    return {
      balances: {
        memo: ethers.utils.formatUnits(memoBalance, "gwei"),
        time: ethers.utils.formatUnits(timeBalance, "gwei"),
      },
    };
  },
);

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IAccountProps) => {
    let timeBalance = 0;
    let memoBalance = 0;
    let stakeAllowance = 0;
    let unstakeAllowance = 0;

    const addresses = getAddresses(networkID);

    const mimContract = new ethers.Contract(addresses.MIM_ADDRESS, MimTokenContract, provider);
    const mimBalance = await mimContract.balanceOf(address);

    if (addresses.TIME_ADDRESS) {
      const timeContract = new ethers.Contract(addresses.TIME_ADDRESS, TimeTokenContract, provider);
      timeBalance = await timeContract.balanceOf(address);
      stakeAllowance = await timeContract.allowance(address, addresses.STAKING_HELPER_ADDRESS);
    }

    if (addresses.MEMO_ADDRESS) {
      const memoContract = new ethers.Contract(addresses.MEMO_ADDRESS, MemoTokenContract, provider);
      memoBalance = await memoContract.balanceOf(address);
      unstakeAllowance = await memoContract.allowance(address, addresses.STAKING_ADDRESS);
    }

    return {
      balances: {
        memo: ethers.utils.formatUnits(memoBalance, "gwei"),
        time: ethers.utils.formatUnits(timeBalance, "gwei"),
        mim: ethers.utils.formatEther(mimBalance),
      },
      staking: {
        timeStake: +stakeAllowance,
        memoUnstake: +unstakeAllowance,
      },
    };
  },
);

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.status = "loading";
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.status = "idle";
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.status = "idle";
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.status = "loading";
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.status = "idle";
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.status = "idle";
        console.log(error);
      });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: { account: IAccount }) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
