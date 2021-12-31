import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import {SimpleCard, PlainCard, TabbedCard, StatsCard} from '../Cards'
import { useState } from 'react'

const TestComp = () => {
    const [num, setNum] = useState(0)
    const increment = (prevNum) => (prevNum+1)
    return (<>
        {num}
        <button type="button" onClick={() => {setNum(increment)}}>+</button>
    </>)
}
function TestPage(props){
    return (<>
        <h1>asd</h1>
        <TestComp/>
    </>)
}

export default TestPage