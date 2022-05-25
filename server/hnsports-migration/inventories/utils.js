const models = require('../../models/index')
const Inventory = models.Inventory
const InventorySize = models.InventorySize

exports.getInvSQL = (batch) => {
    batch = (batch * 100) - 100
    const sql = 
        `SELECT `+ 
        `JSON_OBJECT(`+
        `'id', id, 'name', name, 'productionPrices', production_prices, 'sellingPrices', selling_prices) `+
        `FROM items_storage ORDER BY id LIMIT 100 OFFSET ${batch}`
    console.log(sql)
    return sql
}

exports.insertInventories = async (inventories, ownerId) => {
    const unstoredSizes = []
    const sizes = []
    for (const inv of inventories) {
        // Create the inventory
        const createdInv = await Inventory.create({
            name: inv.name, owner_id: ownerId
        })        
        const isProductionPriceValid = (
            inv.productionPrices && (typeof inv.productionPrices === 'object') && 
            Object.keys(inv.productionPrices).length
        )
        const isSellingPriceValid = (
            inv.sellingPrices && (typeof inv.sellingPrices === 'object') && 
            Object.keys(inv.sellingPrices).length
        )       
        if(isProductionPriceValid && isSellingPriceValid){
            let invSizes = [
                ...Object.keys(inv.productionPrices),
                ...Object.keys(inv.sellingPrices)
            ]
            invSizes = invSizes.filter(function(size, pos) {
                return invSizes.indexOf(size) == pos;
            })    

            for (const size of invSizes) {
                sizes.push({
                    inventory_id: createdInv.id, name: size,
                    production_price: inv.productionPrices[size] ? inv.productionPrices[size] : null,
                    selling_price: inv.sellingPrices[size] ? inv.sellingPrices[size] : null 
                })
            }
        }
    }
    await InventorySize.bulkCreate(sizes)
    console.log('complete')
}