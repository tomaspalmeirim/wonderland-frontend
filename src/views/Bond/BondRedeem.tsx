import { useSelector, useDispatch } from "react-redux";
import { Box, Slide } from "@material-ui/core";
import { redeemBond } from "../../store/slices/bond-slice";
import { useWeb3Context } from "../../hooks";
import { trim, secondsUntilBlock, prettifySeconds, prettyVestingPeriod } from "../../helpers";
import { IPendingTxn, isPendingTxn, txnButtonText } from "../../store/slices/pending-txns-slice";
import { Skeleton } from "@material-ui/lab";
import { IReduxState } from "../../store/slices/state.interface";

interface IBondRedeem {
  bond: string;
}

function BondRedeem({ bond }: IBondRedeem) {
  const dispatch = useDispatch();
  const { provider, address, chainID } = useWeb3Context();

  const currentBlock = useSelector<IReduxState, number>(state => {
    return state.app.currentBlock || 0;
  });

  const isBondLoading = useSelector<IReduxState, boolean>(state => state.bonding.loading ?? true);
  const bondMaturationBlock = useSelector<IReduxState, number>(state => {
    return (state.bonding[bond] && state.bonding[bond].bondMaturationBlock) || 0;
  });

  const vestingTerm = useSelector<IReduxState, number>(state => {
    return (state.bonding[bond] && state.bonding[bond].vestingBlock) || 0;
  });

  const interestDue = useSelector<IReduxState, number>(state => {
    return (state.bonding[bond] && state.bonding[bond].interestDue) || 0;
  });

  const pendingPayout = useSelector<IReduxState, number>(state => {
    return (state.bonding[bond] && state.bonding[bond].pendingPayout) || 0;
  });

  const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
    return state.pendingTransactions;
  });

  async function onRedeem(autostake: boolean) {
    await dispatch(redeemBond({ address, bond, networkID: chainID, provider, autostake }));
  }

  const vestingTime = () => {
    return prettyVestingPeriod(currentBlock, bondMaturationBlock);
  };

  const vestingPeriod = () => {
    //@ts-ignore
    const vestingBlock = parseInt(currentBlock) + parseInt(vestingTerm);
    const seconds = secondsUntilBlock(currentBlock, vestingBlock);
    return prettifySeconds(seconds, "day");
  };

  const bondDiscount = useSelector<IReduxState, number>(state => {
    return (state.bonding[bond] && state.bonding[bond].bondDiscount) || 0;
  });

  const debtRatio = useSelector<IReduxState, number>(state => {
    return (state.bonding[bond] && state.bonding[bond].debtRatio) || 0;
  });

  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-around" flexWrap="wrap">
        <div
          className="transaction-button bond-approve-btn"
          onClick={() => {
            if (isPendingTxn(pendingTransactions, "redeem_bond_" + bond)) return;
            onRedeem(false);
          }}
        >
          <p>{txnButtonText(pendingTransactions, "redeem_bond_" + bond, "Claim")}</p>
        </div>
        <div
          className="transaction-button bond-approve-btn"
          onClick={() => {
            if (isPendingTxn(pendingTransactions, "redeem_bond_" + bond + "_autostake")) return;
            onRedeem(true);
          }}
        >
          <p>{txnButtonText(pendingTransactions, "redeem_bond_" + bond + "_autostake", "Claim and Autostake")}</p>
        </div>
      </Box>

      <Slide direction="right" in={true} mountOnEnter unmountOnExit {...{ timeout: 533 }}>
        <Box className="bond-data">
          <div className="data-row">
            <p className="bond-balance-title">Pending Rewards</p>
            <p className="price-data bond-balance-title">
              {isBondLoading ? <Skeleton width="100px" /> : `${trim(interestDue, 4)} MIM`}
            </p>
          </div>
          <div className="data-row">
            <p className="bond-balance-title">Claimable Rewards</p>
            <p className="price-data bond-balance-title">
              {isBondLoading ? <Skeleton width="100px" /> : `${trim(pendingPayout, 4)} MIM`}
            </p>
          </div>
          <div className="data-row">
            <p className="bond-balance-title">Time until fully vested</p>
            <p className="price-data bond-balance-title">
              {isBondLoading ? <Skeleton width="100px" /> : vestingTime()}
            </p>
          </div>

          <div className="data-row">
            <p className="bond-balance-title">ROI</p>
            <p className="bond-balance-title">
              {isBondLoading ? <Skeleton width="100px" /> : `${trim(bondDiscount * 100, 2)}%`}
            </p>
          </div>

          <div className="data-row">
            <p className="bond-balance-title">Debt Ratio</p>
            <p className="bond-balance-title">
              {isBondLoading ? <Skeleton width="100px" /> : `${trim(debtRatio / 10000000, 2)}%`}
            </p>
          </div>

          <div className="data-row">
            <p className="bond-balance-title">Vesting Term</p>
            <p className="bond-balance-title">{isBondLoading ? <Skeleton width="100px" /> : vestingPeriod()}</p>
          </div>
        </Box>
      </Slide>
    </Box>
  );
}

export default BondRedeem;
