import {useState, useEffect, useReducer} from 'react'
import {api, errorHandler, getResFilters, getQueryString, formatNum} from '../../Utils.js'
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
    const [searchedInv, setSearchedInv] = useState([])
    const [modalShown, setModalShown] = useState(false)
    const [invName, setInvName] = useState('')

    useEffect(() => {
        if(stores === null){ getStores() }
    }, [])     

    const getStores = () => {
        api.get(`/stores`)
           .then(response => { setStores(response.data.stores) })
           .catch(error => { errorHandler(error) })        
    }
    const getInv = () => {
        api.get(`/inventories?name=${invName}`)
           .then(response => {
                setSearchedInv(response.data.inventories)     
           })
           .catch(error => { 
                errorHandler(error) 
           })        
    }
    const storeInvs = () => {
        console.log(addedInvs)
    }
    // When the stores is not set yet return loading UI
    if(stores === null){
        return 'Loading...'
    }     
    return (<>
        <Grid num_of_columns={1} items={(() => {
            const items = addedInvs.map((inventory, key) => (
                <ToolCard key={key} heading={inventory.name} expand={inventory.toolCardExpand}
                    body={inventory.sizes.length ? <Grid
                        num_of_columns={4} items={inventory.sizes.map((size, sizeKey) => (
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
                <SelectAddon addon={'Select store'}
                    options={stores.map(store => ({
                        value: store.id, text: store.name
                    }))}
                    formAttr={{onClick: (e) => { setStoreId(e.target.value) }}}
                />                
            )
            // Add select inventory btn at the end
            items.push([
                <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1.4rem auto'}} 
                onClick={() => {setModalShown(true)}}>
                    + Add Inventory
                </button>,       
                <Button size={'md'} text={'Store inventories'} attr={{
                    onClick: storeInvs
                }} />                         
            ])
            return items
        })()}/>    
        <Modal
            heading={'Search Inventories'}
            body={<>
                <div className='flex-row items-center'>
                    <TextInput size={'sm'} containerAttr={{style: {width: '100%', marginRight: '2rem'}}} 
                        iconName={'search'}
                        formAttr={{value: invName, placeholder: 'Search inventory', onChange: (e) => {
                            setInvName(e.target.value)
                        }}} 
                    />   
                    <Button size={'sm'} text={'Search'} attr={{disabled: disableBtn,
                        style: {flexShrink: '0'},
                        onClick: () => {getInv()}
                    }}/>                                       
                </div>
                <Table
                    headings={['Name', '']}
                    body={searchedInv.map(inv => ([
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