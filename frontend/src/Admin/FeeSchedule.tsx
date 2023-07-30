import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Label, Spinner } from 'reactstrap';
import { useLoad } from '../custom-hooks';
import * as api from '../api';
import { FeeSchedule as FeeScheduleResource } from '../../../shared/resource';

export default function FeeSchedule() {
  // FS = fee schedule; WB = weight bracket.
  // Goal: Avoid focus-stealing or otherwise changing the visible data when
  // the user wouldn't expect it.
  const [needsRefresh, setNeedsRefresh] = useState(true);
  const [refreshOrdinal, setRefreshOrdinal] = useState(0);
  const [dbFS, dbFSLoad] = useLoad(api.readFeeSchedule, refreshOrdinal);
  const [visibleFS, setVisibleFS] = useState<FeeScheduleResource>();
  useEffect(() => {
    if (needsRefresh && dbFSLoad.status === 'finished') {
      setVisibleFS(dbFS);
      setNeedsRefresh(false);
    }
  }, [needsRefresh, dbFS, dbFSLoad]);

  const visibleWBs = useMemo(() => {
    if (!visibleFS) return undefined;
    const result = [] as {
      lowerBound: number;
      upperBound: number;
      fee: number;
    }[];
    for (const [i, wb] of visibleFS?.weight_brackets.entries()) {
      result.push({
        lowerBound: wb.lower_bound,
        upperBound: visibleFS.weight_brackets[i + 1]?.lower_bound ?? 999999,
        fee: wb.fee,
      });
    }
    return result;
  }, [visibleFS]);

  const [newLowerBound, setNewLowerBound] = useState(0);
  const [newFee, setNewFee] = useState(10);

  function addWeightBracket() {
    (async () => {
      // const result =
      await api.updateFeeSchedule(dbFS!, {
        weight_brackets: visibleFS!.weight_brackets.concat({
          lower_bound: newLowerBound,
          fee: newFee,
        }),
      });
      // TODO(nevada): Handle possible issues with resource not existing or
      // non-success state in UpdateResult
      setNeedsRefresh(true);
      setRefreshOrdinal(refreshOrdinal + 1);
    })();
  }

  function removeWeightBracket(index: number) {}

  return (
    <div className="container">
      {dbFSLoad.status === 'loading' ? (
        <Spinner />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th className="ps-right">Lower bound</th>
                <th className="ps-right">Upper bound</th>
                <th className="ps-right">S&H fee</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleWBs?.map((wb, index) => (
                <tr key={index}>
                  <td className="ps-right">{wb.lowerBound} lbs</td>
                  <td className="ps-right">{wb.upperBound} lbs</td>
                  <td className="ps-right">${wb.fee}</td>
                  <td className="ps-right">
                    <Button
                      color="danger"
                      onClick={() => removeWeightBracket(index)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ps-right">
            <div className="ps-inline-flex ps-personal-space">
              <Label>New lower bound (lbs):&nbsp;</Label>
              <Input
                type="number"
                value={newLowerBound}
                onChange={(e) => setNewLowerBound(parseFloat(e.target.value))}
              />
            </div>
            <div className="ps-inline-flex ps-personal-space">
              <Label>New S&H fee ($):&nbsp;</Label>
              <Input
                type="number"
                step="0.01"
                value={newFee}
                onChange={(e) => setNewFee(parseFloat(e.target.value))}
              />
            </div>
            <Button className="ps-personal-space" onClick={addWeightBracket}>
              Add weight bracket
            </Button>
          </div>
        </>
      )}
    </div>
  );
}