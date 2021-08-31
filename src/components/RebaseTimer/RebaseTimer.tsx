import { useSelector } from "react-redux";
import { getRebaseBlock, secondsUntilBlock, prettifySeconds } from "../../helpers";
import { Box } from "@material-ui/core";
import "./rebasetimer.scss";
import { Skeleton } from "@material-ui/lab";
import { useMemo } from "react";

function RebaseTimer() {
  const currentBlock = useSelector(state => {
    //@ts-ignore
    return state.app.currentBlock;
  });

  const timeUntilRebase = useMemo(() => {
    if (currentBlock) {
      const rebaseBlock = getRebaseBlock(currentBlock);
      const seconds = secondsUntilBlock(currentBlock, rebaseBlock);
      return prettifySeconds(seconds);
    }
  }, [currentBlock]);

  return (
    <Box className="rebase-timer">
      <p>
        {currentBlock ? (
          timeUntilRebase ? (
            <>
              <strong>{timeUntilRebase}</strong> to Next Rebase
            </>
          ) : (
            <strong>Rebasing</strong>
          )
        ) : (
          <Skeleton width="200px" />
        )}
      </p>
    </Box>
  );
}

export default RebaseTimer;
