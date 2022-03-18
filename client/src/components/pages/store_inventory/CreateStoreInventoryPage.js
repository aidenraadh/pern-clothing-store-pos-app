import {useState, useEffect} from 'react'
import {api, errorHandler, getResFilters, getQueryString, formatNum} from '../../Utils.js'
import {Button} from '../../Buttons'
import {TextInput, Select} from '../../Forms'
import {ToolCard} from '../../Cards'
import {Modal, ConfirmPopup} from '../../Windows'
import {Grid} from '../../Layouts'
import Table from '../../Table'

function CreateStoreInventoryPage(props){
    const [disableBtn , setDisableBtn] = useState(false)
    const [stores, setStores] = useState(null)
    const [storeId, setStoreId] = useState('')
    const [selectedInv, setSelectedInv] = useState([])
    const [searchedInv, setSearchedInv] = useState([])
    const [modalShown, setModalShown] = useState(false)
    const [invName, setInvName] = useState('')

    useEffect(() => {
        if(stores === null){ getStores() }
    }, [])    

    useEffect(() => {
    }, [selectedInv])      

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
    // When the stores is not set yet return loading UI
    if(stores === null){
        return 'Loading...'
    }     
    return (<>
        <Select
            options={stores.map(store => ({
                value: store.id, text: store.name
            }))}
            formAttr={{onClick: (e) => { setStoreId(e.target.value) }}}
        />
        <Grid num_of_columns={1} items={selectedInv.map((inventory, key) => ([
            <ToolCard key={key} heading={inventory.name} expand={inventory.toolCardExpand}
                body={<Table
                    headings={inventory.sizes.map(size => size.name)}
                />}            
                toggleButton={<Button
                    size={'sm'} type={'light'} color={'blue'}                
                    iconName={'angle_up'} iconOnly={true}
                    classes={'toggle-btn'}
                    attr={{
                        onClick: () => {setSelectedInv(state => {
                            const invs = [...state]
                            invs[key] = {...invs[key], toolCardExpand: !invs[key].toolCardExpand}
                            return invs                         
                        })}
                    }}
                />}
                rightSideActions={<Button
                    size={'sm'} type={'light'} color={'red'}  
                    iconName={'close'} iconOnly={true}   
                    attr={{
                        onClick: () => {setSelectedInv(state => {
                            const invs = [...state]
                            invs.splice(key, 1)
                            return invs                         
                        })}
                    }}                                     
                />}
            />
        ]))}/>
        <button type="button" className='text-blue block' style={{fontSize: '1.46rem', margin: '1.4rem auto'}} 
        onClick={() => {setModalShown(true)}}>
            + Add Inventory
        </button>         
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
                            setSelectedInv(state => {
                                const invs = [...state]
                                invs.push({
                                    id: inv.id, name: inv.name, toolCardExpand: false, 
                                    sizes: inv.sizes.map(size => ({
                                        name: size.name, amount: '', inventory_size_id: size.id
                                    }))
                                })
                                return invs
                            })                           
                        }}}/>
                    ]))}
                />
            </>}        
            shown={modalShown}
            toggleModal={() => {setModalShown(state => !state)}}
        />           
    </>)
}

export default CreateStoreInventoryPage