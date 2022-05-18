import {useState, useEffect, useReducer, useCallback, useMemo} from 'react'
import {api, errorHandler, keyHandler, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select, TextInputWithBtn} from '../../Forms'
import {SimpleCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'
import SVGIcons from '../../SVGIcons'
import {format} from 'date-fns'

function CreateInventoryTransferPage({user}){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    const [transferDate, setTransferDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [originStoreId, setOriginStoreId] = useState('')
    const [destinationStoreId, setDestinationStoreId] = useState('')
    const [addedInvs, dispatchAddedInvs] = useReducer(addedInvsReducer, [])
    /* Search store inventories */
    const [invName, setInvName] = useState('')
    const [searchedStoreInvs, setSearchedStoreInvs] = useState([])
    const [modalShown, setModalShown] = useState(false) 
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')   
    const [popupErrConfirmCallback, setPopupErrConfirmCallback] = useState(() => {})
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')     

    const getCreateData = useCallback(() => {
        api.get(`/inventory-transfers/create`)
           .then(response => {
               // When the received stores is more than one
               if(response.data.stores.length > 1){
                   setOriginStoreId(response.data.stores[0].id)
                   setDestinationStoreId(response.data.stores[1].id)
                   setStores(response.data.stores)                   
               }
               else{
                   setErrPopupMsg('You must at least have two stores to do inventory transfer')
                   setPopupErrConfirmCallback(() => {window.history.back()})
                   setErrPopupShown(true)
               }
            })
           .catch(error => { errorHandler(error)  })
    }, []) 

    const getInvs = useCallback(() => {
        setDisableBtn(true)
        api.get(`/store-inventories?name=${invName}&store_id=${originStoreId}&limit=20`)
           .then(response => {
                setSearchedStoreInvs(response.data.storeInvs.map(storeInv => {
                    return {
                        ...storeInv, selectedSizeId: storeInv.inventory.sizes[0].id
                    }
                }))
                setDisableBtn(false) 
           })
           .catch(error => { 
                setDisableBtn(false)
                errorHandler(error) 
           })        
    }, [originStoreId, setDisableBtn, invName])    

    const AddedInvsTable = useMemo(() => {
        return addedInvs.length === 0 ? '' : 
        <Table
            headings={['Inventory', 'Size', 'Amount Transfered']}
            body={addedInvs.map((inv, key) => ([
                <span className='flex-row items-center'>
                    <button className='flex-row items-center'
                        style={{fontSize: '2.2rem', marginRight: '1rem'}}
                        onClick={() => {dispatchAddedInvs({
                            type: 'remove', payload: {index: key}
                        })}}
                    >
                        <SVGIcons color={'red'} name={'error_circle'}
                        />
                    </button>
                    <span className='text-capitalize'>
                        {inv.inventoryName}
                    </span>
                </span>,
                <span className='text-uppercase'>
                    {inv.sizeName}
                </span>,
                <span className='flex-row items-center'>
                    <TextInputWithBtn size={'sm'} containerAttr={{style: {minWidth: '10rem'}}}
                        formAttr={{value: formatNum(inv.amount),
                            style: {width: '100%'},
                            onChange: (e) => {
                                dispatchAddedInvs({
                                    type: 'update', payload: {
                                        index: key, key: 'amount', 
                                        value: e.target.value
                                    }
                                })
                            }
                        }}
                        btnAttr={{onClick: () => {
                            dispatchAddedInvs({
                                type: 'update', payload: {
                                    index: key, key: 'amount',
                                    value: inv.originalAmount
                                }
                            })                                    
                        }}}
                    />
                    <span className={inv.amountLeft < 0 ? 'text-red' : 'text-dark-50'} 
                    style={{fontSize: '1.34rem', marginLeft: '0.6rem', flexShrink: 0}}>
                        {`/ ${inv.amountLeft}`}
                    </span>
                </span>,                
            ]))}
        />            
    }, [addedInvs, dispatchAddedInvs])    
    
    const storeInvTransfers = useCallback(() => {
        setDisableBtn(true)
        api.post(`/inventory-transfers`, {
            originStoreId: originStoreId,
            destinationStoreId: destinationStoreId,
            transferDate: transferDate,
            transferedInvs: addedInvs,
        })
        .then(response => {
            setDisableBtn(false)
            setSuccPopupMsg(response.data.message)
            setSuccPopupShown(true)
        })
        .catch(error => {
            setDisableBtn(false)
            errorHandler(error, {'400': () => {
                setErrPopupShown(true)
                setErrPopupMsg(error.response.data.message)                      
            }})             
        })
    }, [addedInvs, originStoreId, destinationStoreId, transferDate])

    useEffect(() => {
        if(stores === null){ getCreateData() }
    }, [stores, getCreateData])        
    
    // Whenever origin store ID changed, reset the transfered inventories
    useEffect(() => {
        dispatchAddedInvs({type: 'reset'})
        setSearchedStoreInvs([])
    }, [originStoreId])           

    // When the invTransfer resource is not set yet
    // Return loading UI
    if(stores === null){
        return 'Loading...'
    }    
    return (<>
        <SimpleCard
            heading={'Transfer Inventory'}
            body={<>
                <Grid numOfColumns={3} items={[
                    <Select label={'Origin Store'}
                        formAttr={{
                            value: originStoreId, onChange: (e) => {
                                setOriginStoreId(e.target.value)
                            }
                        }}
                        options={stores.map(store => ({
                            value: store.id, text: (store.name.charAt(0).toUpperCase() + store.name.slice(1))
                        }))}
                    />,
                    <Select label={'Destination Store'}
                        formAttr={{
                            value: destinationStoreId, onChange: (e) => {
                                setDestinationStoreId(e.target.value)
                            }
                        }}
                        options={stores.map(store => ({
                            value: store.id, text: (store.name.charAt(0).toUpperCase() + store.name.slice(1))
                        }))}
                    />,      
                    <TextInput label={'Transfer date'}
                        formAttr={{
                            type: 'date', value: transferDate,
                            onChange: (e) => {setTransferDate(e.target.value)}
                        }}
                    />              
                ]}/>
                {AddedInvsTable}      
                <button key={'a'} type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1.4rem auto'}} 
                onClick={() => {setModalShown(true)}}>
                    + Add Inventory
                </button>               
            </>}
            footer={
                <Button text={'Save changes'} attr={{
                    disabled: disableBtn,
                    onClick: storeInvTransfers}}
                />
            }
        />
        <Modal
            heading={'Search Inventories'}
            body={<>
                <div className='flex-row items-center'>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: invName, placeholder: 'Search inventory', 
                            onChange: (e) => {
                                setInvName(e.target.value)
                            },
                            onKeyUp: (e) => {keyHandler(e, 'Enter', getInvs)}
                        }} 
                    />   
                    <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getInvs()}
                    }}/>                                       
                </div>
                {
                    searchedStoreInvs.length === 0 ? '' :
                    <Table
                        headings={['Name', 'Size', '']}
                        body={searchedStoreInvs.map((searchedStoreInv, index) => ([
                            <span className='text-capitalize'>{searchedStoreInv.inventory.name}</span>,
                            <Select
                                options={
                                    searchedStoreInv.inventory.sizes.filter(size => (
                                        // Filter only the size that already stored
                                        searchedStoreInv.sizes.find(storedSize => (
                                            parseInt(size.id) === parseInt(storedSize.inventory_size_id)
                                        ))
                                    )).map(size => ({
                                        value: size.id, text: size.name.toUpperCase()
                                    }))
                                }
                                formAttr={{
                                    value: searchedStoreInv.selectedSizeId,
                                    onChange: (e) => {setSearchedStoreInvs(state => {
                                        const storeInvs = [...state]
                                        storeInvs[index] = {...storeInvs[index], selectedSizeId: e.target.value}
                                        return storeInvs
                                    })}
                                }}
                            />,
                            <Button size={'sm'} text={'Select'} attr={{onClick: () => {
                                dispatchAddedInvs({type: 'add', payload: {storeInv: searchedStoreInv}})
                            }}}/>
                        ]))}
                    />                    
                }
            </>}        
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
        />            
        <ConfirmPopup
            shown={errPopupShown}
            icon={'error_circle'}
            iconColor={'red'}
            title={"Can't Proceed"}
            body={popupErrMsg}
            confirmText={'OK'}
            togglePopup={() => {setErrPopupShown(state => !state)}} 
            confirmCallback={popupErrConfirmCallback}
        />         
        <ConfirmPopup
            shown={succPopupShown}
            icon={'done_circle'}
            iconColor={'blue'}
            title={"Success"}
            body={popupSuccMsg}
            togglePopup={() => {setSuccPopupShown(state => !state)}} 
            confirmText={'Transfer again'}
            cancelText={'View transfer'}
            cancelBtnColor={'blue'}            
            confirmCallback={() => {
                // Refresh the page
                window.location.reload()                
            }}
            cancelCallback={() => {
                const host = window.location.origin
                window.location.href = `${host}/inventory-transfers`
            }}            
        />           
    </>)
}

