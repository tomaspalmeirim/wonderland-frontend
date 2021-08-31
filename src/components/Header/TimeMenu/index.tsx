import { useState } from "react";
import { getAddresses, TOKEN_DECIMALS, DEFAULD_NETWORK } from "../../../constants";
import { getTokenImage } from "../../../helpers";
import { useSelector } from "react-redux";
import { Link, SvgIcon, Popper, Button, Paper, Typography, Divider, Box, Fade } from "@material-ui/core";
import { ReactComponent as ArrowUpIcon } from "../../../assets/icons/arrow-up.svg";
import "./ohmmenu.scss";
import { IReduxState } from "../../../store/slices/state.interface";

const memoImg = getTokenImage("memo");
const timeImg = getTokenImage("time");

const addTokenToWallet = (tokenSymbol: string, tokenAddress: string) => async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: TOKEN_DECIMALS,
            image: tokenSymbol === "TIME" ? timeImg : memoImg,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

function TimeMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const isEthereumAPIAvailable = window.ethereum;

  const networkID = useSelector<IReduxState, number>(state => {
    return (state.app && state.app.networkID) || DEFAULD_NETWORK;
  });

  const addresses = getAddresses(networkID);

  const MEMO_ADDRESS = addresses.MEMO_ADDRESS;
  const TIME_ADDRESS = addresses.TIME_ADDRESS;

  const handleClick = (event: any) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = "ohm-popper";
  return (
    <>
      <Box
        component="div"
        onMouseEnter={e => handleClick(e)}
        onMouseLeave={e => handleClick(e)}
        id="ohm-menu-button-hover"
      >
        <div className="ohm-button">
          <p>TIME</p>
        </div>

        <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start" transition>
          {({ TransitionProps }) => {
            return (
              <Fade {...TransitionProps} timeout={200}>
                <Paper className="ohm-menu" elevation={1}>
                  <Box component="div" className="buy-tokens">
                    <Link
                      href={`https://app.sushi.com/swap?inputCurrency=${addresses.RESERVES.MIM}&outputCurrency=${TIME_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="large" variant="contained" color="secondary" fullWidth>
                        <Typography className="buy-text" align="left">
                          Buy on Sushiswap <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                        </Typography>
                      </Button>
                    </Link>
                  </Box>

                  {isEthereumAPIAvailable ? (
                    <Box className="add-tokens">
                      <Divider color="secondary" />
                      <p>ADD TOKEN TO WALLET</p>
                      <Button
                        size="large"
                        variant="contained"
                        color="secondary"
                        onClick={addTokenToWallet("TIME", TIME_ADDRESS)}
                      >
                        <Typography className="buy-text">TIME</Typography>
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        color="secondary"
                        onClick={addTokenToWallet("MEMO", MEMO_ADDRESS)}
                      >
                        <Typography className="buy-text">MEMO</Typography>
                      </Button>
                    </Box>
                  ) : null}

                  <Divider color="secondary" />
                  <Link
                    href="https://wonderland.gitbook.io/wonderland/using-avalanche-explorer/unstake-notime"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography className="buy-text" align="left">
                        Unstake LP Token
                      </Typography>
                    </Button>
                  </Link>
                </Paper>
              </Fade>
            );
          }}
        </Popper>
      </Box>
    </>
  );
}

export default TimeMenu;
