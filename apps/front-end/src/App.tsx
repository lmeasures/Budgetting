import React from 'react';
import './App.css';

import testData from './test-data.json';

import CheckIcon from '@mui/icons-material/Check';
import {ToggleButton} from '@mui/material';

function App() {
  const emptyBudgetLine: IBudgetLine = {
    id: undefined,
    description: undefined,
    value: undefined,
    startDate: undefined,
    frequency: 1,
    endDate: undefined,
    paid: []
  }

  const [newBudgetLine, setNewBudgetLine] = React.useState<IBudgetLine>(emptyBudgetLine);
  const [budgetItems, setBudgetItems] = React.useState<Array<IBudgetLine>>(testData.items);
  

  const FrequencyEnum: Array<IBudgetFrequency> = [
    "Daily",
    "Weekly",
    "Monthly"
  ]

  type IBudgetFrequency = "Daily" | "Weekly" | "Monthly"

  interface IBudgetLine {
    id: number | undefined,
    description: string | undefined,
    value: string | undefined,
    startDate: string | undefined,
    frequency: number,
    endDate: string | undefined,
    paid: Array<string>,
  }

  const CurrentMonth = "10/2023";

  const handleNewLineChange = (attributeName: string, value: any) => {
    const newLineCopy = {...newBudgetLine, [attributeName]: value};
    setNewBudgetLine(newLineCopy);
  }

  const handlePaidClick = (id: number) => {
    const budgetItemsCopy = [... budgetItems]
    const budgetItemIndex = budgetItemsCopy.findIndex((a) => a.id === id)
    if (budgetItemsCopy[budgetItemIndex].paid && budgetItemsCopy[budgetItemIndex].paid.length > 0) {
      const paidIndex = budgetItemsCopy[budgetItemIndex].paid.findIndex((a) => a === CurrentMonth);
      if (paidIndex === -1){
        budgetItemsCopy[budgetItemIndex].paid.push(CurrentMonth);
      }
      else {
        budgetItemsCopy[budgetItemIndex].paid.splice(paidIndex, 1);
      }
    }
    setBudgetItems(budgetItemsCopy);
  }



  return (
    <div className="App">
      <>
        <div className="BudgetView-Container">
          <table className="BudgetView">
            <thead>
              <tr>
                <th className="BudgetView-Description">Description</th>
                <th className="BudgetView-Value">Value</th>
                <th className="BudgetView-StartDate">Start Date</th>
                <th className="BudgetView-Frequency">Frequency</th>
                <th className="BudgetView-End Date">End Date</th>
                <th className="BudgetView-Func"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="BudgetView-Row">
                <td className="BudgetView-Description">
                  <input className="BudgetView-DataEntry"
                    name="description"
                    type="text"
                    placeholder="Description"
                    value={newBudgetLine.description} 
                    onBlur={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Value">
                  <input className="BudgetView-DataEntry"
                    name="value"
                    type="string" 
                    placeholder="Value"
                    pattern="/^([0-9])+\.([0-9]){2}$/g" 
                    value={newBudgetLine.value}
                    onChange={(e) => {handleNewLineChange(e.target.name, +e.target.value)}}
                  />
                </td>
                <td className="BudgetView-StartDate">
                  <input className="BudgetView-DataEntry"
                    name="startDate"
                    type="date"
                    value={newBudgetLine.startDate}
                    onChange={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Frequency">
                  {FrequencyEnum[newBudgetLine.frequency]}
                  <input className="BudgetView-DataEntry" 
                    name="frequency"
                    type="range" 
                    min={0}
                    max={2}
                    step={1}
                    value={newBudgetLine.frequency}
                    onChange={(e) => {handleNewLineChange(e.target.name, +e.target.value)}}
                  />
                </td>
                <td className="BudgetView-EndDate">
                  <input className="BudgetView-DataEntry"
                    name="endDate"
                    type="date"
                    value={newBudgetLine.endDate}
                    onChange={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Func">
                  <button>Save</button>
                </td>
              </tr>
              {testData.items.map((item, i)=>{
                return (
                  <>
                    <tr key={i} className="BudgetView-Row">
                      <td className="BudgetView-Description">
                        {item.description}
                      </td>
                      <td className="BudgetView-Value">
                        £{item.value}
                      </td>
                      <td className="BudgetView-StartDate">
                        {item.startDate}
                      </td>
                      <td className="BudgetView-Frequency">
                        {FrequencyEnum[item.frequency]}
                      </td>
                      <td className="BudgetView-EndDate">
                        {item.endDate}
                      </td>
                      <td className="BudgetView-Func">
                        <ToggleButton
                          name="Paid"
                          value="check"
                          selected={!!item.paid.find((a)=> a === CurrentMonth)}
                          color="success"
                          size="small"
                          onClick={() => handlePaidClick(item.id)}
                        >
                          <CheckIcon/>
                        </ToggleButton>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    </div>
  );
}

export default App;