const addedInvsReducer = (state, action) => {
    const payload = action.payload
    let addedInvs = [...state]

    switch(action.type){
        case 'add':
            // If the inventory exists, return the previous state
            const isInvExists = addedInvs.find(inv => (
                parseInt(inv.inventorySizeId) === parseInt(payload.storeInv.selectedSizeId)
            ))
            if(isInvExists){ return addedInvs }
            // If the stored inventory is not exists, return the previous state
            const storedInvSize = payload.storeInv.sizes.find(size => (
                parseInt(size.inventory_size_id) === parseInt(payload.storeInv.selectedSizeId)
            ))
            if(!storedInvSize){ return addedInvs }

            const invSize = payload.storeInv.inventory.sizes.find((size) => (
                parseInt(size.id) === parseInt(payload.storeInv.selectedSizeId)
            ))
            return [
                ...addedInvs, {
                    storeInvId: payload.storeInv.id, 
                    storeInvSizeId: storedInvSize.id,
                    inventoryId: payload.storeInv.inventory.id,
                    inventorySizeId: invSize.id,
                    inventoryName: payload.storeInv.inventory.name,
                    sizeName: invSize.name,
                    amount: '',
                    amountLeft: storedInvSize.amount,
                    amountStored: storedInvSize.amount,                    
                }
            ]
        case 'remove': 
            addedInvs.splice(payload.index, 1);
            return addedInvs;   
        case 'update': 
            // Update the tool card's toggle expand 
            if(payload.key === 'expand'){
                addedInvs[payload.index] = {
                    ...addedInvs[payload.index], 
                    toolCardExpand: !addedInvs[payload.index].toolCardExpand
                }
            }
            // Update the amount of size
            else if(payload.key === 'amount'){
                const value = formatNum(payload.value, true)
                // Update the size
                addedInvs[payload.index][payload.key] = value
                // If the updated props is 'amount', update also the 'amountLeft'
                if(payload.key === 'amount'){
                    addedInvs[payload.index].amountLeft = (
                        addedInvs[payload.index].amountStored - value
                    )
                }                  
            }
            return addedInvs       
        case 'reset': 
            return []              
        default: throw new Error();
    }
}

export default CreateInventoryTransferPage