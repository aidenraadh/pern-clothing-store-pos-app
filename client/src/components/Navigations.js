import {useCallback, useEffect, useRef, useState} from 'react'
import {NavLink, useLocation} from 'react-router-dom'
import SVGIcons from './SVGIcons.js';
import {UserThumbnail} from './Misc.js';

function Navigations(props){
    const location = useLocation()
	const toggleSidebar = props.toggleSidebar
	const topbarRef = useRef()
	const subItemRefs = useRef({}) 
	// Contains key and links all side bar item that has sub items
	const subItemData = useRef((() => {
		const data = []
		props.sidebarItems.forEach((item, itemKey) => {
			if(item.subMenu !== undefined){
				data.push({
					key: itemKey.toString(),
					links: item.subMenu.map(subItem => subItem.path)
				})
			}
		})
		return data		
	})())
	// All heights of sidebar item's sub items
	const [subItemsHeights, setSubItemsHeights] = useState(() => {
		const heights = {}
		subItemData.current.forEach(data => {
			heights[data.key] = 0 
		})
		return heights
	})
	const [activeSubItemKey, setActiveSubItemKey] = useState(null)
	// Expand/collapse the target sub items and collapse the rest
	const toggleSubItemHeight = useCallback(itemKey => {
		setSubItemsHeights(state => {
			// When the item key is null, dont change the state
			if(itemKey === null){
				return state
			}
			const newHeights = {}
			for (const key in state) {
				if(key === itemKey){
					newHeights[key] = (state[key] === 0 ? subItemRefs.current[key].scrollHeight + 'px' : 0)
				}
				else{
					newHeights[key] = 0
				}
			}
			return newHeights
		})
	}, []) 	
	// Collapse all sub items
	const collapedAllSubItems = useCallback(() => {
		setSubItemsHeights(state => {
			const newHeights = {}
			for (const key in state) { newHeights[key] = 0 }
			return newHeights
		})
	}, [])

	// Expand the sidebar when sub items is expanded
	useEffect(() => {
		let expandSidebar = false
		for (const key in subItemsHeights) {
			if(subItemsHeights[key] !== 0){
				expandSidebar = true
			}
		}
		if(expandSidebar){
			toggleSidebar(expandSidebar)
		}
	}, [subItemsHeights])

    useEffect(() => {
		// Hide the sidebar when the route is changed
		toggleSidebar(false)
		// Change active sub item key based on the route path
		// If not found, set it to null
		setActiveSubItemKey(state => {
			const data = subItemData.current.find(data => data.links.includes(location.pathname))
			return data === undefined ? null : data.key
		})
    }, [location, toggleSidebar])  	

	useEffect(() => {
		// When the sidebar is collapsed, collapsed the sub items
		if(props.sidebarShown === false){
			collapedAllSubItems()
		}
		// When the sidebar is expanded, expand the sub items
		else if(props.sidebarShown === true){
			toggleSubItemHeight(activeSubItemKey)
		}
	}, [props.sidebarShown, activeSubItemKey])

	useEffect(() => {
		window.onscroll = e => {
			if(document.body.scrollTop > 0 || document.documentElement.scrollTop > 0){
				if(!topbarRef.current.classList.contains('shadowed')){
					topbarRef.current.classList.add('shadowed')
				}				
			}
			else{
				topbarRef.current.classList.remove('shadowed')
			}
		}
	}, [])

	return (<>
		{/*----------- Toolbar -----------*/}
		<header className='toolbar'>
			<h1 className='page-heading'>
				{
					props.pageHeading.icon === '' ? '' :
					<SVGIcons name={props.pageHeading.icon} color={'blue'}/>
				}
				<span className='title text-semi-bold'>{props.pageHeading.title}</span>
			</h1>
			<section></section>
		</header>	
		{/*----------- Topbar -----------*/}
		<section className="topbar" ref={topbarRef}>
			<div className="left-widgets">
				<button type="button" className="topbar-item show-sidebar-btn"
				onClick={() => {props.toggleSidebar(state => !state)}}>
					<SVGIcons
						name={'article'} color={'blue'}
						attr={{style: {width: '3rem'}}}
					/>
				</button>
				<ul>
					{props.leftWidgets.map((item, key) => (
						<li key={key}>{item}</li>
					))}
				</ul>				
			</div>
			<ul className="right-widgets">
				{props.rightWidgets.map((item, key) => (
					<li key={key} className='topbar-item'>{item}</li>
				))}
			</ul>
		</section>
		{/*----------- Sidebar -----------*/}
		<aside className={'sidebar'+(props.sidebarShown ? ' shown' : '')}>
			<button type="button" className="sidebar-item toggle-sidebar-btn"
			onClick={() => {props.toggleSidebar(state => !state)}}>
				<SVGIcons
					name={'angle_double_right'} color={'blue'}
					attr={{style: {width: '3rem'}}}
				/>
			</button>								
			<ul className="sidebar-items-container">
			{props.sidebarItems.map((item, itemKey) => {
				if(item.subMenu !== undefined){
					return (
						<li key={itemKey}>
							<button className={`sidebar-item${activeSubItemKey === itemKey.toString() ? ' active' : ''}`}
							onClick={() => {toggleSubItemHeight(`${itemKey}`)}}
							type='button'>
								<SVGIcons classes={'menu-icon'} name={item.icon} color={''} />
								<span className="text">{item.text}</span> 
								<SVGIcons classes={'expand-icon'} name='angle_down' attr={{style: {
									transform: `rotate(${subItemsHeights[`${itemKey}`] ? '0deg' : '-90deg'})`
								}}}/>
							</button>			
							<ul className='sub-menu' ref={el => (subItemRefs.current[`${itemKey}`] = el)} 
							style={{maxHeight: subItemsHeights[`${itemKey}`]}}>
								{item.subMenu.map((subItem, subItemKey) => (
									<li key={subItemKey}>
										<NavLink className={({isActive}) => (`sidebar-item`+(isActive ? ' active': ''))} 
										to={subItem.path} exact="true"> 
											<span className="text">{subItem.text}</span> 
										</NavLink> 																		
									</li>										
								))}
							</ul>											
						</li>							
					)
				}
				return (
					<li key={itemKey}>
						<NavLink to={item.path} exact="true"
						className={({isActive}) => (`sidebar-item`+(isActive ? ' active': ''))}> 
							<SVGIcons classes={'menu-icon'} name={item.icon} color={''} />
							<span className="text">{item.text}</span> 
						</NavLink> 						
					</li>							
				)					
			})}	
			</ul>		
		</aside>
	</>)	
}

Navigations.defaultProps = {
	pageHeading: {title: '', icon: ''},
	leftWidgets: [], // Array of string or JSX
	rightWidgets: [
		<UserThumbnail 
		    userName={'Hi, Aiden'}
		/> 		
	],
	// Array of objects
	sidebarItems: [
		{
			text: 'Menu', link: '/#', icon: 'layers'
		},
		{
			text: 'Menu with submenu', icon: 'layers', subMenu: [
				{text: 'Sub Menu 1', link: '/#'},
				{text: 'Sub Menu 2', link: '/#'},
			]
		},
		{
			text: 'Another Menu', link: '/#', icon: 'layers'
		},			
	] // Array of objects
}

export default Navigations