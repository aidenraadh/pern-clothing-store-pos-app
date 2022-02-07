import {useState, useEffect} from 'react'
import {Link} from 'react-router-dom'
import {STOREINV_ACTIONS, STOREINV_FILTER_KEY} from './../../reducers/StoreInventoryReducer'
import {api, errorHandler, getResFilters, getQueryString, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import Table from '../../Table'

function CreateStoreInventoryPage(props){
    return 'asd'
}

export default CreateStoreInventoryPage