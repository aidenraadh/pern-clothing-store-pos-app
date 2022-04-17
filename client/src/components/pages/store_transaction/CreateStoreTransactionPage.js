import {useState, useReducer, useCallback, useMemo} from 'react'
import {api, errorHandler, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import Table from '../../Table'
import {TextInput, TextInputWithBtn, Select} from '../../Forms'
import {PlainCard} from '../../Cards'
import {Grid} from '../../Layouts'
import {Modal, ConfirmPopup} from '../../Windows'

function CreateStoreTransactionPage(){
    const [disableBtn , setDisableBtn] = useState(false)
    const [addedInvs, dispatchAddedInvs] = useReducer(addedInvsReducer, [])
    const [invName, setInvName] = useState('')
    const [searchedStoreInvs, setSearchedStoreInvs] = useState([])
    const [modalShown, setModalShown] = useState(false)    
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')    
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')     
    
    const getInvs = useCallback(() => {
        setDisableBtn(true)
        api.get(`/store-inventories?name=${invName}&limit=20`)
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
    }, [invName, setDisableBtn])

    const storeTransaction = () => {
        console.log(addedInvs)
        // setDisableBtn(true)
        // api.post(`/store-transactions`, {
        //     purchased_invs: JSON.stringify(addedInvs)
        // })
        // .then(response => {
        //      setDisableBtn(false) 
        // })
        // .catch(error => { 
        //      setDisableBtn(false)
        //      errorHandler(error) 
        // })         
    }

    const AddedInvsTable = useMemo(() => {
        return <PlainCard
            body={
                <Table
                    headings={['Inventory', 'Size', 'Amount', 'Price']}
                    body={addedInvs.map((inv, key) => ([
                        inv.inventoryName, inv.sizeName,
                        <span className='flex-row items-center flex-inline' style={{width: '100%'}}>
                            <TextInputWithBtn size={'sm'} containerAttr={{style: {width: '100%'}}}
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
                        <TextInputWithBtn key={key} size={'sm'} formAttr={{value: formatNum(inv.cost),
                                onChange: (e) => {
                                    dispatchAddedInvs({
                                        type: 'update', payload: {
                                            index: key, key: 'cost',
                                            value: e.target.value
                                        }
                                    })
                                }
                            }}
                            btnAttr={{onClick: () => {
                                dispatchAddedInvs({
                                    type: 'update', payload: {
                                        index: key, key: 'cost',
                                        value: inv.originalCost
                                    }
                                })                                    
                            }}}
                        />                  
                    ]))}
                />  
            }
        />     
    }, [addedInvs, dispatchAddedInvs])    

    return (<>
        <Grid num_of_columns={1} items={[
                AddedInvsTable,
                <button key={'a'} type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1.4rem auto'}} 
                onClick={() => {setModalShown(true)}}>
                    + Add Inventory
                </button>,        
                <div key={'b'} style={{height: '0.1rem', backgroundColor: '#D9D9D9'}}></div>, 
                <Button key={'c'} size={'md'} text={'Create transaction'} attr={{
                    onClick: storeTransaction
                }}/>                   
            ]}
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
                <Table
                    headings={['Name', 'Size', '']}
                    body={searchedStoreInvs.map((searchedStoreInv, index) => ([
                        searchedStoreInv.inventory.name,
                        <Select
                            options={
                                searchedStoreInv.inventory.sizes.filter(size => (
                                    // Filter only the size that already stored
                                    searchedStoreInv.sizes.find(storedSize => (
                                        parseInt(size.id) === parseInt(storedSize.inventory_size_id)
                                    ))
                                )).map(size => ({
                                    value: size.id, text: size.name
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
        />
        <ConfirmPopup
            shown={succPopupShown}
            icon={'done_circle'}
            iconColor={'blue'}
            title={"Success"}
            body={popupSuccMsg}
            confirmText={'OK'}
            togglePopup={() => {setSuccPopupShown(state => !state)}} 
        />                  
    </>)
}

const addedInvsReducer = (state, action) => {
    const payload = action.payload
    let addedInvs = [...state]

    switch(action.type){
        case 'add':
            const isInvExists = addedInvs.find(inv => (
                parseInt(inv.sizeId) === parseInt(payload.storeInv.selectedSizeId)
            ))
            if(isInvExists){ return addedInvs }
            const invSize = payload.storeInv.inventory.sizes.find((size) => (
                parseInt(size.id) === parseInt(payload.storeInv.selectedSizeId)
            ))
            const storedInvSize = payload.storeInv.sizes.find(size => (
                parseInt(size.inventory_size_id) === parseInt(payload.storeInv.selectedSizeId)
            ))
            return [
                ...addedInvs, {
                    storeInvId: payload.storeInv.id, 
                    inventoryId: payload.storeInv.inventory.id,
                    inventoryName: payload.storeInv.inventory.name,
                    store: payload.storeInv.store, 
                    toolCardExpand: true,         
                    storeInvSizeId: storedInvSize.id,
                    sizeName: invSize.name,
                    sizeId: invSize.id,
                    amount: '',
                    originalAmount: '',
                    cost: invSize.selling_price,
                    originalCost: invSize.selling_price,
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
            else if(payload.key === 'amount' || payload.key === 'cost'){
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
        default: throw new Error();
    }
}

export default CreateStoreTransactionPage
