import {useState, useReducer, useCallback, useMemo} from 'react'
import {api, errorHandler, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import Table from '../../Table'
import {TextInput, TextInputWithBtn} from '../../Forms'
import {ToolCard} from '../../Cards'
import {Grid} from '../../Layouts'
import {Modal, ConfirmPopup} from '../../Windows'

function CreateStoreTransactionPage(){
    const [disableBtn , setDisableBtn] = useState(false)
    const [addedStoreInvs, dispatchAddedInvs] = useReducer(addedInvsReducer, [])
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
                setSearchedStoreInvs(response.data.storeInvs)
                setDisableBtn(false) 
           })
           .catch(error => { 
                setDisableBtn(false)
                errorHandler(error) 
           })        
    }, [invName, setDisableBtn])

    const storeTransaction = () => {
        console.log(addedStoreInvs)
    }

    const InvToolCards = useMemo(() => {
        return addedStoreInvs.map((storeInv, key) => (
            <ToolCard key={key} heading={storeInv.inventory.name} expand={storeInv.toolCardExpand}
                body={storeInv.purchasedSizes.length === 0 ? 
                    <p className='text-center'>No sizes found</p> :
                    <Table
                        headings={['Size', 'Amount', 'Price']}
                        body={storeInv.purchasedSizes.map((size, sizeKey) => ([
                            size.name,
                            <span className='flex-row flex-inline items-center' style={{width: '100%'}}>
                                <TextInputWithBtn key={sizeKey} size={'sm'} containerAttr={{style: {width: '100%'}}}
                                    formAttr={{value: formatNum(size.amount),
                                        style: {width: '100%'},
                                        onChange: (e) => {
                                            dispatchAddedInvs({
                                                type: 'update', payload: {index: key, sizeIndex: sizeKey, 
                                                    keyName: 'amount', 
                                                    value: e.target.value
                                                }
                                            })
                                        }
                                    }}
                                    btnAttr={{onClick: () => {
                                        dispatchAddedInvs({
                                            type: 'update', payload: {index: key, sizeIndex: sizeKey, 
                                                keyName: 'amount',
                                                value: size.originalAmount
                                            }
                                        })                                    
                                    }}}
                                />
                                <span className={size.amountLeft - size.amount < 0 ? 'text-red' : 'text-dark-50'} 
                                style={{fontSize: '1.32rem', paddingLeft: '0.6rem', flexShrink: 0}}>
                                <span>{
                                        `/ ${size.amountLeft - size.amount}`
                                    }</span>
                                </span>
                            </span>,
                            <TextInputWithBtn key={sizeKey} size={'sm'} formAttr={{value: formatNum(size.cost),
                                    onChange: (e) => {
                                        dispatchAddedInvs({
                                            type: 'update', payload: {index: key, sizeIndex: sizeKey, 
                                                keyName: 'cost',
                                                value: e.target.value
                                            }
                                        })
                                    }
                                }}
                                btnAttr={{onClick: () => {
                                    dispatchAddedInvs({
                                        type: 'update', payload: {index: key, sizeIndex: sizeKey, 
                                            keyName: 'cost',
                                            value: size.originalCost
                                        }
                                    })                                    
                                }}}
                            />                              
                        ]))}
                    />
                }           
                toggleButton={
                    <Button
                        size={'sm'} type={'light'} color={'blue'}                
                        iconName={'angle_up'} iconOnly={true}
                        classes={'toggle-btn'}
                        attr={{
                            onClick: () => {dispatchAddedInvs({type: 'update', payload: {
                                index: key, keyName: 'expand'
                            }})}
                        }}
                    />
                }
                rightSideActions={
                    <Button
                        size={'sm'} type={'light'} color={'red'}  
                        iconName={'close'} iconOnly={true}   
                        attr={{
                            onClick: () => {dispatchAddedInvs({type: 'remove', payload: {
                                index: key
                            }})}
                        }}                                     
                    />
                }
            />            
        ))        
    }, [addedStoreInvs, dispatchAddedInvs])    

    return (<>
        <Grid num_of_columns={1} items={[
                ...InvToolCards,
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
                    headings={['Name', '']}
                    body={searchedStoreInvs.map(searchedStoreInv => ([
                        searchedStoreInv.inventory.name,
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
    switch(action.type){
        case 'add': return [...state, {
                ...payload.storeInv, toolCardExpand: true, 
                purchasedSizes: payload.storeInv.inventory.sizes.map((size, key) => {
                    // Make sure the size that want to be purchased is exists
                    const existingSize = payload.storeInv.sizes.find((storedSize) => {
                        return parseInt(storedSize.inventory_size_id) === parseInt(size.id)
                    })
                    return {
                        name: size.name,
                        inventorySizeId: existingSize.inventory_size_id,
                        amount: '',
                        originalAmount: '',
                        cost: size.selling_price,
                        originalCost: size.selling_price,
                        amountLeft: existingSize.amount
                    }
                })
            }]; 
        case 'remove': return (() => {
                let addedStoreInvs = [...state]
                addedStoreInvs.splice(payload.index, 1)
                return addedStoreInvs
            })()
        case 'update': return (() => {
                let addedStoreInvs = [...state]
                // Update the tool card's toggle expand 
                if(payload.keyName === 'expand'){
                    addedStoreInvs[payload.index] = {
                        ...addedStoreInvs[payload.index], 
                        toolCardExpand: !addedStoreInvs[payload.index].toolCardExpand
                    }
                }
                // Update the amount of size
                else if(payload.keyName === 'amount' || payload.keyName === 'cost'){
                    const value = formatNum(payload.value, true)
                    addedStoreInvs = [...state]

                    let updatedSizes = [...addedStoreInvs[payload.index].purchasedSizes]
                    updatedSizes[payload.sizeIndex] = {
                        ...updatedSizes[payload.sizeIndex], [payload.keyName]: value
                    }

                    addedStoreInvs[payload.index] = {
                        ...addedStoreInvs[payload.index], 
                        purchasedSizes: updatedSizes
                    }                    
                }
                return addedStoreInvs
            })()
        default: return [...state];
    }
}

export default CreateStoreTransactionPage
