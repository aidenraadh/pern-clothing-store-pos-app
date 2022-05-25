const models = require('../../models/index')
const Inventory = models.Inventory
const InventorySize = models.InventorySize
const StoreInventory = models.StoreInventory
const StoreInventorySize = models.StoreInventorySize

exports.getStoredItemsSQL = (storeId, batch) => {
    batch = (batch * 100) - 100
    const sql =  
        'SELECT JSON_OBJECT('+
        '"item_id", items_storage.id,'+
        '"item_name", items_storage.name,'+
        '"store_id", stores.id,'+
        '"store_name", stores.name) '+
        'FROM stores INNER JOIN items_storage '+
        `ON JSON_SEARCH(JSON_KEYS(stores.items), "one", items_storage.id) IS NOT NULL AND stores.id=${storeId} `+
        `ORDER BY items_storage.id LIMIT 100 OFFSET ${batch}`
    console.log(sql)
    return sql
}

exports.getItemSizes = (storedItems) => {
    const json_object_val = []
    const store_id = storedItems[0]['store_id']
    storedItems.forEach(storedItem => {
        json_object_val.push(`"item_${storedItem.item_id}"`)
        json_object_val.push(`JSON_EXTRACT(items, "$.${storedItem.item_id}")`)
    })
    const sql = `SELECT JSON_OBJECT(${json_object_val.join(', ')}) FROM stores WHERE id=${store_id}`
    console.log(sql)
    return sql
}

exports.combineItemsAndSizes = (storedItems, storedSizes) => {
    return storedItems.map(storedItem => {
        const item_id = storedItem.item_id
        return {...storedItem, sizes: storedSizes[`item_${item_id}`]}
    })
}

exports.insertStoreInventories = async (storeInvs, ownerId) => {
    const allStoreInvSizes = []
    for (const storeInv of storeInvs) {
        const inv = await Inventory.findOne({
            attributes: ['id', 'name'],
            where: {name: storeInv.item_name, owner_id: ownerId},
            include: [
                {
                    model: InventorySize, as: 'sizes',
                    attributes: ['id', 'name'],
                    required: false,
                }
            ]
        })
        const totalAmount = 0
        let toBeStoredSizes = []
        const sizeNames = Object.keys(storeInv.sizes)

        for (const name of sizeNames) {
            const inventorySize = inv.sizes.find(size => size.name === name)
            if(inventorySize){
                const amount = storeInv.sizes[name].quantity ? storeInv.sizes[name].quantity : 0
                toBeStoredSizes.push({
                    inventory_size_id: inventorySize.id,
                    amount: amount ? amount : null
                })
                totalAmount += amount
            }
        }
        const createdStoreInv = await StoreInventory.create({
            inventory_id: inv.id,
            store_id: storeInv.store_id,
            total_amount: totalAmount
        })
        toBeStoredSizes = map(toBeStoredSize => (
            {...toBeStoredSize, store_inventory_id: createdStoreInv.id}
        ))
        allStoreInvSizes.push(...toBeStoredSizes)
    }
    await StoreInventorySize.bulkCreate(allStoreInvSizes)
    
    console.log('Success created')
}