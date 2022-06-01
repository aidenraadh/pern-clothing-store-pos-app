import { useCallback, useEffect, useState } from 'react'
import {Redirect} from 'react-router-dom'
import { Button } from '../Buttons'

import {SimpleCard, PlainCard, StatsCard} from '../Cards'
import {Grid} from '../Layouts'
import { api, errorHandler, formatNum } from '../Utils'

const timeoutIds = {
    sumStoredInvs: null,
    sumProdPrice: null,
}

function DashboardPage(props){
    const [processSumStoredInvs , setProcessSumStoredInvs] = useState(false)
    const [processSumProdPrices , setProcessSumProdPrices] = useState(false)

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
                    if(response.data.storedInvs === undefined){
                        sumStoredInvs()
                    }
                    else{
                        setProcessSumStoredInvs(false)
                        props.setTotalStoredInvs(() => {
                            let total = 0
                            response.data.storedInvs.forEach(storedInv => {
                                total += storedInv.sum
                            })
                            return {
                                storedInvs: response.data.storedInvs,
                                total: total
                            }
                        })
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

    useEffect(() => {
        if(props.totalInvs === undefined){ countInvs() }
    }, [props.totalInvs, countInvs])

    useEffect(() => {
        if(props.totalStoredInvs === undefined){ sumStoredInvs(true) }
    }, [props.totalStoredInvs])    

    useEffect(() => {
        if(props.totalProdPrices === undefined){ sumProdPrices(true) }
    }, [props.totalProdPrices])    


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
                        <span>Total created inventories:</span>
                        <span>{props.totalInvs ? props.totalInvs : '--'}</span>
                    </p>
                }
            />,
            <SimpleCard
                heading={'Stored Inventories'}
                body={<>
                    {props.totalStoredInvs === undefined ? 
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            Calculating, please wait
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
                        <span>Total stored inventories:</span>
                        <span>
                            {props.totalStoredInvs ? formatNum(props.totalStoredInvs.total) : '--'}
                        </span>
                    </p>
                }
            />, 
            <SimpleCard
                heading={'Production Price'}
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
                        <span>Total production prices:</span>
                        <span>
                            {props.totalProdPrices ? 'Rp. '+formatNum(props.totalProdPrices.total) : '--'}
                        </span>
                    </p>
                }
                body={<>
                    {props.totalProdPrices === undefined ?
                        <p className='text-center text-dark-50' style={{fontSize: '1.46rem', padding: '1rem'}}>
                            Calculating, please wait
                        </p> : 
                        <Grid numOfColumns={3} items={props.totalProdPrices.prodPrices.map((prodPrice, index) => ([
                            <StatsCard key={index} type={'light'}
                                number={'Rp. '+formatNum(prodPrice.sum)}
                                icon={'gen017'}
                                title={<span className='text-capitalize'>{prodPrice.storeName}</span>}
                                subTitle={''}
                            />
                        ]))}/>                                            
                    }
                </>}
            />,                      
        ]}/>
    </>)  
}

export default DashboardPage