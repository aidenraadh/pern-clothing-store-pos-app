import {useState, useEffect, useReducer, useCallback} from 'react'
import {api, errorHandler, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, SelectAddon} from '../../Forms'
import {ToolCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'

function CreateStoreInventoryPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    const [storeId, setStoreId] = useState('')
    const [addedInvs, dispatchAddedInvs] = useReducer(addedInvsReducer, [])
    const [searchedInvs, setSearchedInvs] = useState([])
    const [modalShown, setModalShown] = useState(false)
    const [invName, setInvName] = useState('')
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')
    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')    

    useEffect(() => {
        if(stores === null){ getStores() }
    }, [])     

    const getStores = useCallback(() => {
        api.get(`/stores`)
           .then(response => {
               const stores = response.data.stores
               setStores(stores)
               setStoreId(stores[0] ? stores[0].id : null)
            })
           .catch(error => { errorHandler(error) })        
    }, [])

    const getInvs = useCallback(() => {
        api.get(`/inventories?name=${invName}&limit=20`)
           .then(response => {
                setSearchedInvs(response.data.inventories)     
           })
           .catch(error => { 
                errorHandler(error) 
           })        
    }, [invName])

    const storeInvs = useCallback(() => {
        api.post(`/store-inventories`, {
                stored_invs: JSON.stringify(addedInvs),
                store_id: storeId
            })
           .then(response => {
                setSuccPopupMsg(<>
                    <p>
                        Storing inventories: {response.data.storeInvs.length} success, {response.data.alrStoredInvs.length} failed
                    </p>
                    <ul style={{textAlign: 'left', listStylePosition: 'inside', marginTop: '2rem'}}>
                        {response.data.alrStoredInvs.map(inv => (
                            <li>{inv.inventory.name} already stored</li>
                        ))}
                    </ul>   
                </>)                  
                setSuccPopupShown(true)               
           })
           .catch(error => { 
                errorHandler(error, {'400': () => {
                    setErrPopupShown(true)
                    setErrPopupMsg(error.response.data.message)                
                }})                  
           })          
    }, [storeId, addedInvs])
    // When the stores is not set yet return loading UI
    if(stores === null){
        return 'Loading...'
    }     
    return (<>
        <Grid num_of_columns={1} items={(() => {
            const items = addedInvs.map((inventory, key) => (
                <ToolCard key={key} heading={inventory.name} expand={inventory.toolCardExpand}
                    body={inventory.sizes.length ? 
                    <Grid num_of_columns={4} 
                        items={inventory.sizes.map((size, sizeKey) => (
                            <TextInput key={sizeKey} label={`Amount ${size.name}`} size={'sm'} formAttr={{
                                value: formatNum(size.amount),
                                onChange: (e) => {
                                    dispatchAddedInvs({
                                        type: 'update', payload: {
                                            index: key, sizeIndex: sizeKey, amount: formatNum(
                                                e.target.value, true
                                            )
                                        }
                                    })
                                }
                            }}/>
                        ))}
                    /> : 'No sizes found'}           
                    toggleButton={<Button
                        size={'sm'} type={'light'} color={'blue'}                
                        iconName={'angle_up'} iconOnly={true}
                        classes={'toggle-btn'}
                        attr={{
                            onClick: () => {dispatchAddedInvs({type: 'update', payload: {
                                index: key, toolCardExpand: ''
                            }})}
                        }}
                    />}
                    rightSideActions={<Button
                        size={'sm'} type={'light'} color={'red'}  
                        iconName={'close'} iconOnly={true}   
                        attr={{
                            onClick: () => {dispatchAddedInvs({type: 'remove', payload: {
                                index: key
                            }})}
                        }}                                     
                    />}
                />
            ))
            // Add select store form at the beginning
            items.unshift(
                <SelectAddon key={'x'} addon={'Select store'}
                    options={stores.map(store => ({
                        value: store.id, text: store.name
                    }))}
                    formAttr={{onChange: (e) => { setStoreId(e.target.value) }}}
                />                
            )
            // Add select inventory btn at the end
            items.push(
                <button key={'y'} type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1.4rem auto'}} 
                onClick={() => {setModalShown(true)}}>
                    + Add Inventory
                </button>                       
            )
            items.push(    
                <div key={'s'} style={{height: '0.1rem', backgroundColor: '#D9D9D9'}}></div>,                      
            )
            items.push(
                <Button key={'z'} size={'md'} text={'Store inventories'} attr={{
                    onClick: storeInvs
                }} />                         
            )                        
            return items
        })()}/>    
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
                    body={searchedInvs.map(inv => ([
                        inv.name,
                        <Button size={'sm'} text={'Select'} attr={{onClick: () => {
                            dispatchAddedInvs({type: 'add', payload: {inv: inv}})
                        }}}/>
                    ]))}
                />
            </>}        
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
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
        <ConfirmPopup
            shown={errPopupShown}
            icon={'error_circle'}
            iconColor={'red'}
            title={"Can't Proceed"}
            body={popupErrMsg}
            confirmText={'OK'}
            togglePopup={() => {setErrPopupShown(state => !state)}} 
        />              
    </>)
}

const addedInvsReducer = (state, action) => {
    const payload = action.payload
    switch(action.type){
        case 'add': return [...state, {
                id: payload.inv.id, name: payload.inv.name, toolCardExpand: true, 
                sizes: payload.inv.sizes.map(size => ({
                    id: size.id, name: size.name, amount: '',
                }))
            }]; 
        case 'remove': return (() => {
                let addedInvs = [...state]
                addedInvs.splice(payload.index, 1)
                return addedInvs
            })()
        case 'update': return (() => {
                let addedInvs = [...state]
                // Update the tool card's toggle expand 
                if(payload.toolCardExpand !== undefined){
                    addedInvs[payload.index] = {
                        ...addedInvs[payload.index], 
                        toolCardExpand: !addedInvs[payload.index].toolCardExpand
                    }
                }
                // Update the amount of size
                else if(payload.amount !== undefined){
                    addedInvs = [...state]

                    let updatedSizes = [...addedInvs[payload.index].sizes]
                    updatedSizes[payload.sizeIndex] = {
                        ...updatedSizes[payload.sizeIndex], amount: payload.amount
                    }

                    addedInvs[payload.index] = {
                        ...addedInvs[payload.index], 
                        sizes: updatedSizes
                    }                    
                }
                return addedInvs
            })()
        default: return [...state];
    }
}

export default CreateStoreInventoryPage