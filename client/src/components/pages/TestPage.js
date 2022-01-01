import {api, errorHandler} from '../Utils.js'
import {logout} from '../Auth'
import {SimpleCard, PlainCard, StatsCard, ToolCard, KanbanBoard} from '../Cards'
import { useState } from 'react'
import { Buttons } from '../Buttons.js'

const TestComp = (props) => {
    const [num, setNum] = useState(props.num)
    const increment = (prevNum) => (prevNum+1)
    return (<>
        {num}
        <button type="button" onClick={() => {setNum(increment)}}>+</button>
    </>)
}
function TestPage(props){
    const [expand, setExpand] = useState(false)
    return (<>
        <h1>asd</h1>
        <ToolCard
            expand={expand}
            toggleButton={<Buttons 
                settings={{size: 'sm', type: 'light', color: 'blue'}} 
                icon={{name: 'angle_up', iconOnly: true}}
                classes={'toggle-btn'}
                attr={{
                    onClick: () => {setExpand(state => !state)}
                }}                
            />}
        />
        <KanbanBoard />
    </>)
}

export default TestPage