import { ThemeProvider } from "@material-ui/core/styles";
import { useEffect, useState, useCallback } from "react";
import { Route, Redirect, Switch, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Hidden, useMediaQuery } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useAddress, useWeb3Context } from "./hooks";

import { calcBondDetails } from "./store/slices/bond-slice";
import { loadAppDetails } from "./store/slices/app-slice";
import { loadAccountDetails } from "./store/slices/account-slice";

import { Stake, ChooseBond, Bond } from "./views";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/Header";
import NavDrawer from "./components/Sidebar/NavDrawer";
import NotFound from "./views/404/NotFound";

import { light as lightTheme } from "./themes";

import { BONDS } from "./constants";
import "./style.scss";
import { IReduxState } from "./store/slices/state.interface";

const drawerWidth = 280;
const transitionDuration = 969;

const useStyles = makeStyles(theme => ({
  drawer: {
    [theme.breakpoints.up("md")]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(1),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: transitionDuration,
    }),
    height: "100%",
    overflow: "auto",
    marginLeft: drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: transitionDuration,
    }),
    marginLeft: 0,
  },
  // necessary for content to be below app bar
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
}));

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const classes = useStyles();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSmallerScreen = useMediaQuery("(max-width: 960px)");
  const isSmallScreen = useMediaQuery("(max-width: 600px)");

  const { provider, chainID, connected } = useWeb3Context();
  const address = useAddress();

  const isAppLoaded = useSelector<IReduxState>(state => typeof state.app.marketPrice != "undefined");
  async function loadDetails(whichDetails: string) {
    let loadProvider = provider;

    if (whichDetails === "app") {
      loadApp(loadProvider);
    }

    if (whichDetails === "account" && address && connected) {
      loadAccount(loadProvider);
      if (isAppLoaded) return;

      loadApp(loadProvider);
    }
  }

  const loadApp = useCallback(
    loadProvider => {
      dispatch(loadAppDetails({ networkID: chainID, provider: loadProvider }));
      Object.values(BONDS).map(async bond => {
        await dispatch(calcBondDetails({ bond, value: null, provider: loadProvider, networkID: chainID }));
      });
    },
    [connected],
  );

  const loadAccount = useCallback(
    loadProvider => {
      dispatch(loadAccountDetails({ networkID: chainID, address, provider: loadProvider }));
    },
    [connected],
  );

  useEffect(() => {
    loadDetails("app");
  }, []);

  useEffect(() => {
    loadDetails("account");
  }, [connected]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarExpanded(false);
  };

  useEffect(() => {
    if (isSidebarExpanded) handleSidebarClose();
  }, [location]);

  return (
    <ThemeProvider theme={lightTheme}>
      <div className="root-background" />
      <div className={`app ${isSmallerScreen && "tablet"} ${isSmallScreen && "mobile"}`}>
        <TopBar drawe={!isSmallerScreen} handleDrawerToggle={handleDrawerToggle} />
        <nav className={classes.drawer}>
          <Hidden mdUp>
            <NavDrawer mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
          </Hidden>
          <Hidden smDown>
            <Sidebar />
          </Hidden>
        </nav>

        <div className={`${classes.content} ${isSmallerScreen && classes.contentShift}`}>
          <Switch>
            <Route exact path="/">
              <Redirect to="/stake" />
            </Route>

            <Route path="/stake">
              <Stake />
            </Route>

            <Route path="/bonds">
              {Object.values(BONDS).map(bond => {
                return (
                  <Route exact key={bond} path={`/bonds/${bond}`}>
                    <Bond bond={bond} />
                  </Route>
                );
              })}
              <ChooseBond />
            </Route>

            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
