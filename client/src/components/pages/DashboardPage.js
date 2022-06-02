import { useCallback, useEffect, useMemo, useState } from 'react'
import {Redirect} from 'react-router-dom'
import { Button } from '../Buttons'
import {SimpleCard, PlainCard, StatsCard} from '../Cards'
import { Radio, TextInput } from '../Forms'
import {Grid} from '../Layouts'
import { api, errorHandler, formatNum } from '../Utils'
import {format, startOfMonth , endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Modal } from '../Windows'

const timeoutIds = {
    sumStoredInvs: null,
    sumProdPrice: null,
    sumRevenue: null,
    sumSoldInvs: null
}

function DashboardPage(props){
    const [processSumStoredInvs , setProcessSumStoredInvs] = useState(false)
    const [processSumProdPrices , setProcessSumProdPrices] = useState(false)
    const [processSumRevenue , setProcessSumRevenue] = useState(false)
    const [processSumSoldInvs , setProcessSumSoldInvs] = useState(false)
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
      
    const [revenueTimeRange, setRevenueTimeRange] = useState({
        from: props.totalRevenue && props.totalRevenue.storeRevenues.length ? (
            props.totalRevenue.storeRevenues[0].from
        ) : ranges.today.from,
        to: props.totalRevenue && props.totalRevenue.storeRevenues.length ? (
            props.totalRevenue.storeRevenues[0].to
        ) : ranges.today.to,
    })         
    const [selectedRevenueTimeRange, setSelectedRevenueTimeRange] = useState(() => {
        let value = ''
        Object.entries(ranges).forEach(range => {
            const from = range[1].from
            const to = range[1].to
            if(from === revenueTimeRange.from && to === revenueTimeRange.to){
                value = range[0]
            }
        })
        return value
    })     
    /* Revenue time range modal */
    const [rvnTimeRangeModalShown, setRvnTimeRangeModalShown] = useState(false)

    const [soldInvsTimeRange, setSoldInvsTimeRange] = useState({
        from: props.totalSoldInvs && props.totalSoldInvs.stores.length ? (
            props.totalSoldInvs.stores[0].from
        ) : ranges.today.from,
        to: props.totalSoldInvs && props.totalSoldInvs.stores.length ? (
            props.totalSoldInvs.stores[0].to
        ) : ranges.today.to,
    })     
    const [selectedSoldInvsTimeRange, setSelectedSoldInvsTimeRange] = useState(() => {
        let value = ''
        Object.entries(ranges).forEach(range => {
            const from = range[1].from
            const to = range[1].to
            if(from === soldInvsTimeRange.from && to === soldInvsTimeRange.to){
                value = range[0]
            }
        })
        return value
    })      
    /* Sold inventories time range modal */
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
        setProcessSumStoredInvs(true)
        const delay = initialReq ? 0 : 2000
        timeoutIds.sumStoredInvs = setTimeout(() => {
            api.get('/statistics/sum-stored-inventories')
                .then(response => {
                    if(response.data.sumStoredInvs === undefined){
                        sumStoredInvs()
                    }
                    else{
                        setProcessSumStoredInvs(false)
                        props.setTotalStoredInvs(response.data.sumStoredInvs)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props])    

    const sumProdPrices = useCallback((initialReq = false) => {
        setProcessSumProdPrices(true)
        const delay = initialReq ? 0 : 2000
        timeoutIds.sumStoredInvs = setTimeout(() => {
            api.get('/statistics/sum-production-prices')
                .then(response => {
                    if(response.data.sumProdPrices === undefined){
                        sumProdPrices()
                    }
                    else{
                        setProcessSumProdPrices(false)
                        props.setTotalProdPrices(response.data.sumProdPrices)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props])       

    const sumRevenue = useCallback((initialReq = false) => {
        setProcessSumRevenue(true)
        const delay = initialReq ? 0 : 2000
        timeoutIds.sumRevenue = setTimeout(() => {
            api.get('/statistics/sum-revenue')
                .then(response => {
                    if(response.data.sumRevenue === undefined){
                        sumRevenue()
                    }
                    else{
                        setProcessSumRevenue(false)
                        const totalSumRevenue = {...response.data.sumRevenue}
                        response.data.sumRevenue.storeRevenues.forEach((storeRevenue, index) => {
                            totalSumRevenue.storeRevenues[index].from = storeRevenue.from ? format(storeRevenue.from, 'yyyy-MM-dd') : ''
                            totalSumRevenue.storeRevenues[index].to = storeRevenue.to ? format(storeRevenue.to, 'yyyy-MM-dd') : ''
                        })
                        props.setTotalRevenue(totalSumRevenue)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props])   
    
    const sumSoldInvs = useCallback((initialReq = false) => {
        setProcessSumSoldInvs(true)
        const delay = initialReq ? 0 : 2000
        timeoutIds.sumSoldInvs = setTimeout(() => {
            api.get('/statistics/sum-sold-inventories')
                .then(response => {
                    if(response.data.sumSoldInvs === undefined){
                        sumSoldInvs()
                    }
                    else{
                        setProcessSumSoldInvs(false)
                        const totalSoldInvs = {...response.data.sumSoldInvs}
                        response.data.sumSoldInvs.stores.forEach((store, index) => {
                            totalSoldInvs.stores[index].from = store.from ? format(store.from, 'yyyy-MM-dd') : ''
                            totalSoldInvs.stores[index].to = store.to ? format(store.to, 'yyyy-MM-dd') : ''
                        })
                        props.setTotalSoldInvs(totalSoldInvs)
                    }
                })
                .catch(error => { errorHandler(error) })
        }, delay)
    }, [props])      

    useEffect(() => {
        if(props.totalInvs === undefined){ countInvs() }
    }, [props.totalInvs, countInvs])

    useEffect(() => {
        if(props.totalStoredInvs === undefined && processSumStoredInvs === false){
            sumStoredInvs(true)
        }
    }, [props.totalStoredInvs, sumStoredInvs, processSumStoredInvs])    

    useEffect(() => {
        if(props.totalProdPrices === undefined && processSumProdPrices === false){
            sumProdPrices(true)
        }
    }, [props.totalProdPrices, sumProdPrices, processSumProdPrices])    

    useEffect(() => {
        if(props.totalRevenue === undefined && processSumRevenue === false){
            sumRevenue(true)
        }
    }, [props.totalRevenue, sumRevenue, processSumRevenue])        

    useEffect(() => {
        if(props.totalSoldInvs === undefined && processSumSoldInvs === false){
            sumSoldInvs(true)
        }
    }, [props.totalSoldInvs, sumSoldInvs, processSumSoldInvs])       


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
                    <Button type={'light'} size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: processSumRevenue,
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
                    {props.totalRevenue === undefined ?
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            {props.loc.calculateMsg}
                        </p> : 
                        <Grid numOfColumns={3} items={props.totalRevenue.storeRevenues.map((storeRevenue, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={'Rp. '+formatNum(storeRevenue.sum)}
                                icon={'sale_2'}
                                title={<span className='text-capitalize'>{storeRevenue.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>                                            
                    }
                </>}
            />,     
            <SimpleCard
                heading={props.loc.soldInvs}
                action={<>
                    <Button type={'light'} size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: processSumSoldInvs,
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
                    {props.totalSoldInvs === undefined ?
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            {props.loc.calculateMsg}
                        </p> : 
                        <Grid numOfColumns={3} items={props.totalSoldInvs.stores.map((store, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={formatNum(store.sum)}
                                icon={'cart'}
                                title={<span className='text-capitalize'>{store.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>                                            
                    }
                </>}
            />,                       
            <SimpleCard
                heading={props.loc.storedInvs}
                body={<>
                    {props.totalStoredInvs === undefined ? 
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
                    <Button type={'light'} size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: processSumStoredInvs,
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
                    <Button type={'light'} size={'sm'} iconName={'update'} iconOnly={true} 
                        text={'Refresh'}
                        attr={{
                            disabled: processSumProdPrices,
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
                    {props.totalProdPrices === undefined ?
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
            heading={'Filter'}
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
                                    checked: (range[0] === selectedRevenueTimeRange ? true : false),
                                    onChange: () => {
                                        setRevenueTimeRange({from: range[1].from, to: range[1].to})
                                        setSelectedRevenueTimeRange(range[0])
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
                        disabled: processSumRevenue,
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
            heading={'Filter'}
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
                                        setSelectedSoldInvsTimeRange(range[0])
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
                        disabled: processSumSoldInvs,
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