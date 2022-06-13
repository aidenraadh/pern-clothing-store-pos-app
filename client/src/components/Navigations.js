import {useEffect} from 'react'
import {NavLink, useLocation} from 'react-router-dom'
import SVGIcons from './SVGIcons.js';

function Navigations(props){
    const location = useLocation()
	const toggleSidebar = props.toggleSidebar
	// Hide the sidebar when the route is changed
    useEffect(() => {
		toggleSidebar(false)
    }, [location, toggleSidebar])   	

	return (
		<nav>
			<section className="topbar">
				<a href={props.appUrl}
				className="topbar-item app-brand flex-row content-center items-center">
					{props.appLogoUrl ? <img src={props.appLogoUrl} alt={'User avatar'} /> : ''}
				</a>
				<div className="left-widgets">
					<button type="button" 
					className="topbar-item show-sidebar-btn"
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

			<section className={'sidebar'+(props.sidebarShown ? ' shown' : '')}>
				<button type="button" className="sidebar-item toggle-sidebar-btn"
				onClick={() => {props.toggleSidebar(state => !state)}}>
					<SVGIcons
						name={'angle_double_right'} color={'blue'}
						attr={{style: {width: '3rem'}}}
					/>
				</button>								
				<ul className="sidebar-items-container">
				{props.sidebarItems.map((item, key) => (
					<li key={key}>
						<NavLink to={`/${item.link ? item.link : ''}`} exact="true"
						className={({isActive}) => (`sidebar-item`+(isActive ? ' active': ''))}> 
							<SVGIcons name={item.icon ? item.icon : 'layers'} color={''} />
							<span className="text">{item.text ? item.text : 'Menu'}</span> 
						</NavLink> 						
					</li>
				))}
				</ul>		
			</section>
		</nav>	
	)	
}

Navigations.defaultProps = {
	appUrl: 'Test App', // String
	appLogoUrl: '', // String
	leftWidgets: [], // Array of string or JSX
	rightWidgets: [], // Array of string or JSX
	sidebarItems: [] // Array of objects
}

export default Navigations