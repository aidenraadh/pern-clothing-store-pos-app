import { useCallback, useEffect, useMemo, useState, useReducer } from 'react'
import {Redirect} from 'react-router-dom'
import { Button } from '../Buttons'
import {SimpleCard, PlainCard, StatsCard} from '../Cards'
import { Radio, TextInput } from '../Forms'
import {Grid} from '../Layouts'
import { api, errorHandler, formatNum, getQueryString } from '../Utils'
import {format, startOfMonth , endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Modal } from '../Windows'

const timeoutIds = {
    sumStoredInvs: null,
    sumProdPrice: null,
    sumRevenue: null,
    sumSoldInvs: null
}

function DashboardPage(props){
    const ranges = useMemo(() => {
        const today = new Date()
        return {
            today: {
                label: props.loc.today,
                from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd')
            },
            thisMonth: {
                label: props.loc.thisMonth,
                from: format(startOfMonth(today), 'yyyy-MM-dd'),
                to: format(endOfMonth(today), 'yyyy-MM-dd')
            },
            thisYear: {
                label: props.loc.thisYear,
                from: format(startOfYear(today), 'yyyy-MM-dd'),
                to: format(endOfYear(today), 'yyyy-MM-dd')
            },
            custom: {label: props.loc.custom, from: '', to: ''}
        }
    }, [props.loc.today, props.loc.thisMonth, props.loc.thisYear, props.loc.custom])      
    /* Revenue time range */
    const [revenueTimeRange, setRevenueTimeRange] = useState({
        from: props.totalRevenue && props.totalRevenue.storeRevenues.length ? (
            props.totalRevenue.storeRevenues[0].from
        ) : ranges.today.from,
        to: props.totalRevenue && props.totalRevenue.storeRevenues.length ? (
            props.totalRevenue.storeRevenues[0].to
        ) : ranges.today.to,
    })         
    const [selectedRevenueTimeRange, setSelectedRevenueTimeRange] = useState('')     
    const [rvnTimeRangeModalShown, setRvnTimeRangeModalShown] = useState(false)
    /* Sold inventories time range */
    const [soldInvsTimeRange, setSoldInvsTimeRange] = useState({
        from: props.totalSoldInvs && props.totalSoldInvs.stores.length ? (
            props.totalSoldInvs.stores[0].from
        ) : ranges.today.from,
        to: props.totalSoldInvs && props.totalSoldInvs.stores.length ? (
            props.totalSoldInvs.stores[0].to
        ) : ranges.today.to,
    })     
    const [selectedSoldInvsTimeRange, setSelectedSoldInvsTimeRange] = useState('')      
    const [soldInvsTimeRangeModalShown, setSoldInvsTimeRangeModalShown] = useState(false)    


    const countInvs = useCallback(() => {
        // setDisableBtn(true)
        api.get('/statistics/total-inventories')
            .then(response => {
                props.setTotalInvs(response.data.totalInvs ? response.data.totalInvs.total : 0)
                // setDisableBtn(false)
            })
            .catch(error => {
                errorHandler(error)                
            })
    }, [props])

    const sumStoredInvs = useCallback((initialReq = false) => {
        props.setTotalStoredInvs(null)
        const delay = initialReq ? 0 : 3000
        timeoutIds.sumStoredInvs = setTimeout(() => {
            api.get('/statistics/sum-stored-inventories')
                .then(response => {
                    if(response.data.sumStoredInvs === undefined){
                        sumStoredInvs()
                    }
                    else{
                        props.setTotalStoredInvs(response.data.sumStoredInvs)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props])    

    const sumProdPrices = useCallback((initialReq = false) => {
        props.setTotalProdPrices(null)
        const delay = initialReq ? 0 : 3000
        timeoutIds.sumStoredInvs = setTimeout(() => {
            api.get('/statistics/sum-production-prices')
                .then(response => {
                    if(response.data.sumProdPrices === undefined){
                        sumProdPrices()
                    }
                    else{
                        props.setTotalProdPrices(response.data.sumProdPrices)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props])       

    const sumRevenue = useCallback((initialReq = false) => {
        props.setTotalRevenue(null)
        const delay = initialReq ? 0 : 3000
        timeoutIds.sumRevenue = setTimeout(() => {
            api.get(`/statistics/sum-revenue${getQueryString(revenueTimeRange)}`)
                .then(response => {
                    if(response.data.sumRevenue === undefined){
                        sumRevenue()
                    }
                    else{
                        const totalSumRevenue = {...response.data.sumRevenue}
                        if(totalSumRevenue.storeRevenues.length){
                            setRevenueTimeRange({
                                from: totalSumRevenue.storeRevenues[0].from,
                                to: totalSumRevenue.storeRevenues[0].to,
                            })
                        }                          
                        props.setTotalRevenue(totalSumRevenue)                      
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props, revenueTimeRange])   
    
    const sumSoldInvs = useCallback((initialReq = false) => {
        props.setTotalSoldInvs(null)
        const delay = initialReq ? 0 : 3000
        timeoutIds.sumSoldInvs = setTimeout(() => {
            api.get(`/statistics/sum-sold-inventories${getQueryString(soldInvsTimeRange)}`)
                .then(response => {
                    if(response.data.sumSoldInvs === undefined){
                        sumSoldInvs()
                    }
                    else{
                        const totalSoldInvs = {...response.data.sumSoldInvs}
                        if(totalSoldInvs.stores.length){
                            setSoldInvsTimeRange({
                                from: totalSoldInvs.stores[0].from,
                                to: totalSoldInvs.stores[0].to,
                            })
                        } 
                        props.setTotalSoldInvs(totalSoldInvs)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props, soldInvsTimeRange])      

    useEffect(() => {
        if(props.totalInvs === undefined){ countInvs() }
    }, [props.totalInvs, countInvs])

    useEffect(() => {
        if(props.totalStoredInvs === undefined){
            sumStoredInvs(true)
        }
    }, [props.totalStoredInvs, sumStoredInvs])    

    useEffect(() => {
        if(props.totalProdPrices === undefined){
            sumProdPrices(true)
        }
    }, [props.totalProdPrices, sumProdPrices])    

    useEffect(() => {
        if(props.totalRevenue === undefined){
            sumRevenue(true)
        }
    }, [props.totalRevenue, sumRevenue])        

    useEffect(() => {
        if(props.totalSoldInvs === undefined){
            sumSoldInvs(true)
        }
    }, [props.totalSoldInvs, sumSoldInvs])     
    
    // If revenueTimeRange changed, change also selectedRevenueTimeRange
    useEffect(() => {
        setSelectedRevenueTimeRange(() => {
            let value = 'custom'
            Object.entries(ranges).forEach(range => {
                const from = range[1].from
                const to = range[1].to
                if(from === revenueTimeRange.from && to === revenueTimeRange.to){
                    value = range[0]
                }
            })
            return value            
        })
    }, [revenueTimeRange, ranges])    
    // If soldInvsTimeRange changed, change also selectedSoldInvsTimeRange
    useEffect(() => {
        setSelectedSoldInvsTimeRange(() => {
            let value = 'custom'
            Object.entries(ranges).forEach(range => {
                const from = range[1].from
                const to = range[1].to
                if(from === soldInvsTimeRange.from && to === soldInvsTimeRange.to){
                    value = range[0]
                }
            })
            return value            
        })
    }, [soldInvsTimeRange, ranges])        

    useEffect(() => {
        return () => {
            // Clear all timeout
            for (const key in timeoutIds) {
                clearTimeout(timeoutIds[key])
            }
        };
    }, [])

    if(props.user.role.name === 'employee'){
        return <Redirect to={'/store-inventories'}/>
    }
    return (<>
        <Grid numOfColumns={1} items={[
            <PlainCard
                body={
                    <p className='flex-row items-center content-space-between'>
                        <span>{props.loc.totalCreatedInvs}:</span>
                        <span>{props.totalInvs ? props.totalInvs : '--'}</span>
                    </p>
                }
            />,            
            <SimpleCard
                heading={props.loc.revenue}
                action={<>
                    <Button  size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: props.totalRevenue ? false : true,
                            onClick: () => {sumRevenue(true)}
                        }} 
                    />                  
                </>}                
                footer={
                    <p className='flex-row items-center content-space-between'>
                        <span>{props.loc.totalRevenue}:</span>
                        <span>
                            {props.totalRevenue ? 'Rp. '+formatNum(props.totalRevenue.total) : '--'}
                        </span>
                    </p>
                }
                body={<>
                    {props.totalRevenue === undefined || props.totalRevenue === null ?
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            {props.loc.calculateMsg}
                        </p> : 
                        <>
                        <section className='flex-row items-center content-end' style={{marginBottom: '1.4rem'}}>
                            <Button size={'sm'} text={'Filter'} attr={{
                                onClick: () => {setRvnTimeRangeModalShown(true)}
                            }}/>
                        </section>
                        <Grid numOfColumns={3} items={props.totalRevenue.storeRevenues.map((storeRevenue, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={'Rp. '+formatNum(storeRevenue.sum)}
                                icon={'sale_2'}
                                title={<span className='text-capitalize'>{storeRevenue.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>   
                        </>                                         
                    }
                </>}
            />,     
            <SimpleCard
                heading={props.loc.soldInvs}
                action={<>
                    <Button  size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: props.totalSoldInvs ? false : true,
                            onClick: () => {sumSoldInvs(true)}
                        }} 
                    />                  
                </>}                
                footer={
                    <p className='flex-row items-center content-space-between'>
                        <span>{props.loc.totalSoldInvs}:</span>
                        <span>
                            {props.totalSoldInvs ? formatNum(props.totalSoldInvs.total) : '--'}
                        </span>
                    </p>
                }
                body={<>
                    {props.totalSoldInvs === undefined || props.totalSoldInvs === null ?
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            {props.loc.calculateMsg}
                        </p> : 
                        <>
                        <section className='flex-row items-center content-end' style={{marginBottom: '1.4rem'}}>
                            <Button size={'sm'} text={'Filter'} attr={{
                                onClick: () => {setSoldInvsTimeRangeModalShown(true)}
                            }}/>
                        </section>                        
                        <Grid numOfColumns={3} items={props.totalSoldInvs.stores.map((store, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={formatNum(store.sum)}
                                icon={'cart'}
                                title={<span className='text-capitalize'>{store.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>   
                        </>                                         
                    }
                </>}
            />,                       
            <SimpleCard
                heading={props.loc.storedInvs}
                body={<>
                    {props.totalStoredInvs === undefined || props.totalStoredInvs === null ? 
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            {props.loc.calculateMsg}
                        </p> : 
                        <Grid numOfColumns={3} items={props.totalStoredInvs.storedInvs.map((storedInv, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={formatNum(storedInv.sum)}
                                icon={'gen017'}
                                title={<span className='text-capitalize'>{storedInv.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>
                    }                  
                </>}
                action={<>
                    <Button  size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: props.totalStoredInvs ? false : true,
                            onClick: () => {sumStoredInvs(true)}
                        }} 
                    />                  
                </>}
                footer={
                    <p className='flex-row items-center content-space-between'>
                        <span>{props.loc.totalStoredInvs}:</span>
                        <span>
                            {props.totalStoredInvs ? formatNum(props.totalStoredInvs.total) : '--'}
                        </span>
                    </p>
                }
            />, 
            <SimpleCard
                heading={props.loc.prodPrices}
                action={<>
                    <Button  size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: props.totalProdPrices ? false : true,
                            onClick: () => {sumProdPrices(true)}
                        }} 
                    />                  
                </>}                
                footer={
                    <p className='flex-row items-center content-space-between'>
                        <span>{props.loc.totalProdPrices}:</span>
                        <span>
                            {props.totalProdPrices ? 'Rp. '+formatNum(props.totalProdPrices.total) : '--'}
                        </span>
                    </p>
                }
                body={<>
                    {props.totalProdPrices === undefined || props.totalProdPrices === null ?
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            {props.loc.calculateMsg}
                        </p> : 
                        <Grid numOfColumns={3} items={props.totalProdPrices.prodPrices.map((prodPrice, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={'Rp. '+formatNum(prodPrice.sum)}
                                icon={'sale_1'}
                                title={<span className='text-capitalize'>{prodPrice.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>                                            
                    }
                </>}
            />,                                 
        ]}/>
        <Modal
            heading={'Filter '+props.loc.trnscDate}
            body={
                <Grid numOfColumns={1} items={[             
                    <section>
                        <div className='flex-row items-center wrap'>
                            {Object.entries(ranges).map((range, index) => (
                                <Radio key={index} label={range[1].label} containerAttr={{style:{ margin: '0 1.4rem 1rem 0'}}}
                                formAttr={{value: range[0],
                                    checked: (range[0] === selectedRevenueTimeRange ? true : false),
                                    onChange: () => {
                                        setRevenueTimeRange({from: range[1].from, to: range[1].to})
                                    }
                                }}/>
                            ))}
                                                                       
                        </div>
                        <TextInput size={'md'} label={props.loc.from} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedRevenueTimeRange !== 'custom' ? true : false,
                            value: revenueTimeRange.from,
                            onChange: (e) => {
                                setRevenueTimeRange((state) => ({...state, from: e.target.value}))
                            }
                        }}/>
                        <TextInput size={'md'} label={props.loc.to} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedRevenueTimeRange !== 'custom' ? true : false,
                            value: revenueTimeRange.to,
                            onChange: (e) => {
                                setRevenueTimeRange((state) => ({...state, to: e.target.value}))
                            }
                        }}/>                         
                    </section>,                
                ]}/>
            }        
            footer={
                <Button size={'sm'} text={props.loc.calculate} attr={{
                        disabled: props.totalRevenue ? false : true,
                        onClick: () => {
                            setRvnTimeRangeModalShown(false)
                            sumRevenue(true)
                        }
                    }}
                />                
            }
            shown={rvnTimeRangeModalShown}
            toggleModal={() => {setRvnTimeRangeModalShown(state => !state)}}
        />    
        <Modal
            heading={'Filter'+props.loc.trnscDate}
            body={
                <Grid numOfColumns={1} items={[             
                    <section>
                        <h6 className='text-medium text-dark-65 text-capitalize' style={{fontSize: '1.56rem', marginBottom: '1rem'}}>
                            {props.loc.trnscDate}
                        </h6>
                        <hr style={{marginBottom: '1rem'}}/>
                        <div className='flex-row items-center wrap'>
                            {Object.entries(ranges).map((range, index) => (
                                <Radio key={index} label={range[1].label} containerAttr={{style:{ margin: '0 1.4rem 1rem 0'}}}
                                formAttr={{value: range[0],
                                    checked: (range[0] === selectedSoldInvsTimeRange ? true : false),
                                    onChange: () => {
                                        setSoldInvsTimeRange({from: range[1].from, to: range[1].to})
                                    }
                                }}/>
                            ))}                                   
                        </div>
                        <TextInput size={'md'} label={props.loc.from} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedSoldInvsTimeRange !== 'custom' ? true : false,
                            value: soldInvsTimeRange.from,
                            onChange: (e) => {
                                setSoldInvsTimeRange((state) => ({...state, from: e.target.value}))
                            }
                        }}/>
                        <TextInput size={'md'} label={props.loc.to} containerAttr={{style: {marginBottom: '1rem'}}} formAttr={{
                            type: 'date', disabled: selectedSoldInvsTimeRange !== 'custom' ? true : false,
                            value: soldInvsTimeRange.to,
                            onChange: (e) => {
                                setSoldInvsTimeRange((state) => ({...state, to: e.target.value}))
                            }
                        }}/>                         
                    </section>,                
                ]}/>
            }        
            footer={
                <Button size={'sm'} text={props.loc.calculate} attr={{
                        disabled: props.totalSoldInvs ? false : true,
                        onClick: () => {
                            setSoldInvsTimeRangeModalShown(false)
                            sumSoldInvs(true)
                        }
                    }}
                />                
            }
            shown={soldInvsTimeRangeModalShown}
            toggleModal={() => {setSoldInvsTimeRangeModalShown(state => !state)}}
        />                 
    </>)  
}
export default DashboardPage