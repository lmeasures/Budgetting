db = db.getSiblingDB("BudgetData")

db.createUser({
    user: 'admin',
    pwd: 'password',
    roles: [
        {
            role: 'readWrite',
            db: 'BudgetData',
        }
    ]
})

db.createCollection('data')

//TODO DB wants setting up
//TODO API wants hooking up to DB
//TODO frontend needs to get data from API&DB

// db.data.insertMany([
//     {
//         description: "description string",
//         value: "23.42",
//         startDate: 
//     }
// ])

// {
//     id: number,
//     description: string | undefined,
//     value: string | undefined,
//     startDate: Date | string | undefined,
//     frequency: number,
//     endDate: Date | string | undefined,
//     paid: Array<string>,
//   }