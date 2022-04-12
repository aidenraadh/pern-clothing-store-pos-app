import {useState, useEffect, useReducer, useCallback} from 'react'
import {api, errorHandler, getResFilters, getQueryString, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'

function IndexStoreTransactionPage(props){
    const [disableBtn , setDisableBtn] = useState(false)  

    useEffect(() => {
        // if(props.store.stores === null){
        //     getStores(STORE_ACTIONS.RESET)
        // }
    }, [])


    if(props.storeTrnsc.storeTrnscs === null){
        return 'Loading...'
    }    
    return (<>      
    </>)
}


export default IndexStoreTransactionPage