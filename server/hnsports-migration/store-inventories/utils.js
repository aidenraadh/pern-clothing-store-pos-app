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
    return sql
}

exports.getItemSizes = (storedItems) => {
    const json_object_val = []
    const store_id = storedItems[0]['store_id']
    storedItems.forEach(storedItem => {
        json_object_val.push(`"item_${storedItem.item_id}"`)
        json_object_val.push(`JSON_EXTRACT(items, "$.${storedItem.item_id}")`)
    })
    return `SELECT JSON_OBJECT(${json_object_val.join(', ')}) FROM stores WHERE id=${store_id}`
}