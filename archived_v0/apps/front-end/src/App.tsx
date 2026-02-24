import React from 'react';
import './App.css';

import testData from './test-data.json';

import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import {Fab, InputAdornment, TextField, ToggleButton, Tooltip, Typography, createTheme} from '@mui/material';
import { DatePicker, DateTimePicker, DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const App = () => {
  const [budgetItems, setBudgetItems] = React.useState<Array<IBudgetLine>>(testData.items);
  
  const emptyBudgetLine: IBudgetLine = {
    id: budgetItems.length + 1,
    description: undefined,
    value: undefined,
    startDate: undefined,
    frequency: 1,
    endDate: undefined,
    paid: [],
    deletedMonths: [],
  }

  const [newBudgetLine, setNewBudgetLine] = React.useState<IBudgetLine>(emptyBudgetLine);
  const [displaySubmitToolTip, setDisplaySubmitToolTip] = React.useState<boolean>(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [datetest, setdatetest] = React.useState();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState<number | false>(false)

  //.toLocaleDateString("en-GB", {day: "numeric", month: "numeric", year: "numeric"})

  const FrequencyEnum: Array<IBudgetFrequency> = [
    "Daily",
    "Weekly",
    "Monthly"
  ]

  type IBudgetFrequency = "Daily" | "Weekly" | "Monthly"

  interface IBudgetLine {
    id: number,
    description: string | undefined,
    value: string | undefined,
    startDate: Date | string | undefined,
    frequency: number,
    endDate: Date | string | undefined,
    paid: Array<string>,
    deletedMonths: Array<string>,
  }

  const changeYear = (changeValue: number) => {
    const dateCopy = selectedDate;
    dateCopy.setFullYear( selectedDate.getFullYear() + changeValue);
    setSelectedDate(new Date(dateCopy));
  }
  const changeMonth = (changeValue: number) => {
    const dateCopy = selectedDate;
    dateCopy.setMonth( selectedDate.getMonth() + changeValue);
    setSelectedDate(new Date(dateCopy));
  }

  const handleNewLineChange = (attributeName: string, value: any) => {
    const newLineCopy = {...newBudgetLine, [attributeName]: value};
    setNewBudgetLine(newLineCopy);
  }


  const filterBudgetItems = (budgetItems: Array<IBudgetLine>) => {
    const selectedDateLowerComparitor = new Date(selectedDate);
    selectedDateLowerComparitor.setDate(1);
    selectedDateLowerComparitor.setHours(0,0,0,0);
    const selectedDateUpperComparitor = new Date(selectedDate);
    selectedDateUpperComparitor.setDate(31);
    selectedDateUpperComparitor.setHours(0,0,0,0);
    const selectedMonth = selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"})
    const items = budgetItems.filter((item) => {
      if ( item.startDate && item.endDate){
        const newStartDate = new Date(item.startDate);
        newStartDate.setDate(1);
        const newEndDate = new Date(item.endDate);
        newEndDate.setDate(1);
      return (
          newStartDate <= selectedDateUpperComparitor
            &&
          newEndDate >= selectedDateLowerComparitor
            &&
          !item.deletedMonths.includes(selectedMonth)
        )
      }
    })
    return items;
  }

  const handleAddBudgetItem = async () => {
    if(
      newBudgetLine.description === undefined ||
      newBudgetLine.startDate === undefined ||
      newBudgetLine.frequency === undefined ||
      newBudgetLine.value === undefined
      ) {
        showSubmitTooltip();
      }
    else {
      newBudgetLine.id = budgetItems.length + 1;
      const newBudgetItems = [... budgetItems, newBudgetLine];
      await setBudgetItems(newBudgetItems);
      await setNewBudgetLine(emptyBudgetLine);
    }
  }


  const showSubmitTooltip = () => {
    setDisplaySubmitToolTip(true);
    const timer = setInterval(() => {
      setDisplaySubmitToolTip(false);
      clearInterval(timer);
    }, 2000)
  }

  const SubmitTooltipContent = (
    <React.Fragment>
        <Typography color="white">Fill in all fields before saving</Typography>
    </React.Fragment>
  )


  const handlePaidClick = (id: number) => {
    const selectedMonth = selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"})
    const budgetItemsCopy = [... budgetItems]
    const budgetItemIndex = budgetItemsCopy.findIndex((a) => a.id === id);
    console.log(budgetItemIndex);
    if (budgetItemsCopy[budgetItemIndex].paid) {
      const paidIndex = budgetItemsCopy[budgetItemIndex].paid.findIndex((a) => a === selectedMonth);
      console.log(paidIndex);
      if (paidIndex === -1){
        budgetItemsCopy[budgetItemIndex].paid.push(selectedMonth);
      }
      else {
        budgetItemsCopy[budgetItemIndex].paid.splice(paidIndex, 1);
      }
    }
    setBudgetItems(budgetItemsCopy);
  }

  const handleDeleteOne = (id: number) => {
    const selectedMonth = selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"})
    const budgetItemsCopy = [... budgetItems]
    const budgetItemIndex = budgetItemsCopy.findIndex((a) => a.id === id);
    budgetItemsCopy[budgetItemIndex].deletedMonths.push(selectedMonth)
    setBudgetItems(budgetItemsCopy);
    setShowDeleteConfirmation(false)
  }
  const handleDeleteFuture = (id: number) => {
    let selectedDateCopy = new Date(selectedDate)
    if (selectedDateCopy.getMonth() > 0) {
      selectedDateCopy.setMonth(selectedDate.getMonth()-1)  
    }
    else {
      selectedDateCopy.setMonth(11)  
      selectedDateCopy.setFullYear(selectedDateCopy.getFullYear()-1)
    }
    const selectedMonth = selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"})
    const budgetItemsCopy = [... budgetItems]
    const budgetItemIndex = budgetItemsCopy.findIndex((a) => a.id === id);
    budgetItemsCopy[budgetItemIndex].endDate = selectedMonth
    setBudgetItems(budgetItemsCopy)
    setShowDeleteConfirmation(false)
  }

  return (
    <div className="App">
      <>
        <div className="BudgetView-Container">
          <div className="BudgetView-MonthSelector">
            <div className="MonthSelector-Controls">
              <button onClick={() => changeYear(-1)}>{"<<"}</button>
              <button onClick={() => changeMonth(-1)}>{"<"}</button>
              &nbsp; {selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"})} &nbsp;
              <button onClick={() => changeMonth(1)}>{">"}</button>
              <button onClick={() => changeYear(1)}>{">>"}</button>
            </div> 
          </div>
          <table className="BudgetView"> 
            <thead>
              <tr>
                <td className="BudgetView-Delete Empty" />
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
                <td className="BudgetView-Delete Empty" />
                <td className="BudgetView-Description">
                  <TextField 
                    id="BudgetView-DataEntry"
                    label="Description"
                    variant="outlined"
                    name="description"
                    value={newBudgetLine.description}
                    onChange={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                  />
                </td>
                <td className="BudgetView-Value">
                  <TextField 
                    id="BudgetView-DataEntry"
                    label="Value"
                    variant="outlined"
                    name="value"
                    value={newBudgetLine.value}
                    onChange={(e) => {handleNewLineChange(e.target.name, e.target.value)}}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">£</InputAdornment>,
                    }}
                  />
                </td>
                <td className="BudgetView-StartDate">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DesktopDatePicker
                      name="startDate"
                      value={dayjs(newBudgetLine.startDate)}
                      onAccept={(e) => handleNewLineChange("startDate", dayjs(e).format('DD-MM-YYYY'))}
                    />
                  </LocalizationProvider>
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
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DesktopDatePicker
                      name="endDate"
                      value={newBudgetLine.endDate ? dayjs(newBudgetLine.endDate) : undefined}
                      onAccept={(e) => handleNewLineChange("endDate", dayjs(e).format('DD-MM-YYYY'))}
                    />
                  </LocalizationProvider>
                </td>
                <td className="BudgetView-Func">
                <Tooltip 
                  title={SubmitTooltipContent}
                  open={displaySubmitToolTip}
                  followCursor
                  placement="right"
                  arrow
                >
                  <Fab 
                    size="small"
                    color="secondary"
                    onClick={() => {handleAddBudgetItem()}}
                  >
                    <AddIcon/>
                  </Fab>
                </Tooltip>
                </td>
              </tr>
              {filterBudgetItems(budgetItems).map((item, i)=>{
                return (
                  <>
                    <tr key={i} className="BudgetView-Row">
                      <td className="BudgetView-Delete">
                        <div 
                          className="BudgetView-Row-deletebutton"
                          onClick={()=>setShowDeleteConfirmation(item.id)}
                        >
                          Del  
                        </div>
                      </td>
                      <td className="BudgetView-Description">
                        {item.description}
                      </td>
                      <td className="BudgetView-Value">
                        £{item.value}
                      </td>
                      <td className="BudgetView-StartDate">
                        {item.startDate?.toLocaleString("en-GB")}
                      </td>
                      <td className="BudgetView-Frequency">
                        {FrequencyEnum[item.frequency]}
                      </td>
                      <td className="BudgetView-EndDate">
                        {item.endDate?.toLocaleString("en-GB")}
                      </td>
                      <td className="BudgetView-Func">
                        <Tooltip 
                          title={!!item.paid.find((a) => a === selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"})) ? "Paid" : "Unpaid"}
                          followCursor
                          placement="right" 
                          arrow
                        >
                          <ToggleButton
                            name="Paid"
                            value="check"
                            selected={!!item.paid.find((a)=> a === selectedDate.toLocaleDateString("en-GB", {month: "numeric", year: "numeric"}))}
                            color="success"
                            size="small"
                            onClick={() => handlePaidClick(item.id)}
                          >
                            <CheckIcon/>
                          </ToggleButton>
                        </Tooltip>
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
      {showDeleteConfirmation !== false && (
        <div className="BudgetView-DeleteConfirmationDialogue">
          <h2>Are you sure?</h2>
          <span>Delete item: <b>{`${budgetItems.find((item) => item.id === showDeleteConfirmation)?.description}`}</b></span>
          <div className="DeleteConfirmationDialogue-OptionsContainer">
            <button onClick={()=>setShowDeleteConfirmation(false)}>Cancel</button>
            <button onClick={()=>handleDeleteOne(showDeleteConfirmation)}>This One</button>
            <button onClick={()=>handleDeleteFuture(showDeleteConfirmation)}>All Future</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
