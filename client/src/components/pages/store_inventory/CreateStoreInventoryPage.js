import {useState, useEffect, useReducer, useCallback, useMemo} from 'react'
import {api, errorHandler, formatNum, keyHandler} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, SelectAddon} from '../../Forms'
import {ToolCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'
import SVGIcons from '../../SVGIcons.js'

function CreateStoreInventoryPage({loc}){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    const [storeId, setStoreId] = useState('')
    const [storeName, setStoreName] = useState('')
    const [addedInvs, dispatchAddedInvs] = useReducer(addedInvsReducer, [])
    // Search inventories
    const [searchedInvs, setSearchedInvs] = useState([])
    const [modalShown, setModalShown] = useState(false)
    const [invName, setInvName] = useState('')    
    const maxInvShown = useMemo(() => (30), [])
    /* Error Popup */
    const [errPopupShown, setErrPopupShown] = useState(false)
    const [popupErrMsg, setErrPopupMsg] = useState('')
    const [popupErrCallback, setPopupErrCallback] = useState(() => (
        () => {}
    ))

    /* Success Popup */
    const [succPopupShown, setSuccPopupShown] = useState(false)
    const [popupSuccMsg, setSuccPopupMsg] = useState('')      

    const getStores = useCallback(() => {
        api.get(`/store-inventories/create`)
           .then(response => {
               const stores = response.data.stores
               if(stores.length){
                   setStores(stores)
                   setStoreId(stores[0].id)                   
                   setStoreName(stores[0].name)
               }
               // When there are any store found
               else{
                   setPopupErrCallback(() => (
                       () => {
                           const host = window.location.origin
                           window.location.href = `${host}/stores`                             
                       }
                   ))
                   setErrPopupMsg("You don't have any store. Create first")
                   setErrPopupShown(true)
               }
            })
           .catch(error => { errorHandler(error) })        
    }, [])

    const getInvs = useCallback(() => {
        setDisableBtn(true)
        api.get(`/inventories?name=${invName}&limit=${maxInvShown}&not_in_store=${storeId}`)
           .then(response => {
                setSearchedInvs(response.data.inventories)
                setDisableBtn(false) 
           })
           .catch(error => { 
                setDisableBtn(false)
                errorHandler(error) 
           })        
    }, [invName, maxInvShown, storeId, stores, setDisableBtn])

    const storeInvs = useCallback(() => {
        api.post(`/store-inventories`, {
                stored_invs: addedInvs,
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
                    setPopupErrCallback(() => (
                        () => {}
                    ))
                    setErrPopupMsg(error.response.data.message)                
                }})                  
           })          
    }, [storeId, stores, addedInvs])

    const AddedInvToolCards = useMemo(() => {
        return addedInvs.map((inventory, key) => (
            <ToolCard key={key} heading={inventory.name} expand={inventory.toolCardExpand}
                body={inventory.sizes.length ? 
                <Grid numOfColumns={4} 
                    items={inventory.sizes.map((size, sizeKey) => (
                        <TextInput key={sizeKey} label={`${loc.amount} ${size.name.toUpperCase()}`} size={'sm'} formAttr={{
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
                /> : loc.noSizesFound}           
                toggleButton={
                    <Button
                        size={'sm'} type={'light'} color={'blue'}                
                        iconName={'angle_up'} iconOnly={true}
                        classes={'toggle-btn'}
                        attr={{
                            onClick: () => {dispatchAddedInvs({type: 'update', payload: {
                                index: key, toolCardExpand: ''
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
    }, [addedInvs, dispatchAddedInvs])

    useEffect(() => {
        if(stores === null){ getStores() }
    }, [stores, getStores])       

    // Whenever the store ID is changed, reset addedInvs and searchedInvs
    useEffect(() => {
        setSearchedInvs([])
        dispatchAddedInvs({type: 'reset'})
    }, [storeId])


    // When the stores is not set yet return loading UI
    if(stores === null){
        return 'Loading...'
    }     
    return (<>
        <Grid numOfColumns={1} items={[
            <SelectAddon key={'a'} addon={loc.selectStore}
                options={stores.map(store => ({
                    value: store.id, text: store.name
                }))}
                formAttr={{
                    value: storeId,
                    onChange: (e) => {
                        setStoreName(
                            stores.find(store => parseInt(store.id) === parseInt(e.target.value)).name
                        )
                        setStoreId(e.target.value)
                    }
                }}
            />,
            ...AddedInvToolCards,
            <button key={'b'} type="button" className='text-blue flex-row items-center' 
            style={{fontSize: '1.46rem', margin: '1.4rem auto'}} 
            onClick={() => {setModalShown(true)}}>
                <SVGIcons name={'search'} color={'blue'} attr={{style: {fontSize: '1.24em', marginRight: '0.6rem'}}}/>
                {loc.searchInv}
            </button>,
            <div key={'c'} style={{height: '0.1rem', backgroundColor: '#D9D9D9'}}></div>,  
            <Button key={'d'} size={'md'} text={loc.storeInv} attr={{
                onClick: storeInvs
            }}/>              
        ]}/> 
        <Modal
            heading={loc.searchInv}
            body={<>
                <div className='flex-row items-center'>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: invName, placeholder: loc.searchInv, 
                            onChange: (e) => {
                                setInvName(e.target.value)
                            },
                            onKeyUp: (e) => {keyHandler(e, 'Enter', getInvs)}
                        }} 
                    />   
                    <Button size={'sm'} text={loc.search} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getInvs()}
                    }}/>                                       
                </div>
                <p className='text-dark-65' style={{fontSize: '1.36rem', marginTop: '1rem'}}>
                    {loc.searchInvMsg1}
                    <span className='text-capitalize text-blue'>
                        {` ${storeName}. `}
                    </span>
                    {`${loc.searchInvMsg2} ${maxInvShown}`}
                </p>
                {
                    searchedInvs.length === 0 ? '' :
                    <Table
                        headings={[loc.name, '']}
                        body={searchedInvs.map(inv => ([
                            <span className='text-capitalize'>{inv.name}</span>,
                            <Button size={'sm'} text={loc.addInv} attr={{onClick: () => {
                                dispatchAddedInvs({type: 'add', payload: {inv: inv}})
                            }}}/>
                        ]))}
                    />
                }
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
            cancelBtnColor={'blue'}
            confirmText={'Store new inventories'}
            cancelText={'View stored inventories'}
            togglePopup={() => {setSuccPopupShown(state => !state)}} 
            confirmCallback={() => {
                // Refresh the page
                window.location.reload()                
            }}
            cancelCallback={() => {
                const host = window.location.origin
                window.location.href = `${host}/store-inventories`
            }}            
        />            
        <ConfirmPopup
            shown={errPopupShown}
            icon={'error_circle'}
            iconColor={'red'}
            title={"Can't Proceed"}
            body={popupErrMsg}
            confirmText={'OK'}
            confirmCallback={popupErrCallback}
            togglePopup={() => {setErrPopupShown(state => !state)}} 
        />              
    </>)
}

const addedInvsReducer = (state, action) => {
    const payload = action.payload
    switch(action.type){
        case 'add': return (() => {
            const isInvExist = state.find(inv => (
                parseInt(inv.id) === parseInt(payload.inv.id)
            ))
            if(isInvExist){
                return state
            }
            return [...state, {
                id: payload.inv.id, name: payload.inv.name, toolCardExpand: true, 
                sizes: payload.inv.sizes.map(size => ({
                    id: size.id, name: size.name, amount: '',
                }))
            }]; 
        })()
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
        case 'reset': return []

        default: throw new Error();
    }
}

export default CreateStoreInventoryPage