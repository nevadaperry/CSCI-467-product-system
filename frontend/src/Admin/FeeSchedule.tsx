import React, { useMemo, useState } from 'react';
import { Button, Input, Label, Spinner } from 'reactstrap';
import { useLoad } from '../custom-hooks';
import * as api from '../api';

export default function FeeSchedule() {
  // Goal: Avoid focus-stealing or otherwise changing the visible data when
  // the user wouldn't expect it.
  const [refreshOrdinal, setRefreshOrdinal] = useState(1);
  const [existingFS, existingFSLoad] = useLoad(
    api.readFeeSchedule,
    refreshOrdinal
  );
  const visibleFS = useMemo(() => {
    if (existingFSLoad.status === 'finished') {
      return existingFS;
    }
    return undefined;
  }, [existingFS, existingFSLoad]);

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
        upperBound:
          (visibleFS.weight_brackets[i + 1]?.lower_bound ?? 1000000) - 0.01,
        fee: wb.fee,
      });
    }
    return result;
  }, [visibleFS]);

  const [newLowerBound, setNewLowerBound] = useState(0);
  const [newFee, setNewFee] = useState(10);

  function addWeightBracket() {
    (async () => {
      try {
        await api.updateFeeSchedule(existingFS!, {
          weight_brackets: visibleFS!.weight_brackets.concat({
            lower_bound: newLowerBound,
            fee: newFee,
          }),
        });
        // TODO(nevada): Handle possible issues with resource not existing or
        // non-success state in UpdateResult
        setRefreshOrdinal(refreshOrdinal + 1);
      } catch (e) {
        throw new Error(
          `Server rejected new weight bracket, likely because you set a lower bound that overlaps with an existing one. ${e}`
        );
      }
    })();
  }

  function removeWeightBracket(index: number) {
    (async () => {
      await api.updateFeeSchedule(existingFS!, {
        weight_brackets: [
          ...visibleFS!.weight_brackets.slice(0, index),
          ...visibleFS!.weight_brackets.slice(index + 1),
        ],
      });
      // TODO(nevada): Handle possible issues with resource not existing or
      // non-success state in UpdateResult
      setRefreshOrdinal(refreshOrdinal + 1);
    })();
  }

  return (
    <div className="container">
      {existingFSLoad.status === 'loading' ? (
        <Spinner />
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th className="ps-right">Lower bound</th>
                <th className="ps-right">Upper bound</th>
                <th className="ps-right">Shipping fee</th>
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
              <Label>New shipping fee ($):&nbsp;</Label>
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
