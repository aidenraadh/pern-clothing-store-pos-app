import {formatNum} from '../../Utils.js'

function TransactionReceipt({inventories, objType}){
    const purchasedInvs = formatTransactionInvs(inventories, objType)
    // Get all inventory IDs
    const invIds = purchasedInvs.map(inv => inv.inventoryId).filter((value, index, self) => (
        self.indexOf(value) === index
    ))    
    const upperSpace1 = '2rem'
    const upperSpace2 = '1rem'
    const sideSpace1 = '1.4rem'
    let totalAmount = 0
    let totalCost = 0
    return (<>
    <div>
        {invIds.map((id, index) => {
            // Get the purchased size
            const purchasedSizes = purchasedInvs.filter(inv => ( id === inv.inventoryId ))
            return ( 
                <p key={index} style={{marginTop: (index !== 0 ? upperSpace1 : 0)}}>
                    <span className="text-capiptalize">{purchasedSizes[0].inventoryName}</span>

                    {purchasedSizes.map((purchasedSize, sizeKey) => {
                        totalAmount += purchasedSize.amount
                        totalCost += purchasedSize.amount * purchasedSize.cost

                        return (
                            <span key={sizeKey} className="flex-row items-center content-space-between" 
                            style={{padding: `${upperSpace2} ${sideSpace1} 0`, fontSize: '1.36rem'}}>
                                <span style={{flexShrink: 0}}>
                                    <span className="text-uppercase">{purchasedSize.sizeName}</span>
                                    <span style={{margin: `0 ${sideSpace1}`}}>&#10005;</span>
                                    <span>{purchasedSize.amount}</span>
                                    <span style={{margin: `0 ${sideSpace1}`}}>&#10005;</span>
                                    <span>
                                        Rp. {formatNum(purchasedSize.cost)}
                                        {
                                            purchasedSize.cost !== purchasedSize.originalCost ?
                                            <span className='text-line-through' style={{paddingLeft: `${sideSpace1}`}}>
                                                Rp. {formatNum(purchasedSize.originalCost)}
                                            </span> : ''
                                        }
                                    </span>                    
                                </span>
                                <span style={{flexShrink: 0, marginLeft: `${sideSpace1}`}}>
                                    Rp. {formatNum(purchasedSize.amount * purchasedSize.cost)}
                                </span>
                            </span>                        
                        )
                    })}
                </p>
            )
        })}
        <hr style={{margin: `${upperSpace1} 0`}}/>
        <p className='flex-row items-center content-space-between'>
            <span>Total amount:</span>
            <span>{totalAmount}</span>
        </p>
        <p className='flex-row items-center content-space-between' style={{marginTop: upperSpace2}}>
            <span>Total cost:</span>
            <span>Rp. {formatNum(totalCost)}</span>
        </p>        
    </div>
    </>)
}

const formatTransactionInvs = (items, objType) => {
    return items.map(item => {
        let data = {
            inventoryId: '', inventoryName: '', sizeName: '', amount: '', 
            cost: '', originalCost: '',
        }
        switch(objType){
            case 'plain':
                data = {...item}
                data.inventoryId = parseInt(item.inventoryId)
                data.amount = item.amount ? parseInt(item.amount) : 0
                data.cost = item.cost ? parseInt(item.cost) : 0
                data.originalCost = item.originalCost ? parseInt(item.originalCost) : 0
                break;
            case 'sequelize': 
                data.inventoryId = parseInt(item.inventory.id)
                data.inventoryName = item.inventory.name
                data.sizeName = item.size.name
                data.amount = parseInt(item.amount)
                data.cost = parseInt(item.cost / data.amount)
                data.originalCost = parseInt(item.original_cost)           
                break;
            default: throw new Error()
        }
        return data
    })
}

export default TransactionReceipt