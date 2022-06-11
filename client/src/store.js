import { configureStore } from "@reduxjs/toolkit"

import inventoryReducer from './features/inventorySlice'
import storeReducer from './features/storeSlice'
import storeInvReducer from './features/storeInventorySlice'
import storeTrnscReducer from './features/storeTransactionSlice'
import invTransferReducer from './features/inventoryTransferSlice'
import adminReducer from './features/adminSlice'
import employeeReducer from './features/employeeSlice'

const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        store: storeReducer,
        storeInv: storeInvReducer,
        storeTrnsc: storeTrnscReducer,
        invTransfer: invTransferReducer,
        admin: adminReducer,
        employee: employeeReducer,
    }
})
export default store