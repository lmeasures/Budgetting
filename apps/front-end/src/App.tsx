import React from 'react';
import './App.css';

function App() {

  const FrequencyEnum: Array<IBudgetFrequency> = [
    "Daily",
    "Weekly",
    "Monthly"
  ]

  type IBudgetFrequency = "Daily" | "Weekly" | "Monthly"

  interface IBudgetLine {
    Description: string,
    Value: number,
    StartDate: string,
    Frequency: 0 | 1 | 2,
    EndDate: string
  }

  const handleNewLineChange = (attributeName: string, value: any) => {
    const newLineCopy = {...newBudgetLine, [attributeName]: value};
    console.log(newLineCopy);
    setNewBudgetLine(newLineCopy);
  }

  const emptyBudgetLine: IBudgetLine = {
    Description: "",
    Value: 0.00,
    StartDate: new Date().getDate().toLocaleString('en-GB'),
    Frequency: 2,
    EndDate: new Date().getDate().toLocaleString('en-GB'),
  }

  const [newBudgetLine, setNewBudgetLine] = React.useState<IBudgetLine>(emptyBudgetLine);

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
                    name="Description"
                    type="text"
                    value={newBudgetLine.Description}
                    onBlur={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Value">
                  <input className="BudgetView-DataEntry"
                    name="Value"
                    type="string" 
                    // pattern="/^([0-9])+\.([0-9]){2}$/g" 
                    value={newBudgetLine.Value}
                    onChange={(e) => {handleNewLineChange(e.target.name, +e.target.value)}}
                  />
                </td>
                <td className="BudgetView-StartDate">
                  <input className="BudgetView-DataEntry"
                    name="StartDate"
                    type="date"
                    value={newBudgetLine.StartDate}
                    onChange={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Frequency">
                  {FrequencyEnum[newBudgetLine.Frequency]}
                  <input className="BudgetView-DataEntry" 
                    name="Frequency"
                    type="range" 
                    min={0}
                    max={2}
                    step={1}
                    value={newBudgetLine.Frequency}
                    onChange={(e) => {handleNewLineChange(e.target.name, +e.target.value)}}
                  />
                </td>
                <td className="BudgetView-EndDate">
                  <input className="BudgetView-DataEntry"
                    name="EndDate"
                    type="date"
                    value={newBudgetLine.EndDate}
                    onChange={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Func">
                  <button>Save</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    </div>
  );
}

export default App;
