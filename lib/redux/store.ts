/** Redux store setup for shared app state. */
import { configureStore } from '@reduxjs/toolkit'

import { inventoryReducer } from '@/lib/redux/slices/inventory-slice'
import { schedulingReducer } from '@/lib/redux/slices/scheduling-slice'

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    scheduling: schedulingReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
